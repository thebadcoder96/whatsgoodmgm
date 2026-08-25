import type { Fetcher, NormalizedEvent, SourceDoc } from './types'
import { chicagoToUtc, localDay } from '../lib/normalize'

const MONTHS: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
}
const MONTH_RE = '(january|february|march|april|may|june|july|august|september|october|november|december)'

function tag(block: string, name: string): string | undefined {
  const m = block.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`, 'i'))
  return m?.[1]?.trim()
}

// The live feed (captured 2026-08-25) doesn't use CDATA anywhere, but tag() tolerates it
// defensively in case another CivicPlus instance's feed does.
const decodeEntities = (s: string): string =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')

// <description> is HTML, entity-encoded, with "Event date:"/"Event Time:"/"Location:"/"Description:"
// labels separated by <br> tags (see fixture). Decode entities, turn <br> into line breaks, strip
// remaining tags (<strong> etc.), and return trimmed non-empty lines for label-based extraction.
function descLines(rawDesc: string): string[] {
  return decodeEntities(rawDesc)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
}

// CivicPlus's <calendarEvent:Location> namespaced field concatenates the street line and the
// city/state/zip line with no separator ("212 South Main StreetWetumpka, AL 36092" — verified in
// the live fixture). The <description> HTML preserves them as distinct <br>-delimited lines, so
// the address is built from there instead of the squished namespaced field.
function extractAddress(lines: string[]): string | undefined {
  const locIdx = lines.findIndex(l => /^Location:?$/i.test(l))
  if (locIdx === -1) return undefined
  const descIdx = lines.findIndex((l, i) => i > locIdx && /^Description:?$/i.test(l))
  const end = descIdx === -1 ? lines.length : descIdx
  const addrLines = lines.slice(locIdx + 1, end)
  return addrLines.length ? addrLines.join(', ') : undefined
}

// Text following a specific label on its description line (e.g. "Event date: August 28, 2026" ->
// "August 28, 2026", scoped to that line). Anchoring to the label matters: descriptions can carry
// competing dates ("Register by: July 1, 2026") that must never be mistaken for the event date.
function labeledText(lines: string[], label: RegExp): string | undefined {
  for (const l of lines) {
    const m = l.match(label)
    if (m) return l.slice(m.index! + m[0].length).trim() || undefined
  }
  return undefined
}

function extractDescriptionBody(lines: string[]): string | undefined {
  const descIdx = lines.findIndex(l => /^Description:?$/i.test(l))
  if (descIdx === -1) return undefined
  return lines.slice(descIdx + 1).join(' ').trim() || undefined
}

const toHour24 = (h: string, ampm: string): number => (parseInt(h, 10) % 12) + (ampm.toUpperCase() === 'PM' ? 12 : 0)

// Range with the start date FIRST: "August 28, 2026 - August 30, 2026", or the shorthand forms
// "August 28 - August 30, 2026" / "August 28 - 30, 2026" where the start day's year (and the end
// day's month) only appear on the trailing date and must be borrowed. An unanchored single-date
// regex mis-parses the year-on-trailing-date shorthand: the start date has no year of its own, so
// the first match lands on the END date and the event publishes under the wrong day.
const RANGE_RE = new RegExp(
  `^\\s*${MONTH_RE}\\s+(\\d{1,2}),?\\s*(\\d{4})?\\s*[-\\u2013]\\s*(?:${MONTH_RE}\\s+)?(\\d{1,2}),?\\s*(\\d{4})`, 'i')
// Anchored to the start of the date text so a later date in it can never win — fail closed.
const SINGLE_RE = new RegExp(`^\\s*${MONTH_RE}\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i')

/** Start day (YYYY-MM-DD) of a CivicPlus date text; single-start model — a range's end is ignored. */
function parseStartDay(text: string): string | null {
  const r = text.match(RANGE_RE)
  if (r) return `${r[3] ?? r[6]}-${MONTHS[r[1].toLowerCase()]}-${r[2].padStart(2, '0')}`
  const m = text.match(SINGLE_RE)
  return m ? `${m[3]}-${MONTHS[m[1].toLowerCase()]}-${m[2].padStart(2, '0')}` : null
}

export function parseCivicplusRss(xml: string): NormalizedEvent[] {
  const out: NormalizedEvent[] = []
  for (const item of xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []) {
    try {
      const title = tag(item, 'title') ? decodeEntities(tag(item, 'title')!) : undefined
      // Links need decoding too: RSS-compliant feeds escape & as &amp;, so a two-param
      // link would otherwise surface as a broken ...?EID=1&amp;o=2 sourceUrl.
      const rawLink = tag(item, 'link')
      const link = rawLink ? decodeEntities(rawLink) : undefined
      if (!title || !link) {
        console.warn(`  SKIP civicplus item: missing title or link`)
        continue
      }

      const rawDesc = tag(item, 'description')
      const lines = rawDesc ? descLines(rawDesc) : []

      // <calendarEvent:EventDates>/<EventTimes> are structured fields CivicPlus emits alongside
      // the HTML description. NOT <pubDate> — verified in the live fixture that pubDate is the
      // publish/edit timestamp (e.g. "Fri, 17 Jul 2026") while the actual event date is months
      // later ("August 28, 2026"), so pubDate must never be used as the event date. When the
      // structured tag is absent, the fallback is anchored to the description's "Event date:" /
      // "Event Time:" labels — never a free scan of the whole text, which could latch onto a
      // competing date like a "Register by:" deadline. No label -> no date -> drop, never guess.
      const dateField = tag(item, 'calendarEvent:EventDates')
      const dateSource = dateField ?? labeledText(lines, /event dates?\s*:/i)
      const day = dateSource ? parseStartDay(dateSource) : null
      if (!day) {
        console.warn(`  SKIP civicplus item (no parseable date): ${title}`)
        continue
      }

      const timeField = tag(item, 'calendarEvent:EventTimes')
      const timeSource = timeField ?? labeledText(lines, /event times?\s*:/i) ?? ''
      const times = [...timeSource.matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)]
      const start = times[0]
        ? `${day} ${String(toHour24(times[0][1], times[0][3])).padStart(2, '0')}:${times[0][2]}:00`
        : day
      const end = times[1]
        ? `${day} ${String(toHour24(times[1][1], times[1][3])).padStart(2, '0')}:${times[1][2]}:00`
        : undefined

      out.push({
        title,
        startDateTime: chicagoToUtc(start),
        ...(end ? { endDateTime: chicagoToUtc(end) } : {}),
        description: extractDescriptionBody(lines)?.slice(0, 500),
        sourceType: 'civicplus',
        sourceUrl: link,
        // Wetumpka's feed has no distinct venue-name field, only a street address — the city-level
        // name is an intentional placeholder; address is the real parsed value when present.
        venue: { name: 'Wetumpka', address: extractAddress(lines) ?? 'Wetumpka, AL' },
      })
    } catch (err) {
      console.warn(`  SKIP malformed civicplus item (${err instanceof Error ? err.message : err})`)
    }
  }
  return out
}

export const civicplusFetcher: Fetcher = {
  platform: 'civicplus',
  async fetchUpcoming(source: SourceDoc, windowDays: number): Promise<NormalizedEvent[]> {
    const res = await fetch(source.identifier)
    if (!res.ok) throw new Error(`civicplus: HTTP ${res.status}`)
    // Montgomery-local days, not UTC slices — after ~6pm local the UTC date is already tomorrow,
    // and a naive "now - 24h" lower bound would keep yesterday-local events (see tribe/statsapi).
    const todayLocal = localDay(new Date().toISOString())
    const endLocal = localDay(new Date(Date.now() + windowDays * 86_400_000).toISOString())
    return parseCivicplusRss(await res.text())
      .filter(e => { const d = localDay(e.startDateTime); return d >= todayLocal && d <= endLocal })
  },
}

import type { Fetcher, NormalizedEvent, SourceDoc } from './types'
import { chicagoToUtc, localDay } from '../lib/normalize'

const decodeEntities = (s: string): string =>
  s.replace(/&#8217;/g, '’').replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“').replace(/&#8221;/g, '”')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')

// Tag-stripped remains of Tribe's schedule/subscribe-widget blocks ("@ Add to calendar Google
// Calendar iCalendar ..."); mccpl descriptions are nothing but this chrome and must map to undefined.
const WIDGET_CHROME = /@?\s*Add to calendar(?:\s+(?:Google Calendar|iCalendar|Outlook 365|Outlook Live))+\s*/gi

const stripHtml = (s?: string): string | undefined => {
  if (!s) return undefined
  const text = decodeEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  return text.replace(WIDGET_CHROME, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^@\s+/, '') || undefined // schedule block's lone "@" separator
}

export function mapTribeEvent(e: any): NormalizedEvent | null {
  if (!e?.title || !e?.start_date || !e?.url) return null
  const venue = e.venue && !Array.isArray(e.venue) && e.venue.venue
    ? { name: e.venue.venue, address: [e.venue.address, e.venue.city].filter(Boolean).join(', ') || undefined }
    : undefined
  return {
    title: decodeEntities(e.title),
    startDateTime: chicagoToUtc(e.start_date),
    ...(e.end_date ? { endDateTime: chicagoToUtc(e.end_date) } : {}),
    description: stripHtml(e.description)?.slice(0, 1000),
    priceText: e.cost || undefined,
    imageUrl: e.image?.url || undefined,
    sourceType: 'tribe',
    sourceUrl: e.url,
    ...(venue ? { venue } : {}),
  }
}

const MAX_PAGES = 5 // hard cap: no runaway pagination

export const tribeFetcher: Fetcher = {
  platform: 'tribe',
  async fetchUpcoming(source: SourceDoc, windowDays: number): Promise<NormalizedEvent[]> {
    const base = source.identifier.replace(/\/$/, '')
    // Montgomery-local days, not UTC slices — after ~6pm local the UTC date is already tomorrow.
    const end = localDay(new Date(Date.now() + windowDays * 86_400_000).toISOString())
    const today = localDay(new Date().toISOString())
    const out: NormalizedEvent[] = []
    let url: string | null =
      `${base}/wp-json/tribe/events/v1/events?per_page=50&start_date=${today}&end_date=${end}`
    let page = 0
    while (url && page < MAX_PAGES) {
      const res: Response = await fetch(url)
      if (!res.ok) throw new Error(`tribe: HTTP ${res.status} at ${url}`)
      const data: any = await res.json()
      for (const e of data.events ?? []) {
        let mapped: NormalizedEvent | null
        // One event with an unparseable date must not sink the whole batch.
        try { mapped = mapTribeEvent(e) } catch (err) {
          console.warn(`  SKIP malformed tribe event: ${e?.title ?? e?.id ?? 'unknown'} (${err instanceof Error ? err.message : err})`)
          continue
        }
        if (!mapped) { console.warn(`  SKIP malformed tribe event: ${e?.title ?? e?.id ?? 'unknown'}`); continue }
        out.push(mapped)
      }
      url = data.next_rest_url ?? null
      page += 1
    }
    if (url && page >= MAX_PAGES) {
      console.warn(`  Pagination cap reached for tribe source ${source.identifier} (fetched ${out.length} events)`)
    }
    return out
  },
}

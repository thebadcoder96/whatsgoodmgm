import type { Fetcher, NormalizedEvent, SourceDoc } from './types'
import { chicagoToUtc, localDay } from '../lib/normalize'

const TZ = 'America/Chicago'

const stripHtml = (s?: string): string | undefined =>
  s?.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() || undefined

/**
 * `doc.date`/`doc.dates.eventDate` is the occurrence bucket, observed as the UTC instant of
 * 23:59:59 Montgomery-local on the actual calendar day (not the day a naive UTC slice would give —
 * e.g. "2026-09-03T04:59:59Z" is 2026-09-02 local). Guard against that encoding drifting: only
 * apply the local-day conversion when the instant really lands on local 23:xx:xx; otherwise fall
 * back to the raw string's leading YYYY-MM-DD as the literal local day, or bail if there is none.
 * `doc.startDate`/`endDate` are the recurring series' overall range, not this occurrence's date.
 */
function bucketToLocalDay(bucket: unknown): string | null {
  const s = String(bucket)
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) {
    const localHour = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(d)
    if (localHour === '23') return localDay(d.toISOString())
  }
  const m = s.match(/^\d{4}-\d{2}-\d{2}/)
  return m ? m[0] : null
}

export function mapSimpleviewDoc(doc: any, baseUrl: string): NormalizedEvent | null {
  const title = doc.title?.trim()
  const bucket = doc.date ?? doc.dates?.eventDate
  if (!title || !bucket) return null
  const day = bucketToLocalDay(bucket)
  if (!day) return null

  const path = doc.absoluteUrl ?? doc.absolute_primary_url ?? (doc.url ? `${baseUrl}${doc.url}` : undefined)
  if (!path) return null

  return {
    title,
    startDateTime: chicagoToUtc(doc.startTime ? `${day} ${doc.startTime}` : day),
    ...(doc.endTime ? { endDateTime: chicagoToUtc(`${day} ${doc.endTime}`) } : {}),
    description: stripHtml(doc.description)?.slice(0, 1000),
    priceText: doc.admission?.trim() || undefined,
    imageUrl: doc.media_raw?.[0]?.mediaurl ?? undefined,
    sourceType: 'simpleview',
    sourceUrl: path,
    ...(doc.location ? {
      venue: {
        name: doc.location,
        address: [doc.address1, doc.city].filter(Boolean).join(', ') || undefined,
      },
    } : {}),
  }
}

const PAGE_SIZE = 50 // the API 403s above ~60-99 in testing; stay well under
const MAX_PAGES = 20

// 2026-09: the site moved behind Akamai, which denies requests without a
// browser user-agent. This is the same public API the site's own frontend
// calls; ordinary browser headers are all it wants.
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
}

export const simpleviewFetcher: Fetcher = {
  platform: 'simpleview',
  async fetchUpcoming(source: SourceDoc, windowDays: number): Promise<NormalizedEvent[]> {
    const base = source.identifier.replace(/\/$/, '')
    const cutoff = Date.now() + windowDays * 86_400_000
    const out: NormalizedEvent[] = []
    let skip = 0
    let fetched = 0
    let hasMore = true
    let pages = 0

    // Token is reusable across requests (verified live), so fetch it once up front.
    const tokRes = await fetch(`${base}/plugins/core/get_simple_token/`, { headers: BROWSER_HEADERS })
    if (!tokRes.ok) throw new Error(`simpleview token: HTTP ${tokRes.status}`)
    const token = (await tokRes.text()).trim()

    // No server-side date_range filter: it 403s reliably in testing regardless of shape,
    // so results are fetched unfiltered (already scoped to upcoming events by the API) and
    // the window cutoff is applied client-side, as with an unsorted/grouped-by-series result set.
    while (hasMore) {
      const q = JSON.stringify({ filter: {}, options: { limit: PAGE_SIZE, skip } })
      const res = await fetch(`${base}/includes/rest_v2/plugins_events_events_by_date/find/?json=${encodeURIComponent(q)}&token=${token}`, { headers: BROWSER_HEADERS })
      if (!res.ok) {
        // The API hard-caps pagination (403 once skip reaches ~400). Results are
        // date-sorted and reach a year-plus out by then, far beyond our window,
        // so a mid-pagination 403 means "no more pages", not a failed run.
        if (res.status === 403 && fetched > 0) {
          console.warn(`  Pagination 403 at skip ${skip} for ${source.identifier}; treating as end of results (${fetched} docs)`)
          break
        }
        throw new Error(`simpleview events: HTTP ${res.status}`)
      }
      const data = await res.json()
      const docs: any[] = data.docs ?? []
      fetched += docs.length

      for (const d of docs) {
        let ev: NormalizedEvent | null
        // One doc with an unparseable time must not sink the whole batch.
        try { ev = mapSimpleviewDoc(d, base) } catch (err) {
          console.warn(`  SKIP malformed simpleview doc: ${d.title ?? d._id ?? 'unknown'} (${err instanceof Error ? err.message : err})`)
          continue
        }
        if (!ev) { console.warn(`  SKIP malformed simpleview doc: ${d.title ?? d._id ?? 'unknown'}`); continue }
        if (new Date(ev.startDateTime).getTime() <= cutoff) out.push(ev)
      }
      hasMore = docs.length === PAGE_SIZE
      skip += PAGE_SIZE
      pages += 1
      if (pages >= MAX_PAGES && hasMore) {
        // Response carries no total-count field (top level is just { docs }), so report what we got.
        console.warn(`  Pagination cap reached for simpleview source ${source.identifier} (fetched ${fetched} docs; API reports no total count)`)
        break
      }
    }
    return out
  },
}

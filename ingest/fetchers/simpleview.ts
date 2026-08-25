import type { Fetcher, NormalizedEvent, SourceDoc } from './types'
import { chicagoToUtc, localDay } from '../lib/normalize'

const stripHtml = (s?: string): string | undefined =>
  s?.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() || undefined

/**
 * `doc.date`/`doc.dates.eventDate` is the occurrence bucket, stored as the UTC instant of
 * 23:59:59 Montgomery-local on the actual calendar day (not the day a naive UTC slice would give —
 * e.g. "2026-09-03T04:59:59Z" is 2026-09-02 local). `doc.startDate`/`endDate` are the recurring
 * series' overall range, not this occurrence's date, so they're unused here.
 */
export function mapSimpleviewDoc(doc: any, baseUrl: string): NormalizedEvent | null {
  const title = doc.title?.trim()
  const bucket = doc.date ?? doc.dates?.eventDate
  if (!title || !bucket) return null
  const bucketDate = new Date(bucket)
  if (Number.isNaN(bucketDate.getTime())) return null
  const day = localDay(bucketDate.toISOString())

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

export const simpleviewFetcher: Fetcher = {
  platform: 'simpleview',
  async fetchUpcoming(source: SourceDoc, windowDays: number): Promise<NormalizedEvent[]> {
    const base = source.identifier.replace(/\/$/, '')
    const cutoff = Date.now() + windowDays * 86_400_000
    const out: NormalizedEvent[] = []
    let skip = 0
    let hasMore = true
    let pages = 0

    // No server-side date_range filter: it 403s reliably in testing regardless of shape,
    // so results are fetched unfiltered (already scoped to upcoming events by the API) and
    // the window cutoff is applied client-side, as with an unsorted/grouped-by-series result set.
    while (hasMore) {
      const tokRes = await fetch(`${base}/plugins/core/get_simple_token/`)
      if (!tokRes.ok) throw new Error(`simpleview token: HTTP ${tokRes.status}`)
      const token = (await tokRes.text()).trim()

      const q = JSON.stringify({ filter: {}, options: { limit: PAGE_SIZE, skip } })
      const res = await fetch(`${base}/includes/rest_v2/plugins_events_events_by_date/find/?json=${encodeURIComponent(q)}&token=${token}`)
      if (!res.ok) throw new Error(`simpleview events: HTTP ${res.status}`)
      const data = await res.json()
      const docs: any[] = data.docs ?? []

      for (const d of docs) {
        const ev = mapSimpleviewDoc(d, base)
        if (!ev) { console.warn(`  SKIP malformed simpleview doc: ${d.title ?? d._id ?? 'unknown'}`); continue }
        if (new Date(ev.startDateTime).getTime() <= cutoff) out.push(ev)
      }
      hasMore = docs.length === PAGE_SIZE
      skip += PAGE_SIZE
      pages += 1
      if (pages > 20) { console.warn(`  Pagination cap reached for simpleview source ${source.identifier}`); break }
    }
    return out
  },
}

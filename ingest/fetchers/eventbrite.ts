import type { Fetcher, NormalizedEvent, SourceDoc } from './types'

const API = 'https://www.eventbriteapi.com/v3'

export const eventbriteFetcher: Fetcher = {
  platform: 'eventbrite',
  async fetchUpcoming(source: SourceDoc, windowDays: number): Promise<NormalizedEvent[]> {
    const token = process.env.EVENTBRITE_TOKEN
    if (!token) throw new Error('EVENTBRITE_TOKEN not set')
    const cutoff = Date.now() + windowDays * 86_400_000
    const out: NormalizedEvent[] = []
    let page = 1, hasMore = true

    while (hasMore) {
      const res = await fetch(
        `${API}/organizations/${source.identifier}/events/?status=live&order_by=start_asc&expand=venue,ticket_availability&page=${page}`,
        { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(`Eventbrite ${res.status} for org ${source.identifier}: ${await res.text()}`)
      const data = await res.json()

      for (const ev of data.events ?? []) {
        if (!ev.start?.utc) { console.warn(`  SKIP malformed event (no start): ${ev.name?.text ?? ev.id ?? 'unknown'}`); continue }
        if (new Date(ev.start.utc).getTime() > cutoff) { hasMore = false; break }
        out.push({
          title: ev.name?.text ?? 'Untitled event',
          startDateTime: new Date(ev.start.utc).toISOString(),
          endDateTime: ev.end?.utc ? new Date(ev.end.utc).toISOString() : undefined,
          description: ev.summary || undefined,
          priceText: ev.is_free ? 'Free' : (ev.ticket_availability?.minimum_ticket_price?.display || undefined),
          imageUrl: ev.logo?.original?.url || ev.logo?.url || undefined,
          sourceType: 'eventbrite',
          sourceUrl: ev.url,
          venue: ev.venue ? {
            name: ev.venue.name ?? 'TBA',
            address: ev.venue.address?.localized_address_display || undefined,
            lat: ev.venue.latitude ? Number(ev.venue.latitude) : undefined,
            lng: ev.venue.longitude ? Number(ev.venue.longitude) : undefined,
          } : undefined,
        })
      }
      hasMore = hasMore && !!data.pagination?.has_more_items
      page += 1
      if (page > 20) { console.warn(`  Pagination cap reached for org ${source.identifier}`); break }
    }
    return out
  },
}

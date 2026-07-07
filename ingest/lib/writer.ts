import { createClient, type SanityClient } from '@sanity/client'
import type { NormalizedEvent } from '../fetchers/types'
import { isSameEvent, isLikelyRecurring, type ComparableEvent } from './dedupe'
import { makeDedupeKey, makeSlug, normalizeText } from './normalize'

export function makeIngestClient(): SanityClient {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2026-07-01', token: process.env.SANITY_WRITE_TOKEN!, useCdn: false,
  })
}

type ExistingEvent = ComparableEvent & { _id: string; status: string; sourceUrl?: string; additionalSourceUrls?: string[] }

export async function loadExisting(client: SanityClient): Promise<ExistingEvent[]> {
  return client.fetch(`*[_type == "event" && startDateTime > $since]{
    _id, title, startDateTime, status, sourceUrl, additionalSourceUrls, "venueName": venue->name
  }`, { since: new Date(Date.now() - 7 * 86_400_000).toISOString() })
}

async function upsertVenue(client: SanityClient, v: NonNullable<NormalizedEvent['venue']>, dryRun: boolean): Promise<string> {
  const id = `venue-${normalizeText(v.name).replace(/\s+/g, '-')}`
  if (!dryRun) {
    await client.createIfNotExists({ _id: id, _type: 'venue', name: v.name, address: v.address, lat: v.lat, lng: v.lng,
      slug: { current: id.replace('venue-', '') } })
  }
  return id
}

export async function writeEvents(client: SanityClient, incoming: NormalizedEvent[], dryRun: boolean):
  Promise<{ created: number; merged: number; skipped: number }> {
  const existing = await loadExisting(client)
  const approved = existing.filter(e => e.status === 'approved')
  let created = 0, merged = 0, skipped = 0

  for (const ev of incoming) {
    const comparable: ComparableEvent = { title: ev.title, venueName: ev.venue?.name, startDateTime: ev.startDateTime }
    const dup = existing.find(x => isSameEvent(comparable, x))

    if (dup) {
      const urls = [dup.sourceUrl, ...(dup.additionalSourceUrls ?? [])]
      if (ev.sourceUrl && !urls.includes(ev.sourceUrl)) {
        console.log(`  MERGE  ${ev.title} → ${dup._id} (+source)`)
        if (!dryRun) await client.patch(dup._id)
          .setIfMissing({ additionalSourceUrls: [] })
          .append('additionalSourceUrls', [ev.sourceUrl]).commit()
        merged += 1
      } else { skipped += 1 }
      continue
    }

    const likelyRecurring = isLikelyRecurring(comparable, approved)
    console.log(`  CREATE ${ev.title} @ ${ev.startDateTime}${likelyRecurring ? ' [likely recurring]' : ''}`)
    if (!dryRun) {
      const venueId = ev.venue ? await upsertVenue(client, ev.venue, dryRun) : undefined
      await client.create({
        _type: 'event', status: 'pending', featured: false, likelyRecurring,
        title: ev.title, startDateTime: ev.startDateTime, endDateTime: ev.endDateTime,
        description: ev.description, priceText: ev.priceText, imageUrl: ev.imageUrl,
        sourceType: ev.sourceType, sourceUrl: ev.sourceUrl,
        slug: { current: makeSlug(ev.title, ev.startDateTime) },
        dedupeKey: makeDedupeKey(ev.title, ev.venue?.name ?? '', ev.startDateTime),
        ...(venueId ? { venue: { _type: 'reference', _ref: venueId } } : {}),
      })
    }
    existing.push({ ...comparable, _id: 'new', status: 'pending', sourceUrl: ev.sourceUrl }) // in-batch dedup
    created += 1
  }
  return { created, merged, skipped }
}

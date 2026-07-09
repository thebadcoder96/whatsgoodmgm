import type { EventDoc } from '@/lib/sanity/queries'
import { SITE_URL } from '@/lib/siteUrl'
import { expandOccurrences } from '@/lib/events/occurrences'

const DAY_MS = 86_400_000

// Serialize a JSON-LD object for safe inline embedding in a <script>. Escaping
// "<" prevents a "</script>" (or "<!--") inside any string field from breaking
// out of the script element.
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

// Best-effort PostalAddress. Montgomery AL is hardcoded (single-city site); the
// street line is pulled from whatever precedes ", Montgomery" or the first comma.
// When nothing parseable remains, return the raw string (schema.org allows a
// plain-text address) so we never invent a street.
function buildAddress(raw?: string): Record<string, string> | string | undefined {
  const t = (raw ?? '').trim()
  if (!t) return undefined

  let street = ''
  const idx = t.search(/,?\s*montgomery/i)
  if (idx > 0) street = t.slice(0, idx).replace(/[,\s]+$/, '').trim()
  else if (t.includes(',')) street = t.split(',')[0].trim()
  else if (/\d/.test(t)) street = t // bare street line, no city component

  if (!street) return t // fall back to plain text

  const zip = t.match(/\b(\d{5})(?:-\d{4})?\b/)?.[1]
  return {
    '@type': 'PostalAddress',
    streetAddress: street,
    addressLocality: 'Montgomery',
    addressRegion: 'AL',
    ...(zip ? { postalCode: zip } : {}),
    addressCountry: 'US',
  }
}

// Parse a price only when the text is unambiguous. "Free" -> free.
// "$10" / "10" -> 10. Ranges, mixed tiers, or anything with extra words plus a
// number ("$5, kids free") return null so we omit offers rather than misstate.
function parsePrice(priceText?: string): { price: number; free: boolean } | null {
  const t = (priceText ?? '').trim()
  if (!t) return null
  if (/^free/i.test(t) && !/\d/.test(t)) return { price: 0, free: true }
  const m = t.match(/^\$?\s*(\d+(?:\.\d{1,2})?)$/)
  if (m) return { price: Number(m[1]), free: false }
  return null
}

// The concrete date/time to advertise. Recurring events resolve to their next
// real occurrence (see buildEventJsonLd doc note); one-off events use their own
// stored datetime. Falls back to the stored datetime if no occurrence is found
// inside the lookahead window.
function resolveStart(event: EventDoc): string {
  if (!event.recurrence?.frequency) return event.startDateTime
  const now = new Date()
  const next = expandOccurrences(
    event,
    now.toISOString(),
    new Date(now.getTime() + 400 * DAY_MS).toISOString(),
  )[0]
  return next ?? event.startDateTime
}

/**
 * schema.org Event JSON-LD for an event detail page.
 *
 * Recurring-event decision: we advertise the NEXT concrete occurrence as
 * `startDate` (a single valid, non-past ISO datetime) rather than emitting a
 * schema.org `eventSchedule` / `Schedule`. Rationale: Google's Event rich-result
 * documentation does not support `eventSchedule` and expects a concrete future
 * `startDate`; a stale anchor date would trip "event in the past" warnings. The
 * next occurrence is unambiguous for both search crawlers and AI readers, and
 * the human-facing "happens weekly" cadence is still on the page as prose.
 */
export function buildEventJsonLd(event: EventDoc, url: string): Record<string, unknown> {
  const venue = event.venue
  const start = resolveStart(event)

  // Carry the original duration onto the resolved start when an end exists.
  let end: string | undefined
  if (event.endDateTime) {
    const durationMs = Date.parse(event.endDateTime) - Date.parse(event.startDateTime)
    end = durationMs > 0
      ? new Date(Date.parse(start) + durationMs).toISOString()
      : event.endDateTime
  }

  const description =
    event.description?.trim() ||
    `${event.title}${venue ? ` at ${venue.name}` : ''}, in Montgomery, Alabama.`

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: start,
    ...(end ? { endDate: end } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    description,
    url,
    ...(event.imageUrl ? { image: event.imageUrl } : {}),
    organizer: {
      '@type': 'Organization',
      name: 'WhatsGoodMGM',
      url: SITE_URL,
    },
  }

  if (venue) {
    const address = buildAddress(venue.address)
    const hasCoords = venue.lat != null && venue.lng != null
    jsonLd.location = {
      '@type': 'Place',
      name: venue.name,
      ...(address ? { address } : {}),
      ...(hasCoords
        ? { geo: { '@type': 'GeoCoordinates', latitude: venue.lat, longitude: venue.lng } }
        : {}),
    }
  }

  const price = parsePrice(event.priceText)
  if (price) {
    jsonLd.isAccessibleForFree = price.free
    jsonLd.offers = {
      '@type': 'Offer',
      price: String(price.price),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url,
    }
  }

  return jsonLd
}

// WebSite JSON-LD for the home page, with a SearchAction so engines can wire a
// sitelinks search box straight to the events search.
export function buildWebsiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'WhatsGoodMGM',
    url: SITE_URL,
    description:
      'A free, community-made guide to what\'s good in Montgomery, Alabama. Events, curated weekly.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/events?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

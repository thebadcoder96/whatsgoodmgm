import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { groq } from 'next-sanity'
import { sanityFetch } from '@/lib/sanity/fetch'
import { EVENT_BY_SLUG, type EventDoc } from '@/lib/sanity/queries'
import { formatEventDateTime } from '@/lib/events/format'
import { categoryHue } from '@/lib/events/categoryHue'
import { expandOccurrences } from '@/lib/events/occurrences'
import { buildEventJsonLd, jsonLdScript } from '@/lib/seo/jsonLd'
import { SITE_URL } from '@/lib/siteUrl'
import { EventCard } from '@/components/EventCard'
import VenueMiniMapLoader from '@/components/VenueMiniMapLoader'

export const revalidate = 3600

// Meta description: the event's own copy trimmed to ~155 chars, or a generated
// fallback when it has none.
function truncate(s: string, max = 155): string {
  const t = s.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

function metaDescription(event: EventDoc): string {
  if (event.description?.trim()) return truncate(event.description)
  const at = event.venue?.name ? ` at ${event.venue.name}` : ''
  return `${event.title}${at}, ${formatEventDateTime(event.startDateTime)}, Montgomery AL`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await sanityFetch<EventDoc | null>(EVENT_BY_SLUG, { slug })
  if (!event) return {}

  const url = `${SITE_URL}/events/${slug}`
  const description = metaDescription(event)
  const images = event.imageUrl ? [event.imageUrl] : undefined

  return {
    title: event.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: event.title, description, url, ...(images ? { images } : {}) },
    twitter: { card: 'summary_large_image', title: event.title, description, ...(images ? { images } : {}) },
  }
}

// Other approved events at the same venue: upcoming or recurring, never this
// same event. Defined inline (queries.ts is owned by another change) but
// mirrors EVENT_FIELDS so the rows render through the shared EventCard.
const MORE_AT_VENUE = groq`
  *[_type == "event" && status == "approved" && venue._ref == $venueRef && _id != $id &&
    (startDateTime >= $from || defined(recurrence.frequency))]
    | order(startDateTime asc)[0...4]{
      _id, title, "slug": slug.current, startDateTime, endDateTime, category,
      description, priceText, imageUrl, sourceType, sourceUrl, additionalSourceUrls,
      featured, recurrence,
      venue->{ _id, name, address, neighborhood, lat, lng }
    }`

const DAY_MS = 86_400_000
const TZ = 'America/Chicago'

// "wed jul 15" for the recurrence chips.
const chipFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric',
})

// Google Calendar wants basic-format UTC: 20260708T190000Z.
function gcalStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function googleCalendarUrl(event: EventDoc): string {
  const start = event.startDateTime
  const end = event.endDateTime ?? new Date(Date.parse(start) + 2 * 60 * 60 * 1000).toISOString()
  const location = event.venue?.address ?? event.venue?.name ?? ''
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${gcalStamp(start)}/${gcalStamp(end)}`,
  })
  if (event.description) params.set('details', event.description)
  if (location) params.set('location', location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await sanityFetch<EventDoc | null>(EVENT_BY_SLUG, { slug })
  if (!event) notFound()

  const hue = categoryHue(event.category)
  const venue = event.venue
  const hasCoords = venue?.lat != null && venue?.lng != null
  const isFree = /^free/i.test((event.priceText ?? '').trim())
  const eventJsonLd = buildEventJsonLd(event, `${SITE_URL}/events/${slug}`)

  // Recurring events get real upcoming dates rather than a single stale one.
  const now = new Date()
  const nextDates = event.recurrence?.frequency
    ? expandOccurrences(event, now.toISOString(), new Date(now.getTime() + 60 * DAY_MS).toISOString()).slice(0, 4)
    : []
  const recurLabel = event.recurrence?.note ?? event.recurrence?.frequency

  // Other events at this venue (only worth a query when there's a venue).
  const moreAtVenue = venue?._id
    ? await sanityFetch<EventDoc[]>(MORE_AT_VENUE, {
        venueRef: venue._id,
        id: event._id,
        from: now.toISOString(),
      })
    : []

  return (
    <article className="mx-auto max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(eventJsonLd) }}
      />
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={`Flyer for ${event.title}`}
          className="mb-8 w-full rounded-lg object-cover ring-1 ring-white/5"
        />
      )}

      <Link
        href={`/events?category=${encodeURIComponent(event.category)}`}
        className="text-[11px] uppercase tracking-[0.22em] transition-opacity hover:opacity-80"
        style={{ color: hue }}
      >
        {event.category}
      </Link>
      <h1 className="font-display mt-2 text-3xl font-semibold leading-[1.1] tracking-tight text-balance md:text-4xl">
        {event.title}
      </h1>

      {/* When & where - the ticket stub. Dotted category-hue left edge echoes
          the event cards; mono for the timetable texture. */}
      <div
        className="mt-6 overflow-hidden rounded-r-lg border-l-2 border-dotted bg-[var(--surface)] ring-1 ring-white/5"
        style={{ borderLeftColor: hue }}
      >
        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ink-dim)]">when</p>
            <p className="mt-1.5 font-mono text-[15px] tabular-nums text-[var(--ink)]">
              {formatEventDateTime(event.startDateTime)}
              {event.endDateTime && ` – ${formatEventDateTime(event.endDateTime)}`}
            </p>
            {recurLabel && (
              <p className="mt-1 font-mono text-[13px] text-[var(--ink-dim)]">happens {recurLabel}</p>
            )}
          </div>

          {venue && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ink-dim)]">where</p>
              <p className="mt-1.5 font-medium text-[var(--ink)]">{venue.name}</p>
              {venue.address ? (
                <p className="mt-0.5 font-mono text-[13px] text-[var(--ink-dim)]">{venue.address}</p>
              ) : (
                venue.neighborhood && (
                  <p className="mt-0.5 font-mono text-[13px] text-[var(--ink-dim)]">{venue.neighborhood.toLowerCase()}</p>
                )
              )}
            </div>
          )}

          {event.priceText && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ink-dim)]">price</p>
              <p
                className={`mt-1.5 font-mono text-[15px] tabular-nums ${isFree ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}
              >
                {event.priceText.toLowerCase()}
              </p>
            </div>
          )}

          {/* Real gold CTA for directions; add-to-calendar rides alongside as
              a quieter secondary link. Both survive the no-coords case (the
              button just doesn't render). */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
            {hasCoords && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${venue!.lat},${venue!.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-ink)] transition-opacity hover:opacity-90"
              >
                directions →
              </a>
            )}
            <a
              href={googleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="link-gold text-sm font-medium"
            >
              add to calendar →
            </a>
          </div>
        </div>

        {hasCoords && (
          <div className="border-t border-white/5">
            <VenueMiniMapLoader lat={venue!.lat!} lng={venue!.lng!} hue={hue} name={venue!.name} />
          </div>
        )}
      </div>

      {event.description && (
        <p className="mt-8 whitespace-pre-line leading-7">{event.description}</p>
      )}

      {/* Next dates for a recurring event: the actual upcoming stubs, as mono
          chips, so "every week" is concrete. */}
      {nextDates.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl italic">next dates</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {nextDates.map(iso => (
              <span
                key={iso}
                className="rounded-full bg-[var(--surface-2)] px-3 py-1 font-mono text-[13px] tabular-nums text-[var(--ink-dim)] ring-1 ring-white/5"
              >
                {chipFmt.format(new Date(iso)).replace(',', '').toLowerCase()}
              </span>
            ))}
          </div>
        </section>
      )}

      {moreAtVenue.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl italic">more at {venue!.name}</h2>
          <div className="mt-4 grid gap-3">
            {moreAtVenue.map(e => (
              <EventCard key={e._id} event={e} />
            ))}
          </div>
        </section>
      )}

      {event.sourceUrl && (
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="link-gold mt-10 inline-block font-medium"
        >
          event details at the source →
        </a>
      )}
    </article>
  )
}

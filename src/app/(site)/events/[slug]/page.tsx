import { notFound } from 'next/navigation'
import { sanityFetch } from '@/lib/sanity/fetch'
import { EVENT_BY_SLUG, type EventDoc } from '@/lib/sanity/queries'
import { formatEventDateTime } from '@/lib/events/format'
import { categoryHue } from '@/lib/events/categoryHue'

export const revalidate = 3600

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await sanityFetch<EventDoc | null>(EVENT_BY_SLUG, { slug })
  if (!event) notFound()

  const hue = categoryHue(event.category)
  return (
    <article className="mx-auto max-w-2xl">
      {event.imageUrl && <img src={event.imageUrl} alt={`Flyer for ${event.title}`} className="mb-8 w-full rounded-lg object-cover ring-1 ring-white/5" />}
      <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: hue }}>{event.category}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-balance md:text-4xl">{event.title}</h1>
      <p className="mt-3 font-mono text-[13px] tabular-nums text-[var(--ink-dim)]">
        {formatEventDateTime(event.startDateTime)}
        {event.endDateTime && ` – ${formatEventDateTime(event.endDateTime)}`}
        {event.recurrence?.note && ` · ${event.recurrence.note}`}
        {event.priceText && <> · <span className="text-[var(--accent)]">{event.priceText.toLowerCase()}</span></>}
      </p>
      {event.venue && (
        <p className="mt-1.5 text-xs uppercase tracking-[0.08em] text-[var(--ink-dim)]">
          {event.venue.name}{event.venue.address && ` · ${event.venue.address}`}
          {event.venue.lat != null && event.venue.lng != null && (
            <>
              {' · '}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${event.venue.lat},${event.venue.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-gold text-[var(--accent)]"
              >
                directions →
              </a>
            </>
          )}
        </p>
      )}
      {event.description && <p className="mt-8 whitespace-pre-line leading-7">{event.description}</p>}
      {event.sourceUrl && (
        <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="link-gold mt-8 inline-block font-medium">
          event details at the source →
        </a>
      )}
    </article>
  )
}

import { notFound } from 'next/navigation'
import { sanityFetch } from '@/lib/sanity/fetch'
import { EVENT_BY_SLUG, type EventDoc } from '@/lib/sanity/queries'
import { formatEventDateTime } from '@/lib/events/format'

export const revalidate = 3600

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await sanityFetch<EventDoc | null>(EVENT_BY_SLUG, { slug })
  if (!event) notFound()

  return (
    <article className="mx-auto max-w-2xl">
      {event.imageUrl && <img src={event.imageUrl} alt={`Flyer for ${event.title}`} className="mb-6 w-full rounded-xl object-cover" />}
      <p className="text-sm uppercase tracking-widest text-[var(--accent)]">{event.category}</p>
      <h1 className="mt-1 font-display text-3xl font-bold">{event.title}</h1>
      <p className="mt-2 text-[var(--ink-dim)]">
        {formatEventDateTime(event.startDateTime)}
        {event.endDateTime && ` – ${formatEventDateTime(event.endDateTime)}`}
        {event.recurrence?.note && ` · ${event.recurrence.note}`}
      </p>
      {event.venue && (
        <p className="mt-1 text-[var(--ink-dim)]">{event.venue.name}{event.venue.address && ` · ${event.venue.address}`}</p>
      )}
      {event.priceText && <p className="mt-1 font-medium text-[var(--accent)]">{event.priceText}</p>}
      {event.description && <p className="mt-6 whitespace-pre-line leading-relaxed">{event.description}</p>}
      {event.sourceUrl && (
        <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="mt-8 inline-block rounded-md border border-[var(--accent)] px-4 py-2 text-[var(--accent)]">
          Event details at the source →
        </a>
      )}
    </article>
  )
}

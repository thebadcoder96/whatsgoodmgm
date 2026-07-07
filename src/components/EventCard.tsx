import Link from 'next/link'
import type { EventDoc } from '@/lib/sanity/queries'
import { formatEventDateTime } from '@/lib/events/format'

export function EventCard({ event, occursAt }: { event: EventDoc; occursAt?: string }) {
  return (
    <Link href={`/events/${event.slug}`}
      className="block rounded-lg border border-white/10 bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]/50">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">{event.title}</h3>
        {event.priceText && <span className="shrink-0 text-sm text-[var(--accent)]">{event.priceText}</span>}
      </div>
      <p className="mt-1 text-sm text-[var(--ink-dim)]">
        {formatEventDateTime(occursAt ?? event.startDateTime)}
        {event.venue && <> · {event.venue.name}</>}
        {event.recurrence?.frequency && <> · repeats {event.recurrence.frequency}</>}
      </p>
      {event.description && <p className="mt-2 line-clamp-2 text-sm text-[var(--ink-dim)]">{event.description}</p>}
    </Link>
  )
}

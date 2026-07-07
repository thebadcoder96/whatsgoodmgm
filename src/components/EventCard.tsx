import Link from 'next/link'
import type { EventDoc } from '@/lib/sanity/queries'
import { formatEventDateTime } from '@/lib/events/format'
import { categoryHue } from '@/lib/events/categoryHue'

export function EventCard({ event, occursAt }: { event: EventDoc; occursAt?: string }) {
  const hue = categoryHue(event.category)
  const isFree = /^free/i.test((event.priceText ?? '').trim())
  return (
    <Link href={`/events/${event.slug}`}
      className="block rounded-r-lg border-l-2 border-dotted bg-[var(--surface)] px-4 py-3 ring-1 ring-white/5 transition-colors hover:bg-[var(--surface-2)]"
      style={{ borderLeftColor: hue }}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold leading-snug">{event.title}</h3>
        {event.category && (
          <span className="shrink-0 text-[11px] tracking-[0.14em]" style={{ color: hue }}>{event.category}</span>
        )}
      </div>
      <p className="mt-1.5 font-mono text-[13px] tabular-nums text-[var(--ink-dim)]">
        {formatEventDateTime(occursAt ?? event.startDateTime)}
        {event.priceText && (
          <> · <span className={isFree ? 'text-[var(--accent)]' : undefined}>{event.priceText.toLowerCase()}</span></>
        )}
      </p>
      {(event.venue || event.recurrence?.frequency) && (
        <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[var(--ink-dim)]">
          {event.venue?.name}
          {event.venue?.neighborhood && ` · ${event.venue.neighborhood}`}
          {event.recurrence?.frequency && `${event.venue ? ' · ' : ''}repeats ${event.recurrence.frequency}`}
        </p>
      )}
      {event.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--ink-dim)]">{event.description}</p>
      )}
    </Link>
  )
}

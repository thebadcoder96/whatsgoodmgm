import Link from 'next/link'
import type { EventDoc } from '@/lib/sanity/queries'
import { formatEventTime } from '@/lib/events/format'
import { categoryHue } from '@/lib/events/categoryHue'

export function EventRow({ event, occursAt }: { event: EventDoc; occursAt: string }) {
  const hue = categoryHue(event.category)
  const isFree = /^free/i.test((event.priceText ?? '').trim())
  return (
    <Link
      href={`/events/${event.slug}`}
      className="flex min-w-0 items-center gap-3 border-b border-[var(--line-soft)] py-3 transition-colors hover:bg-[var(--wash)]"
    >
      <span
        aria-hidden="true"
        className="h-8 w-0.5 shrink-0 rounded-full"
        style={{ backgroundColor: hue }}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate font-semibold leading-snug">{event.title}</span>
          {event.priceText && (
            <span className={`shrink-0 font-mono text-xs ${isFree ? 'text-[var(--accent)]' : 'text-[var(--ink-dim)]'}`}>
              {event.priceText.toLowerCase()}
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[13px] tabular-nums text-[var(--ink-dim)]">
          {formatEventTime(occursAt)}
          {event.venue?.name && ` · ${event.venue.name.toLowerCase()}`}
          {event.venue?.neighborhood && ` · ${event.venue.neighborhood.toLowerCase()}`}
        </span>
      </span>
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt=""
          loading="lazy"
          className="h-12 w-16 shrink-0 rounded object-cover ring-1 ring-[var(--line-soft)]"
        />
      )}
    </Link>
  )
}

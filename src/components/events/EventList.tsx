import Link from 'next/link'
import type { DayGroup } from '@/lib/events/grouping'
import { todayKey } from '@/lib/events/grouping'
import { formatDayHeading } from '@/lib/events/format'
import { EventRow } from '@/components/events/EventRow'

export function EventList({ groups }: { groups: DayGroup[] }) {
  const today = todayKey()
  if (groups.length === 0) {
    return (
      <p className="mt-8 border-y border-dotted border-[var(--accent)]/40 py-4 font-display italic text-[var(--ink-dim)]">
        quiet on that front. the Gump&apos;s not asleep, though. try loosening a filter, or{' '}
        <Link href="/" className="link-gold">clear them all</Link>.
      </p>
    )
  }
  return (
    <div className="mt-2 space-y-8">
      {groups.map(g => {
        const withImages = g.items.filter(i => i.e.imageUrl)
        return (
          <section key={g.day}>
            <h2 className="border-b border-[var(--accent-deep)]/40 pb-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">
              {g.day === today && 'today · '}
              {formatDayHeading(g.day)}
            </h2>
            {withImages.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {withImages.map(({ e, occursAt }) => (
                  <Link key={`${e._id}${occursAt}`} href={`/events/${e.slug}`} className="shrink-0">
                    <img
                      src={e.imageUrl}
                      alt={`flyer for ${e.title}`}
                      loading="lazy"
                      className="h-20 w-32 rounded-md object-cover ring-1 ring-[var(--line-soft)] transition-opacity hover:opacity-90"
                    />
                  </Link>
                ))}
              </div>
            )}
            <div>
              {g.items.map(({ e, occursAt }) => (
                <EventRow key={`${e._id}${occursAt}`} event={e} occursAt={occursAt} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

import Link from 'next/link'
import type { DayGroup } from '@/lib/events/grouping'
import { addDays, todayKey, weekStart } from '@/lib/events/grouping'
import { formatDayHeading, formatEventTime } from '@/lib/events/format'
import { categoryHue } from '@/lib/events/categoryHue'

export function WeekView({ anchor, groups, prevHref, nextHref, todayHref }: {
  anchor: string // sunday day-key of the shown week
  groups: DayGroup[]
  prevHref: string
  nextHref: string
  todayHref: string
}) {
  const byDay = new Map(groups.map(g => [g.day, g.items]))
  const today = todayKey()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart(anchor), i))

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-semibold">
          week of {formatDayHeading(days[0]).replace(' ·', '')}
        </p>
        <div className="flex items-center gap-1 text-sm">
          <Link href={prevHref} aria-label="previous week" className="px-2 py-1 text-[var(--ink-dim)] hover:text-[var(--ink)]">‹</Link>
          <Link href={todayHref} className="px-2 py-1 text-[var(--ink-dim)] hover:text-[var(--ink)]">today</Link>
          <Link href={nextHref} aria-label="next week" className="px-2 py-1 text-[var(--ink-dim)] hover:text-[var(--ink)]">›</Link>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-7">
        {days.map(day => {
          const items = byDay.get(day) ?? []
          return (
            <section key={day} className="overflow-hidden rounded-lg border border-[var(--line-soft)]">
              <h3
                className={`px-2 py-1.5 text-center text-[11px] uppercase tracking-wide ${
                  day === today
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'bg-[var(--surface-2)] text-[var(--ink-dim)]'
                }`}
              >
                {formatDayHeading(day).replace(' ·', '')}
              </h3>
              <div className="min-h-16 space-y-1.5 bg-[var(--surface)] p-1.5">
                {items.map(({ e, occursAt }) => (
                  <Link
                    key={`${e._id}${occursAt}`}
                    href={`/events/${e.slug}`}
                    className="block rounded-md border-l-2 bg-[var(--wash)] px-2 py-1.5 text-xs leading-snug transition-colors hover:bg-[var(--surface-2)]"
                    style={{ borderLeftColor: categoryHue(e.category) }}
                  >
                    <span className="tabular-nums text-[var(--ink-dim)]">{formatEventTime(occursAt)}</span>
                    <span className="mt-0.5 block font-medium">{e.title.toLowerCase()}</span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

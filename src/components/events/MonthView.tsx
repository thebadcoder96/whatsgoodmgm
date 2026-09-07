'use client'
import Link from 'next/link'
import { useState } from 'react'
import type { DayGroup, MonthCell } from '@/lib/events/grouping'
import { formatDayHeading, formatEventTime } from '@/lib/events/format'
import { EventRow } from '@/components/events/EventRow'

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const MAX_LINES = 3

export function MonthView({ weeks, groups, monthLabel, today, prevHref, nextHref, todayHref }: {
  weeks: MonthCell[][]
  groups: DayGroup[]
  monthLabel: string
  today: string
  prevHref: string
  nextHref: string
  todayHref: string
}) {
  const byDay = new Map(groups.map(g => [g.day, g.items]))
  const [selected, setSelected] = useState<string | null>(null)
  const selectedItems = selected ? (byDay.get(selected) ?? []) : []

  const nav = (
    <div className="flex items-center justify-between">
      <p className="font-display text-lg font-semibold">{monthLabel}</p>
      <div className="flex items-center gap-1 text-sm">
        <Link href={prevHref} aria-label="previous month" className="px-2 py-1 text-[var(--ink-dim)] hover:text-[var(--ink)]">‹</Link>
        <Link href={todayHref} className="px-2 py-1 text-[var(--ink-dim)] hover:text-[var(--ink)]">today</Link>
        <Link href={nextHref} aria-label="next month" className="px-2 py-1 text-[var(--ink-dim)] hover:text-[var(--ink)]">›</Link>
      </div>
    </div>
  )

  return (
    <div className="mt-4 space-y-3">
      {nav}

      {/* desktop grid */}
      <div className="hidden overflow-hidden rounded-lg border border-[var(--line)] md:block">
        <div className="grid grid-cols-7 border-b border-[var(--line)] bg-[var(--surface-2)]">
          {WEEKDAYS.map(d => (
            <div key={d} className="px-2 py-1.5 text-center text-[11px] uppercase tracking-widest text-[var(--ink-dim)]">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-[var(--line-soft)] last:border-b-0">
            {week.map(cell => {
              const items = byDay.get(cell.day) ?? []
              return (
                <div
                  key={cell.day}
                  className={`min-h-24 border-r border-[var(--line-soft)] p-1.5 last:border-r-0 ${
                    cell.inMonth ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]/50'
                  } ${cell.day === today ? 'ring-1 ring-inset ring-[var(--accent)]' : ''}`}
                >
                  <p className={`text-xs tabular-nums ${cell.inMonth ? 'text-[var(--ink)]' : 'text-[var(--ink-dim)]'}`}>
                    {Number(cell.day.slice(8, 10))}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {items.slice(0, MAX_LINES).map(({ e, occursAt }) => (
                      <li key={`${e._id}${occursAt}`} className="truncate text-[11px] leading-tight">
                        <Link href={`/events/${e.slug}`} className="hover:text-[var(--accent)]">
                          <span className="text-[var(--ink-dim)]">{formatEventTime(occursAt)}</span> {e.title.toLowerCase()}
                        </Link>
                      </li>
                    ))}
                    {items.length > MAX_LINES && (
                      <li className="text-[11px] text-[var(--ink-dim)]">+{items.length - MAX_LINES} more</li>
                    )}
                  </ul>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* mobile: compact grid + tap-a-day list */}
      <div className="md:hidden">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] uppercase text-[var(--ink-dim)]">{d}</div>
          ))}
          {weeks.flat().map(cell => {
            const count = byDay.get(cell.day)?.length ?? 0
            const isSelected = selected === cell.day
            return (
              <button
                key={cell.day}
                type="button"
                onClick={() => setSelected(isSelected ? null : cell.day)}
                aria-pressed={isSelected}
                className={`flex aspect-square flex-col items-center justify-center rounded-md text-xs tabular-nums ${
                  isSelected
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                    : cell.inMonth
                      ? 'bg-[var(--surface)] text-[var(--ink)]'
                      : 'bg-transparent text-[var(--ink-dim)]'
                } ${cell.day === today ? 'ring-1 ring-[var(--accent)]' : ''}`}
              >
                {Number(cell.day.slice(8, 10))}
                <span
                  aria-hidden="true"
                  className={`mt-0.5 h-1 w-1 rounded-full ${count > 0 ? 'bg-current opacity-70' : 'bg-transparent'}`}
                />
              </button>
            )
          })}
        </div>
        {selected && (
          <div className="mt-4">
            <h3 className="font-display text-lg italic text-[var(--accent)]">
              {formatDayHeading(selected)}
            </h3>
            {selectedItems.length === 0 ? (
              <p className="mt-2 font-display italic text-[var(--ink-dim)]">nothing on this day.</p>
            ) : (
              selectedItems.map(({ e, occursAt }) => (
                <EventRow key={`${e._id}${occursAt}`} event={e} occursAt={occursAt} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

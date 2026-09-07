import type { EventDoc } from '@/lib/sanity/queries'

export type Occurrence = { e: EventDoc; occursAt: string }
export type DayGroup = { day: string; items: Occurrence[] }
export type MonthCell = { day: string; inMonth: boolean }

const TZ = 'America/Chicago'

// en-CA locale renders as YYYY-MM-DD, which doubles as our sortable day key.
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
})

export function localDayKey(iso: string): string {
  return dayKeyFmt.format(new Date(iso))
}

export function todayKey(now: Date = new Date()): string {
  return dayKeyFmt.format(now)
}

export function groupByDay(occurrences: Occurrence[]): DayGroup[] {
  const byDay = new Map<string, Occurrence[]>()
  for (const o of occurrences) {
    const key = localDayKey(o.occursAt)
    const bucket = byDay.get(key)
    if (bucket) bucket.push(o)
    else byDay.set(key, [o])
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, items]) => ({
      day,
      items: items.sort((a, b) => a.occursAt.localeCompare(b.occursAt)),
    }))
}

// Day keys are date-only, so arithmetic on them is safe in UTC.
function keyToUtc(day: string): Date {
  return new Date(`${day}T00:00:00Z`)
}
function utcToKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(day: string, n: number): string {
  const d = keyToUtc(day)
  d.setUTCDate(d.getUTCDate() + n)
  return utcToKey(d)
}

/** The sunday of the week containing `day`. */
export function weekStart(day: string): string {
  return addDays(day, -keyToUtc(day).getUTCDay())
}

export function addMonths(ym: string, n: number): string {
  const d = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1 + n, 1))
  return utcToKey(d).slice(0, 7)
}

/** Sun-sat weeks covering the month `ym` (YYYY-MM). */
export function monthGrid(ym: string): MonthCell[][] {
  const firstOfNext = `${addMonths(ym, 1)}-01`
  const weeks: MonthCell[][] = []
  let cursor = weekStart(`${ym}-01`)
  do {
    const week: MonthCell[] = []
    for (let i = 0; i < 7; i++) {
      week.push({ day: cursor, inMonth: cursor.slice(0, 7) === ym })
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  } while (cursor < firstOfNext)
  return weeks
}

export function isDayKey(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) &&
    utcToKey(keyToUtc(s)) === s
}

export function isMonthKey(s: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(s)) return false
  const m = Number(s.slice(5, 7))
  return m >= 1 && m <= 12
}

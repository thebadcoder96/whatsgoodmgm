export type RecurringInput = {
  startDateTime: string
  recurrence?: { frequency?: 'weekly' | 'biweekly' | 'monthly'; note?: string } | null
}

const DAY = 86_400_000

/**
 * Expand an event into occurrence ISO datetimes within [fromIso, toIso].
 * Monthly events recur on the same day-of-month, clamped to the last day
 * of shorter months (e.g. a day-31 event lands on Feb 28 / Apr 30).
 * Known v1 limitation: fixed-ms steps keep UTC time constant, so local
 * Montgomery times shift by 1h across the two DST boundaries per year.
 */
export function expandOccurrences(e: RecurringInput, fromIso: string, toIso: string): string[] {
  const start = new Date(e.startDateTime)
  const from = new Date(fromIso)
  const to = new Date(toIso)
  const freq = e.recurrence?.frequency

  if (!freq) return start >= from && start <= to ? [start.toISOString()] : []

  const out: string[] = []
  if (freq === 'weekly' || freq === 'biweekly') {
    const step = (freq === 'weekly' ? 7 : 14) * DAY
    let t = start.getTime()
    if (t < from.getTime()) t += Math.ceil((from.getTime() - t) / step) * step
    for (; t <= to.getTime(); t += step) out.push(new Date(t).toISOString())
  } else {
    // monthly: same day-of-month as the first occurrence, clamped to shorter months
    const dom = start.getUTCDate()
    let y = start.getUTCFullYear()
    let mo = start.getUTCMonth()
    while (true) {
      const lastDay = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate()
      const d = new Date(Date.UTC(y, mo, Math.min(dom, lastDay),
        start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds()))
      if (d > to) break
      if (d >= from && d >= start) out.push(d.toISOString())
      mo += 1
      if (mo === 12) { mo = 0; y += 1 }
    }
  }
  return out
}

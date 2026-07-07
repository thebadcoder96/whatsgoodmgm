export type RecurringInput = {
  startDateTime: string
  recurrence?: { frequency?: 'weekly' | 'biweekly' | 'monthly'; note?: string } | null
}

const DAY = 86_400_000

/**
 * Expand an event into occurrence ISO datetimes within [fromIso, toIso].
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
    // monthly: same day-of-month and UTC time as the first occurrence
    let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), start.getUTCDate(),
      start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds()))
    if (d < start) d = new Date(start)
    while (d <= to) {
      if (d >= from) out.push(d.toISOString())
      d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, start.getUTCDate(),
        start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds()))
    }
  }
  return out
}

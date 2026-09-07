import { describe, expect, it } from 'vitest'
import {
  localDayKey, groupByDay, addDays, weekStart, monthGrid, addMonths,
  isDayKey, isMonthKey, type Occurrence,
} from './grouping'

const occ = (id: string, iso: string): Occurrence =>
  ({ e: { _id: id } as Occurrence['e'], occursAt: iso })

describe('localDayKey', () => {
  it('buckets a UTC instant into its Montgomery-local day', () => {
    // 00:30 UTC on Jul 8 is 7:30pm Jul 7 in America/Chicago (CDT)
    expect(localDayKey('2026-07-08T00:30:00Z')).toBe('2026-07-07')
  })
  it('keeps a daytime instant on the same date', () => {
    expect(localDayKey('2026-07-07T18:00:00Z')).toBe('2026-07-07')
  })
})

describe('groupByDay', () => {
  it('groups by local day, days and items sorted ascending', () => {
    const groups = groupByDay([
      occ('b', '2026-09-08T23:00:00Z'),
      occ('a', '2026-09-08T16:00:00Z'),
      occ('c', '2026-09-08T00:30:00Z'), // local Sep 7
    ])
    expect(groups.map(g => g.day)).toEqual(['2026-09-07', '2026-09-08'])
    expect(groups[1].items.map(i => i.e._id)).toEqual(['a', 'b'])
  })
})

describe('day-key arithmetic', () => {
  it('addDays crosses month boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-09-01', -1)).toBe('2026-08-31')
  })
  it('weekStart returns the sunday containing the day', () => {
    expect(weekStart('2026-09-09')).toBe('2026-09-06') // Wed -> Sun
    expect(weekStart('2026-09-06')).toBe('2026-09-06') // Sun -> itself
  })
  it('addMonths handles year rollover', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
  })
})

describe('monthGrid', () => {
  it('covers september 2026 in sun-sat weeks with inMonth flags', () => {
    const weeks = monthGrid('2026-09')
    expect(weeks.length).toBe(5)
    expect(weeks[0][0]).toEqual({ day: '2026-08-30', inMonth: false })
    expect(weeks[0][2]).toEqual({ day: '2026-09-01', inMonth: true })
    expect(weeks[4][6]).toEqual({ day: '2026-10-03', inMonth: false })
    for (const w of weeks) expect(w.length).toBe(7)
  })
})

describe('param guards', () => {
  it('validates day keys', () => {
    expect(isDayKey('2026-09-07')).toBe(true)
    expect(isDayKey('2026-9-7')).toBe(false)
    expect(isDayKey('garbage')).toBe(false)
  })
  it('validates month keys', () => {
    expect(isMonthKey('2026-09')).toBe(true)
    expect(isMonthKey('2026-13')).toBe(false)
    expect(isMonthKey('2026-09-07')).toBe(false)
  })
})

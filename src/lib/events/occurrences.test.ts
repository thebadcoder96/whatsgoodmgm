import { describe, expect, it } from 'vitest'
import { expandOccurrences, type RecurringInput } from './occurrences'

const win = { from: '2026-07-06T00:00:00Z', to: '2026-07-20T00:00:00Z' }

describe('expandOccurrences', () => {
  it('returns the single date for a non-recurring event inside the window', () => {
    const e: RecurringInput = { startDateTime: '2026-07-10T23:00:00Z' }
    expect(expandOccurrences(e, win.from, win.to)).toEqual(['2026-07-10T23:00:00.000Z'])
  })
  it('returns empty for a non-recurring event outside the window', () => {
    const e: RecurringInput = { startDateTime: '2026-08-01T23:00:00Z' }
    expect(expandOccurrences(e, win.from, win.to)).toEqual([])
  })
  it('expands a weekly event started in the past into the window', () => {
    const e: RecurringInput = { startDateTime: '2026-06-02T00:30:00Z', recurrence: { frequency: 'weekly' } }
    // Tuesdays 7:30pm CT = Wed 00:30 UTC → Jul 7 and Jul 14 fall in window
    expect(expandOccurrences(e, win.from, win.to)).toEqual([
      '2026-07-07T00:30:00.000Z', '2026-07-14T00:30:00.000Z',
    ])
  })
  it('does not emit occurrences before the event first starts', () => {
    const e: RecurringInput = { startDateTime: '2026-07-14T00:30:00Z', recurrence: { frequency: 'weekly' } }
    expect(expandOccurrences(e, win.from, win.to)).toEqual(['2026-07-14T00:30:00.000Z'])
  })
  it('expands biweekly on a 14-day step', () => {
    const e: RecurringInput = { startDateTime: '2026-06-23T00:30:00Z', recurrence: { frequency: 'biweekly' } }
    expect(expandOccurrences(e, win.from, win.to)).toEqual(['2026-07-07T00:30:00.000Z'])
  })
  it('expands monthly on the same day-of-month', () => {
    const e: RecurringInput = { startDateTime: '2026-05-15T18:00:00Z', recurrence: { frequency: 'monthly' } }
    expect(expandOccurrences(e, win.from, win.to)).toEqual(['2026-07-15T18:00:00.000Z'])
  })
})

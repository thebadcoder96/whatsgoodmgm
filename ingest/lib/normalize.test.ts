import { describe, expect, it } from 'vitest'
import { normalizeText, makeDedupeKey, makeSlug, chicagoToUtc } from './normalize'

describe('normalizeText', () => {
  it('lowercases, strips punctuation, collapses whitespace', () => {
    expect(normalizeText('  Jazz  Night!! @ The Alley  ')).toBe('jazz night the alley')
  })
})
describe('makeDedupeKey', () => {
  it('is stable across punctuation/case variants on the same day', () => {
    const a = makeDedupeKey('Jazz Night!', 'The Alley', '2026-07-10T23:00:00Z')
    const b = makeDedupeKey('jazz night', 'the alley.', '2026-07-10T18:00:00-05:00')
    expect(a).toBe(b)
  })
  it('differs across days', () => {
    expect(makeDedupeKey('Jazz Night', 'The Alley', '2026-07-10T23:00:00Z'))
      .not.toBe(makeDedupeKey('Jazz Night', 'The Alley', '2026-07-11T23:00:00Z'))
  })
})
describe('makeSlug', () => {
  it('builds title-date slugs', () => {
    expect(makeSlug('Jazz Night @ The Alley', '2026-07-10T23:00:00Z')).toBe('jazz-night-the-alley-2026-07-10')
  })
  it('falls back to "event" for titles with no ascii alphanumerics', () => {
    expect(makeSlug('!!!', '2026-07-10T23:00:00Z')).toBe('event-2026-07-10')
  })
})
describe('chicagoToUtc', () => {
  it('converts CDT (summer) local time to UTC', () => {
    expect(chicagoToUtc('2026-09-03 10:00:00')).toBe('2026-09-03T15:00:00.000Z') // UTC-5
  })
  it('converts CST (winter) local time to UTC', () => {
    expect(chicagoToUtc('2026-12-04 19:00:00')).toBe('2026-12-05T01:00:00.000Z') // UTC-6
  })
  it('handles date-only input as local midnight', () => {
    expect(chicagoToUtc('2026-09-03')).toBe('2026-09-03T05:00:00.000Z')
  })
  it('handles the spring-forward transition morning', () => {
    expect(chicagoToUtc('2026-03-08 03:00:00')).toBe('2026-03-08T08:00:00.000Z')
  })
  it('handles the fall-back transition morning', () => {
    expect(chicagoToUtc('2026-11-01 03:00:00')).toBe('2026-11-01T09:00:00.000Z')
  })
  it('accepts HH:mm without seconds', () => {
    expect(chicagoToUtc('2026-09-03 10:00')).toBe('2026-09-03T15:00:00.000Z')
  })
  it('throws with the offending input on garbage', () => {
    expect(() => chicagoToUtc('garbage')).toThrow('garbage')
  })
})

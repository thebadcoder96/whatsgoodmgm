import { describe, expect, it } from 'vitest'
import { normalizeText, makeDedupeKey, makeSlug } from './normalize'

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
})

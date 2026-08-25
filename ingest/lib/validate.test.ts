import { describe, it, expect } from 'vitest'
import { validateExtracted } from './validate'

const good = {
  title: 'Trivia Night', startDateTime: '2026-09-10T00:00:00.000Z',
  sourceType: 'reddit', sourceUrl: 'https://www.reddit.com/r/Montgomery/comments/x/y/',
  venue: { name: 'Goat Haus' },
}

describe('validateExtracted', () => {
  it('accepts a well-formed event', () => {
    const { valid, rejected } = validateExtracted([good], new Date('2026-09-01T00:00:00Z'))
    expect(valid).toHaveLength(1)
    expect(rejected).toHaveLength(0)
  })
  it('rejects missing title/startDateTime/sourceUrl with reasons', () => {
    const { valid, rejected } = validateExtracted([
      { ...good, title: '' }, { ...good, startDateTime: 'tomorrow' }, { ...good, sourceUrl: 'not-a-url' },
    ], new Date('2026-09-01T00:00:00Z'))
    expect(valid).toHaveLength(0)
    expect(rejected.map(r => r.reason)).toEqual([
      expect.stringContaining('title'), expect.stringContaining('startDateTime'), expect.stringContaining('sourceUrl'),
    ])
  })
  it('rejects events in the past or beyond 120 days out', () => {
    const { rejected } = validateExtracted([
      { ...good, startDateTime: '2026-08-01T00:00:00.000Z' },
      { ...good, startDateTime: '2027-06-01T00:00:00.000Z' },
    ], new Date('2026-09-01T00:00:00Z'))
    expect(rejected).toHaveLength(2)
  })
  it('rejects unknown sourceType', () => {
    const { rejected } = validateExtracted([{ ...good, sourceType: 'made-up' }], new Date('2026-09-01T00:00:00Z'))
    expect(rejected[0].reason).toContain('sourceType')
  })
  it('rejects non-object entries without throwing', () => {
    const { valid, rejected } = validateExtracted([null, 'string', 42], new Date('2026-09-01T00:00:00Z'))
    expect(valid).toHaveLength(0)
    expect(rejected).toHaveLength(3)
  })
  it('accepts an event with extra unknown keys (allowlist-of-required, not strict-shape)', () => {
    const { valid, rejected } = validateExtracted([
      { ...good, someExtraField: 'whatever', anotherOne: 123 },
    ], new Date('2026-09-01T00:00:00Z'))
    expect(rejected).toHaveLength(0)
    expect(valid).toHaveLength(1)
  })
  it('throws a clear error for non-array top-level input', () => {
    expect(() => validateExtracted({ not: 'an array' } as unknown as unknown[], new Date('2026-09-01T00:00:00Z')))
      .toThrow(/array/i)
  })
  it('rejects (not throws) wrong-typed fields', () => {
    const { valid, rejected } = validateExtracted([
      { ...good, title: 42 },
      { ...good, title: { en: 'x' } },
      { ...good, sourceUrl: ['https://x.com'] },
      { ...good, startDateTime: 12345 },
      { ...good, sourceType: 7 },
    ], new Date('2026-09-01T00:00:00Z'))
    expect(valid).toHaveLength(0)
    expect(rejected).toHaveLength(5)
    expect(rejected[0].reason).toContain('title')
    expect(rejected[1].reason).toContain('title')
    expect(rejected[2].reason).toContain('sourceUrl')
    expect(rejected[3].reason).toContain('startDateTime')
    expect(rejected[4].reason).toContain('sourceType')
  })
  it('rejects malformed venue shapes but accepts valid or absent venue', () => {
    const { valid, rejected } = validateExtracted([
      { ...good, venue: 'Goat Haus' },
      { ...good, venue: { name: '' } },
      { ...good, venue: ['Goat Haus'] },
      { ...good, venue: { name: 'Goat Haus' } },
      { ...good, venue: undefined },
    ], new Date('2026-09-01T00:00:00Z'))
    expect(rejected).toHaveLength(3)
    for (const r of rejected) expect(r.reason).toContain('venue')
    expect(valid).toHaveLength(2)
  })
  it('rejects titles longer than 300 chars', () => {
    const { valid, rejected } = validateExtracted([
      { ...good, title: 'x'.repeat(10_000) },
    ], new Date('2026-09-01T00:00:00Z'))
    expect(valid).toHaveLength(0)
    expect(rejected[0].reason).toContain('title too long')
  })
})

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
})

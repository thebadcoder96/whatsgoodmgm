import { describe, expect, it } from 'vitest'
import { isSameEvent, isLikelyRecurring } from './dedupe'

const existing = { title: 'Trivia Night at The Alley', venueName: 'The Alley', startDateTime: '2026-07-08T00:30:00Z' }

describe('isSameEvent', () => {
  it('matches fuzzy title variants at the same venue on the same day', () => {
    expect(isSameEvent(
      { title: 'TRIVIA NIGHT — The Alley!!', venueName: 'The Alley Montgomery', startDateTime: '2026-07-07T23:00:00Z' },
      existing,
    )).toBe(true) // both are Jul 7 evening in Montgomery local time
  })
  it('rejects same title on a different day', () => {
    expect(isSameEvent(
      { title: 'Trivia Night at The Alley', venueName: 'The Alley', startDateTime: '2026-07-15T00:30:00Z' },
      existing,
    )).toBe(false)
  })
  it('rejects different events at the same venue same day', () => {
    expect(isSameEvent(
      { title: 'Salsa Dancing Social', venueName: 'The Alley', startDateTime: '2026-07-08T01:00:00Z' },
      existing,
    )).toBe(false)
  })
})

describe('isLikelyRecurring', () => {
  it('flags same title+venue as an approved event on another day', () => {
    expect(isLikelyRecurring(
      { title: 'Trivia Night at the Alley', venueName: 'The Alley', startDateTime: '2026-07-15T00:30:00Z' },
      [existing],
    )).toBe(true)
  })
  it('does not flag unrelated events', () => {
    expect(isLikelyRecurring(
      { title: 'Symphony Under the Stars', venueName: 'Blount Cultural Park', startDateTime: '2026-07-15T00:30:00Z' },
      [existing],
    )).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { allowRequest } from './rateLimit'

const HOUR = 60 * 60 * 1000

describe('allowRequest', () => {
  it('allows the first N requests within the window', () => {
    const t0 = 1_000_000
    for (let i = 0; i < 5; i++) {
      expect(allowRequest('a', 5, HOUR, t0 + i)).toBe(true)
    }
  })

  it('blocks request N+1 within the window', () => {
    const t0 = 1_000_000
    for (let i = 0; i < 5; i++) allowRequest('b', 5, HOUR, t0 + i)
    expect(allowRequest('b', 5, HOUR, t0 + 10)).toBe(false)
  })

  it('allows again after the window passes', () => {
    const t0 = 1_000_000
    for (let i = 0; i < 5; i++) allowRequest('c', 5, HOUR, t0 + i)
    expect(allowRequest('c', 5, HOUR, t0 + 10)).toBe(false)
    expect(allowRequest('c', 5, HOUR, t0 + HOUR + 100)).toBe(true)
  })

  it('tracks separate keys independently', () => {
    const t0 = 1_000_000
    for (let i = 0; i < 5; i++) allowRequest('d', 5, HOUR, t0 + i)
    expect(allowRequest('d', 5, HOUR, t0 + 10)).toBe(false)
    expect(allowRequest('e', 5, HOUR, t0 + 10)).toBe(true)
  })
})

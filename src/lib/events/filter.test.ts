import { describe, expect, it } from 'vitest'
import { matchesFilters } from './filter'
import type { EventDoc } from '@/lib/sanity/queries'

const ev = (over: Partial<EventDoc>): EventDoc => ({
  _id: 'x', title: 't', slug: 't', startDateTime: '2026-09-10T00:00:00Z',
  category: 'music', ...over,
} as EventDoc)

describe('matchesFilters', () => {
  it('passes everything with no filters', () => {
    expect(matchesFilters(ev({}), {})).toBe(true)
  })
  it('filters by category', () => {
    expect(matchesFilters(ev({ category: 'arts' }), { category: 'music' })).toBe(false)
    expect(matchesFilters(ev({ category: 'music' }), { category: 'music' })).toBe(true)
  })
  it('filters by interest membership', () => {
    expect(matchesFilters(ev({ interests: ['film'] }), { interest: 'film' })).toBe(true)
    expect(matchesFilters(ev({ interests: ['film'] }), { interest: 'kids' })).toBe(false)
    expect(matchesFilters(ev({}), { interest: 'kids' })).toBe(false)
  })
  it('free means the price text STARTS with free', () => {
    expect(matchesFilters(ev({ priceText: 'free' }), { free: true })).toBe(true)
    expect(matchesFilters(ev({ priceText: 'Free entry' }), { free: true })).toBe(true)
    expect(matchesFilters(ev({ priceText: '$8, kids free' }), { free: true })).toBe(false)
    expect(matchesFilters(ev({}), { free: true })).toBe(false)
  })
})

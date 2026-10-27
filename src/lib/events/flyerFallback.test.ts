import { describe, expect, it } from 'vitest'
import { flyerFallbackStyle, flyerInitial } from './flyerFallback'

describe('flyerInitial', () => {
  it('uses the first letter of the title', () => {
    expect(flyerInitial('Jazz at the River')).toBe('J')
  })
  it('trims leading whitespace and upper-cases the letter', () => {
    expect(flyerInitial('  riverfront market')).toBe('R')
  })
  it('falls back to a dot when there is no title', () => {
    expect(flyerInitial('')).toBe('·')
    expect(flyerInitial('   ')).toBe('·')
    expect(flyerInitial(undefined)).toBe('·')
  })
})

describe('flyerFallbackStyle', () => {
  it('tints the tile with the category hue and keeps it readable', () => {
    expect(flyerFallbackStyle('var(--hue-brick)')).toEqual({
      backgroundColor: 'color-mix(in srgb, var(--hue-brick) 16%, var(--surface-2))',
      color: 'var(--hue-brick)',
    })
  })
})

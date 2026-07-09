import { describe, it, expect } from 'vitest'
import { mapInterests } from './tag-interests'

describe('mapInterests', () => {
  it('tags bar trivia as games & trivia', () => {
    expect(mapInterests({ title: 'Trivia at Hilltop Public House', category: 'nightlife' }))
      .toContain('games-and-trivia')
  })

  it('tags karaoke as both games & trivia and live music', () => {
    const got = mapInterests({ title: 'Karaoke at Jerry’s Juke Joint', category: 'nightlife' })
    expect(got).toContain('games-and-trivia')
    expect(got).toContain('live-music')
  })

  it('tags a Capri film', () => {
    expect(mapInterests({ title: 'Shrek 2', category: 'arts', description: 'Two showings: 10am and 1pm.' }))
      .toContain('film')
  })

  it('tags the farmers market', () => {
    expect(mapInterests({ title: 'EastChase Farmers Market', category: 'food' }))
      .toContain('markets')
  })

  it('tags a museum art workshop', () => {
    expect(mapInterests({ title: 'Drop-In Art Workshop', category: 'arts' }))
      .toContain('art-and-making')
  })

  it('tags library story time as kids', () => {
    expect(mapInterests({ title: 'Groovin’ With Dinos Story Time', category: 'family' }))
      .toContain('kids')
  })

  it('tags a run club as fitness & outdoors', () => {
    expect(mapInterests({ title: 'Joggers ’n Lagers', category: 'sports' }))
      .toContain('fitness-and-outdoors')
  })

  it('tags a NewSouth author talk as books & talks', () => {
    expect(mapInterests({ title: 'Seth Panitch discusses his novel “Antique”', category: 'arts' }))
      .toContain('books-and-talks')
  })

  it('tags the 250th civic event as history & civic', () => {
    expect(mapInterests({ title: 'Declaration of Independence Reading & Liberty Bell Re-dedication', category: 'community' }))
      .toContain('history-and-civic')
  })

  it('tags a free-priced event as free stuff', () => {
    expect(mapInterests({ title: 'Free Liquor Tasting', category: 'food', priceText: 'Free' }))
      .toContain('free-stuff')
  })

  it('always returns at least one interest via category fallback', () => {
    const got = mapInterests({ title: '1K Vibe Takeover', category: 'nightlife' })
    expect(got.length).toBeGreaterThanOrEqual(1)
    expect(got).toContain('dancing')
  })

  it('returns interests in fixed vocabulary order', () => {
    const got = mapInterests({ title: 'Family Game Night', category: 'family', description: 'game night' })
    // kids-and games both fire; order must match INTERESTS declaration
    expect(got.indexOf('games-and-trivia')).toBeLessThan(got.indexOf('kids'))
  })
})

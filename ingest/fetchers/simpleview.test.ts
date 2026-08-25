import { describe, it, expect } from 'vitest'
import { mapSimpleviewDoc } from './simpleview'
import fixture from './__fixtures__/simpleview-sample.json'

const docs = (fixture as any).docs

describe('mapSimpleviewDoc', () => {
  it('maps a recurring-series occurrence, deriving the local calendar day from the UTC date bucket', () => {
    // fixture docs[0]: date "2026-09-03T04:59:59.000Z" is 2026-09-02 23:59:59 Central —
    // the occurrence's local day is 09-02, not the naive UTC-sliced 09-03.
    const ev = mapSimpleviewDoc(docs[0], 'https://experiencemontgomeryal.org')!
    expect(ev.title).toBe('Friends n Kin Board Game Night')
    expect(ev.startDateTime).toBe('2026-09-02T22:00:00.000Z') // 17:00 CDT
    expect(ev.endDateTime).toBe('2026-09-03T03:00:00.000Z') // 22:00 CDT
    expect(ev.sourceType).toBe('simpleview')
    expect(ev.sourceUrl).toBe('https://experiencemontgomeryal.org/event/friends-n-kin-board-game-night/2661/')
    expect(ev.priceText).toBe('Free, donations appreciated!')
    expect(ev.imageUrl).toMatch(/^https:\/\/assets\.simpleviewinc\.com\//)
    expect(ev.venue).toEqual({
      name: 'The Sanctuary (Jubilee Community Center)',
      address: '432 S. Goldthwaite Street, Montgomery',
    })
  })

  it('maps a one-off event with no endTime', () => {
    const ev = mapSimpleviewDoc(docs[1], 'https://experiencemontgomeryal.org')!
    expect(ev.title).toBe('The Rick Burgess Show Are You Ready Live Tour')
    expect(ev.startDateTime).toBe('2026-09-12T00:00:00.000Z') // 19:00 CDT on the 11th
    expect(ev.endDateTime).toBeUndefined()
    expect(ev.priceText).toBe('$69 - $99')
  })

  it('strips HTML tags from the description', () => {
    const ev = mapSimpleviewDoc(docs[1], 'https://experiencemontgomeryal.org')!
    expect(ev.description).not.toMatch(/<[^>]+>/)
    expect(ev.description).toContain('Rick Burgess Show')
  })

  it('carries admission through as priceText and image when present', () => {
    const withExtras = docs.find((d: any) => d.admission || d.media_raw?.length)
    if (!withExtras) return
    const ev = mapSimpleviewDoc(withExtras, 'https://experiencemontgomeryal.org')!
    if (withExtras.admission) expect(ev.priceText).toBe(withExtras.admission)
    if (withExtras.media_raw?.length) expect(ev.imageUrl).toBe(withExtras.media_raw[0].mediaurl)
  })

  it('drops a doc with no usable date', () => {
    const bad = { ...docs[0], date: undefined, dates: undefined }
    expect(mapSimpleviewDoc(bad, 'https://experiencemontgomeryal.org')).toBeNull()
  })

  it('drops a doc with no title', () => {
    const bad = { ...docs[0], title: '  ' }
    expect(mapSimpleviewDoc(bad, 'https://experiencemontgomeryal.org')).toBeNull()
  })
})

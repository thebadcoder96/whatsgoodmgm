import { describe, it, expect, vi, afterEach } from 'vitest'
import { mapSimpleviewDoc, simpleviewFetcher } from './simpleview'
import fixture from './__fixtures__/simpleview-sample.json'

const docs = (fixture as any).docs
const BASE = 'https://experiencemontgomeryal.org'

describe('mapSimpleviewDoc', () => {
  it('maps a recurring-series occurrence, deriving the local calendar day from the UTC date bucket', () => {
    // fixture docs[0]: date "2026-09-03T04:59:59.000Z" is 2026-09-02 23:59:59 Central —
    // the occurrence's local day is 09-02, not the naive UTC-sliced 09-03.
    const ev = mapSimpleviewDoc(docs[0], BASE)!
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
    const ev = mapSimpleviewDoc(docs[1], BASE)!
    expect(ev.title).toBe('The Rick Burgess Show Are You Ready Live Tour')
    expect(ev.startDateTime).toBe('2026-09-12T00:00:00.000Z') // 19:00 CDT on the 11th
    expect(ev.endDateTime).toBeUndefined()
    expect(ev.priceText).toBe('$69 - $99')
  })

  it('strips HTML tags from the description', () => {
    const ev = mapSimpleviewDoc(docs[1], BASE)!
    expect(ev.description).not.toMatch(/<[^>]+>/)
    expect(ev.description).toContain('Rick Burgess Show')
  })

  it('carries admission through as priceText and image when present', () => {
    const withExtras = docs.find((d: any) => d.admission || d.media_raw?.length)
    if (!withExtras) return
    const ev = mapSimpleviewDoc(withExtras, BASE)!
    if (withExtras.admission) expect(ev.priceText).toBe(withExtras.admission)
    if (withExtras.media_raw?.length) expect(ev.imageUrl).toBe(withExtras.media_raw[0].mediaurl)
  })

  it('treats a plain YYYY-MM-DD date string as that exact local day', () => {
    // Plain dates parse as UTC midnight = ~19:00 the prior day Central — the local-day
    // derivation must not shift these back a day.
    const doc = { ...docs[0], date: '2026-09-03' }
    const ev = mapSimpleviewDoc(doc, BASE)!
    expect(ev.startDateTime).toBe('2026-09-03T22:00:00.000Z') // 17:00 CDT on the 3rd
  })

  it('drops a doc whose date is nonsense', () => {
    const bad = { ...docs[0], date: 'sometime soon', dates: undefined }
    expect(mapSimpleviewDoc(bad, BASE)).toBeNull()
  })

  it('drops a doc with no usable date', () => {
    const bad = { ...docs[0], date: undefined, dates: undefined }
    expect(mapSimpleviewDoc(bad, BASE)).toBeNull()
  })

  it('drops a doc with no title', () => {
    const bad = { ...docs[0], title: '  ' }
    expect(mapSimpleviewDoc(bad, BASE)).toBeNull()
  })

  it('omits venue when location is missing', () => {
    const doc = { ...docs[0], location: undefined }
    expect(mapSimpleviewDoc(doc, BASE)!.venue).toBeUndefined()
  })

  it('omits imageUrl when media_raw is empty', () => {
    const doc = { ...docs[0], media_raw: [] }
    expect(mapSimpleviewDoc(doc, BASE)!.imageUrl).toBeUndefined()
  })

  it('falls back to local midnight when startTime is missing', () => {
    const doc = { ...docs[0], startTime: undefined, endTime: undefined }
    expect(mapSimpleviewDoc(doc, BASE)!.startDateTime).toBe('2026-09-02T05:00:00.000Z') // 00:00 CDT
  })

  it('drops a doc with no URL of any kind', () => {
    const bad = { ...docs[0], absoluteUrl: undefined, absolute_primary_url: undefined, url: undefined }
    expect(mapSimpleviewDoc(bad, BASE)).toBeNull()
  })
})

describe('simpleviewFetcher.fetchUpcoming', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('skips a doc whose time is unparseable instead of discarding the whole batch', async () => {
    const good = docs[0]
    const bad = { ...docs[0], _id: 'bad1', title: 'Bad Time Event', startTime: 'TBD' }
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('get_simple_token')) return { ok: true, text: async () => 'tok123\n' }
      return { ok: true, json: async () => ({ docs: [good, bad] }) } // < page size → single page
    }))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const evs = await simpleviewFetcher.fetchUpcoming(
      { _id: 'x', name: 'test', platform: 'simpleview', identifier: BASE }, 365 * 3)
    expect(evs).toHaveLength(1)
    expect(evs[0].title).toBe('Friends n Kin Board Game Night')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Bad Time Event'))
    warn.mockRestore()
  })
})

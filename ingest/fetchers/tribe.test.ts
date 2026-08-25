import { describe, it, expect, vi, afterEach } from 'vitest'
import { mapTribeEvent, tribeFetcher } from './tribe'
import fixture from './__fixtures__/tribe-sample.json'

const events = (fixture as any).events
const BASE = 'https://mccpl.lib.al.us'

describe('mapTribeEvent', () => {
  it('maps a fixture event with UTC-converted local dates', () => {
    // events[1] start_date "2026-08-25 03:30:00" is Montgomery CDT (UTC-5) in August.
    const raw = events[1]
    const ev = mapTribeEvent(raw)!
    expect(ev.title).toBe(raw.title)
    expect(ev.startDateTime).toBe('2026-08-25T08:30:00.000Z')
    expect(ev.endDateTime).toBe('2026-08-25T21:00:00.000Z')
    expect(ev.startDateTime).toMatch(/Z$/)
    expect(ev.sourceType).toBe('tribe')
    expect(ev.sourceUrl).toBe(raw.url)
  })

  it('decodes HTML entities in the title', () => {
    // events[0] title raw: "Game Gathering @ Morgan Children&#8217;s Dept."
    const ev = mapTribeEvent(events[0])!
    expect(ev.title).toBe('Game Gathering @ Morgan Children’s Dept.')
    expect(ev.title).not.toContain('&#8217;')
  })

  it('drops a description that is only calendar-widget chrome', () => {
    // The mccpl fixture description bodies are entirely widget/image markup with no prose —
    // stripping tags leaves only "@ Add to calendar ..." chrome, which must not surface as copy.
    for (const raw of events) {
      expect(mapTribeEvent(raw)!.description).toBeUndefined()
    }
  })

  it('strips tags, decodes entities, and removes widget chrome while keeping real prose', () => {
    const ev = mapTribeEvent({
      ...events[0],
      description: '<h3>Overview</h3><p>Kids&#8217; art &amp; crafts.</p>'
        + '<div class="tribe-block tribe-block__events-link">Add to calendar Google Calendar iCalendar Outlook 365 Outlook Live</div>',
    })!
    expect(ev.description).not.toMatch(/<[^>]+>/)
    expect(ev.description).not.toMatch(/Add to calendar/i)
    expect(ev.description).toBe('Overview Kids’ art & crafts.')
  })

  it('drops the schedule-widget leading "@" separator when prose follows (seen live on mccpl)', () => {
    const ev = mapTribeEvent({
      ...events[0],
      description: '<div class="tribe-events-schedule"><span> @ </span></div><p>September Programs are located on slide 2.</p>',
    })!
    expect(ev.description).toBe('September Programs are located on slide 2.')
  })

  it('handles missing venue/image without throwing', () => {
    const ev = mapTribeEvent({ title: 'X', start_date: '2026-09-03 10:00:00', url: 'https://x.example/e' })
    expect(ev?.venue).toBeUndefined()
    expect(ev?.imageUrl).toBeUndefined()
  })

  it('omits venue/image/cost for a real fixture event (library feed leaves them unset)', () => {
    // All 3 fixture events carry image:false, venue:[], cost:"" — verified against the live feed.
    const ev = mapTribeEvent(events[0])!
    expect(ev.venue).toBeUndefined()
    expect(ev.imageUrl).toBeUndefined()
    expect(ev.priceText).toBeUndefined()
  })

  it('maps a populated venue and image (shape confirmed live on mmfa.org, not in fixture)', () => {
    const ev = mapTribeEvent({
      title: 'Family Studio',
      start_date: '2026-08-29 10:30:00',
      url: 'https://mmfa.org/event/family-studio/',
      cost: 'Free',
      image: { url: 'https://mmfa.org/wp-content/uploads/example.jpg' },
      venue: { venue: 'Montgomery Museum of Fine Arts', address: 'One Museum Drive', city: 'Montgomery' },
    })!
    expect(ev.priceText).toBe('Free')
    expect(ev.imageUrl).toBe('https://mmfa.org/wp-content/uploads/example.jpg')
    expect(ev.venue).toEqual({ name: 'Montgomery Museum of Fine Arts', address: 'One Museum Drive, Montgomery' })
  })

  it('drops an event missing a title', () => {
    expect(mapTribeEvent({ ...events[0], title: '' })).toBeNull()
  })

  it('drops an event missing a start_date', () => {
    expect(mapTribeEvent({ ...events[0], start_date: undefined })).toBeNull()
  })

  it('drops an event missing a url', () => {
    expect(mapTribeEvent({ ...events[0], url: undefined })).toBeNull()
  })
})

describe('tribeFetcher.fetchUpcoming', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('skips an event whose date is unparseable instead of discarding the whole batch', async () => {
    const good = events[1]
    const bad = { ...events[0], title: 'Bad Date Event', start_date: 'not a date' }
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ events: [good, bad], next_rest_url: null }),
    })))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const evs = await tribeFetcher.fetchUpcoming(
      { _id: 'x', name: 'test', platform: 'tribe', identifier: BASE }, 60)
    expect(evs).toHaveLength(1)
    expect(evs[0].title).toBe('Breathe @ Morgan Young Adult Dept.')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Bad Date Event'))
    warn.mockRestore()
  })

  it('follows next_rest_url until it is null', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ events: [events[0]], next_rest_url: `${BASE}/page2` }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ events: [events[1]], next_rest_url: null }) })
    vi.stubGlobal('fetch', fetchMock)
    const evs = await tribeFetcher.fetchUpcoming(
      { _id: 'x', name: 'test', platform: 'tribe', identifier: BASE }, 60)
    expect(evs).toHaveLength(2)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('logs when the pagination cap truncates results', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
      ok: true,
      json: async () => ({ events: [events[0]], next_rest_url: `${url}&more=1` }),
    })))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await tribeFetcher.fetchUpcoming({ _id: 'x', name: 'test', platform: 'tribe', identifier: BASE }, 60)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Pagination cap reached'))
    warn.mockRestore()
  })

  it('throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })))
    await expect(tribeFetcher.fetchUpcoming(
      { _id: 'x', name: 'test', platform: 'tribe', identifier: BASE }, 60)).rejects.toThrow('HTTP 500')
  })
})

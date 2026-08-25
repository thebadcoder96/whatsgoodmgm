import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseCivicplusRss, civicplusFetcher } from './civicplus'

const xml = readFileSync(new URL('./__fixtures__/civicplus-sample.xml', import.meta.url), 'utf8')

describe('parseCivicplusRss', () => {
  it('extracts items with titles, links, and parsed local dates', () => {
    const events = parseCivicplusRss(xml)
    expect(events.length).toBeGreaterThan(0)
    for (const ev of events) {
      expect(ev.title).toBeTruthy()
      expect(ev.sourceUrl).toMatch(/^https?:\/\//)
      expect(ev.startDateTime).toMatch(/Z$/)
      expect(ev.sourceType).toBe('civicplus')
    }
  })

  it('drops items whose date cannot be parsed', () => {
    const bad = '<rss><channel><item><title>No date here</title><link>https://x.example</link><description>nothing</description></item></channel></rss>'
    expect(parseCivicplusRss(bad)).toHaveLength(0)
  })

  it('maps the fixture "Preschool Storytime" item with an exact hand-computed UTC start/end', () => {
    // Live capture (2026-08-25): <calendarEvent:EventDates> " August 28, 2026 ",
    // <calendarEvent:EventTimes> "10:00 AM - 11:00 AM". August is CDT (UTC-5),
    // so 10:00 AM local -> 15:00Z and 11:00 AM local -> 16:00Z.
    const events = parseCivicplusRss(xml)
    const ev = events.find(e => e.title === 'Preschool Storytime')!
    expect(ev).toBeDefined()
    expect(ev.startDateTime).toBe('2026-08-28T15:00:00.000Z')
    expect(ev.endDateTime).toBe('2026-08-28T16:00:00.000Z')
    expect(ev.sourceUrl).toBe('https://www.wetumpkaal.gov/Calendar.aspx?EID=1143')
    expect(ev.sourceType).toBe('civicplus')
  })

  it('parses the street/city address out of the description, not the squished namespaced Location field', () => {
    // The feed's <calendarEvent:Location> tag concatenates the two address lines with no
    // separator ("...StreetWetumpka, AL..."); the <description> HTML has them on separate
    // <br>-delimited lines, so that's the source of truth for a clean address.
    const events = parseCivicplusRss(xml)
    const ev = events.find(e => e.title === 'Preschool Storytime')!
    expect(ev.venue?.address).toBe('212 South Main Street, Wetumpka, AL 36092')
  })

  it('extracts the description body past the "Description:" label and decodes entities within it', () => {
    // events[1] "Book Bites Book Club" description body contains &quot;-encoded quotes.
    const events = parseCivicplusRss(xml)
    const ev = events.find(e => e.title === 'Book Bites Book Club')!
    expect(ev.description).toBe('10:00 AM "The Silent Patient" by Alex Michaelides')
  })

  it('handles the fixture item with an asymmetric AM/PM time range (10:00 AM - 11:00 PM)', () => {
    // "Preachool Storytime" [sic, typo present in the live source] is the fixture's odd one out:
    // an end time on the PM side of noon, spanning midnight in UTC.
    const events = parseCivicplusRss(xml)
    const ev = events.find(e => e.title === 'Preachool Storytime')!
    expect(ev.startDateTime).toBe('2026-09-04T15:00:00.000Z')
    expect(ev.endDateTime).toBe('2026-09-05T04:00:00.000Z')
  })

  it('anchors the description fallback to the "Event date:" label, not the first date mentioned', () => {
    // No structured calendarEvent tags: a competing labeled date ("Register by:") appears BEFORE
    // the real event date. The fallback must pick August 28, not the July 1 registration deadline.
    const item = '<rss><channel><item>'
      + '<title>Fall Festival</title><link>https://x.example/fall</link>'
      + '<description>&lt;strong&gt;Register by:&lt;/strong&gt; July 1, 2026 &lt;br&gt;'
      + '&lt;strong&gt;Event date:&lt;/strong&gt; August 28, 2026 &lt;br&gt;'
      + '&lt;strong&gt;Event Time: &lt;/strong&gt;10:00 AM - 11:00 AM</description>'
      + '</item></channel></rss>'
    const events = parseCivicplusRss(item)
    expect(events).toHaveLength(1)
    expect(events[0].startDateTime).toBe('2026-08-28T15:00:00.000Z')
    expect(events[0].endDateTime).toBe('2026-08-28T16:00:00.000Z')
  })

  it('drops an item with no structured tags and no "Event date:" label, even if a stray date appears', () => {
    // A date mention not labeled as the event date must never be guessed at (drop, never guess).
    const item = '<rss><channel><item>'
      + '<title>New Exhibit</title><link>https://x.example/exhibit</link>'
      + '<description>Come celebrate! Doors opened June 5, 2026 for our new exhibit.</description>'
      + '</item></channel></rss>'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(parseCivicplusRss(item)).toHaveLength(0)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('New Exhibit'))
    warn.mockRestore()
  })

  it('does not use pubDate as the event date', () => {
    // "Preschool Storytime" pubDate is "Fri, 17 Jul 2026" but its event date is August 28, 2026.
    const events = parseCivicplusRss(xml)
    const ev = events.find(e => e.title === 'Preschool Storytime')!
    expect(ev.startDateTime.startsWith('2026-07')).toBe(false)
    expect(ev.startDateTime.startsWith('2026-08-28')).toBe(true)
  })
})

describe('civicplusFetcher.fetchUpcoming', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('fetches the feed and returns events within the window', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => xml })))
    const evs = await civicplusFetcher.fetchUpcoming(
      { _id: 'x', name: 'wetumpka', platform: 'civicplus', identifier: 'https://wetumpkaal.gov/RSSFeed.aspx?ModID=58&CID=All-calendar.xml' }, 3650)
    expect(evs.length).toBeGreaterThan(0)
    for (const ev of evs) expect(ev.sourceType).toBe('civicplus')
  })

  it('skips an item whose date is unparseable instead of discarding the whole batch', async () => {
    const bad = '<item><title>Bad Date Event</title><link>https://x.example</link><description>nothing</description></item>'
    const mixed = xml.replace('</channel>', `${bad}</channel>`)
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => mixed })))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const evs = await civicplusFetcher.fetchUpcoming(
      { _id: 'x', name: 'wetumpka', platform: 'civicplus', identifier: 'https://wetumpkaal.gov/RSSFeed.aspx?ModID=58&CID=All-calendar.xml' }, 3650)
    expect(evs.some(e => e.title === 'Bad Date Event')).toBe(false)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })))
    await expect(civicplusFetcher.fetchUpcoming(
      { _id: 'x', name: 'wetumpka', platform: 'civicplus', identifier: 'https://wetumpkaal.gov/RSSFeed.aspx?ModID=58&CID=All-calendar.xml' }, 60)).rejects.toThrow('HTTP 500')
  })
})

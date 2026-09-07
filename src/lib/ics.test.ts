import { describe, expect, it } from 'vitest'
import { escapeIcsText, foldLine, icsStamp, buildCalendar } from './ics'
import type { EventDoc } from '@/lib/sanity/queries'

const ev = (over: Partial<EventDoc>): EventDoc => ({
  _id: 'ev1', title: 'trivia night', slug: 'trivia-night',
  startDateTime: '2026-09-08T00:00:00Z', category: 'nightlife', ...over,
} as EventDoc)

const NOW = new Date('2026-09-07T12:00:00Z')
const SITE = 'https://whatsgoodmgm.com'

describe('escapeIcsText', () => {
  it('escapes backslash, semicolon, comma and newlines', () => {
    expect(escapeIcsText('a;b,c\\d\ne')).toBe('a\\;b\\,c\\\\d\\ne')
  })
})

describe('foldLine', () => {
  it('leaves short lines alone', () => {
    expect(foldLine('SUMMARY:hi')).toBe('SUMMARY:hi')
  })
  it('folds long lines with CRLF + space continuations', () => {
    const folded = foldLine('DESCRIPTION:' + 'x'.repeat(200))
    const parts = folded.split('\r\n')
    expect(parts.length).toBeGreaterThan(1)
    expect(parts[0].length).toBe(75)
    for (const p of parts.slice(1)) expect(p.startsWith(' ')).toBe(true)
  })
})

describe('icsStamp', () => {
  it('renders basic-format UTC', () => {
    expect(icsStamp('2026-09-08T00:30:00Z')).toBe('20260908T003000Z')
  })
})

describe('buildCalendar', () => {
  it('emits a valid VCALENDAR with one VEVENT per occurrence', () => {
    const body = buildCalendar(
      [{ e: ev({}), occursAt: '2026-09-08T00:00:00Z' }], SITE, NOW)
    expect(body.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(body.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
    expect(body).toContain('BEGIN:VEVENT')
    expect(body).toContain('SUMMARY:trivia night')
    expect(body).toContain('DTSTART:20260908T000000Z')
    // no endDateTime -> default 2h duration
    expect(body).toContain('DTEND:20260908T020000Z')
    expect(body).toContain('UID:ev1-20260908T000000Z@whatsgoodmgm.com')
    expect(body).toContain('URL:https://whatsgoodmgm.com/events/trivia-night')
    expect(body).toContain('DTSTAMP:20260907T120000Z')
  })
  it('uses the real end time and includes escaped location', () => {
    const body = buildCalendar([{
      e: ev({
        endDateTime: '2026-09-08T03:00:00Z',
        venue: { _id: 'v', name: 'common bond', address: '424 bibb st, montgomery' },
      }),
      occursAt: '2026-09-08T00:00:00Z',
    }], SITE, NOW)
    expect(body).toContain('DTEND:20260908T030000Z')
    expect(body).toContain('LOCATION:common bond\\, 424 bibb st\\, montgomery')
  })
  it('recurring occurrences keep the source duration and get distinct UIDs', () => {
    const e = ev({ endDateTime: '2026-09-08T02:00:00Z', recurrence: { frequency: 'weekly' } })
    const body = buildCalendar([
      { e, occursAt: '2026-09-08T00:00:00Z' },
      { e, occursAt: '2026-09-15T00:00:00Z' },
    ], SITE, NOW)
    expect(body).toContain('UID:ev1-20260908T000000Z@whatsgoodmgm.com')
    expect(body).toContain('UID:ev1-20260915T000000Z@whatsgoodmgm.com')
    expect(body).toContain('DTEND:20260915T020000Z')
  })
})

import type { EventDoc } from '@/lib/sanity/queries'
import type { Occurrence } from '@/lib/events/grouping'

// RFC 5545 text escaping: backslash first, then structural chars, then newlines.
export function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// RFC 5545 line folding at 75 chars; continuations start with a single space.
export function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts = [line.slice(0, 75)]
  for (let i = 75; i < line.length; i += 74) parts.push(' ' + line.slice(i, i + 74))
  return parts.join('\r\n')
}

// Basic-format UTC stamp: 20260908T003000Z
export function icsStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000

function vevent(e: EventDoc, occursAt: string, siteUrl: string, dtstamp: string): string[] {
  const durationMs = e.endDateTime
    ? Math.max(Date.parse(e.endDateTime) - Date.parse(e.startDateTime), 0)
    : DEFAULT_DURATION_MS
  const end = new Date(Date.parse(occursAt) + durationMs).toISOString()
  const url = `${siteUrl}/events/${e.slug}`
  const location = [e.venue?.name, e.venue?.address].filter(Boolean).join(', ')
  const description = [e.description?.trim(), url].filter(Boolean).join('\n\n')

  const lines = [
    'BEGIN:VEVENT',
    `UID:${e._id}-${icsStamp(occursAt)}@whatsgoodmgm.com`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${icsStamp(occursAt)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${escapeIcsText(e.title)}`,
    `URL:${url}`,
  ]
  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`)
  if (description) lines.push(`DESCRIPTION:${escapeIcsText(description)}`)
  lines.push('END:VEVENT')
  return lines
}

export function buildCalendar(items: Occurrence[], siteUrl: string, now: Date = new Date()): string {
  const dtstamp = icsStamp(now.toISOString())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//whatsgoodmgm//events//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:whatsgoodmgm',
    'X-WR-TIMEZONE:America/Chicago',
    ...items.flatMap(({ e, occursAt }) => vevent(e, occursAt, siteUrl, dtstamp)),
    'END:VCALENDAR',
  ]
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

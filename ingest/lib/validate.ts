import type { NormalizedEvent } from '../fetchers/types'

const SOURCE_TYPES = new Set(['eventbrite', 'facebook', 'ics', 'reddit', 'simpleview', 'tribe', 'statsapi', 'civicplus', 'website'])
const MAX_DAYS_OUT = 120
const MAX_TITLE_LENGTH = 300

export type Rejected = { event: unknown; reason: string }

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function checkEntry(raw: unknown, now: Date): string | null {
  if (!isPlainObject(raw)) return 'not an object'
  const e = raw as Partial<Record<keyof NormalizedEvent, unknown>>

  if (typeof e.title !== 'string' || !e.title.trim()) return 'missing title'
  if (e.title.length > MAX_TITLE_LENGTH) return `title too long (max ${MAX_TITLE_LENGTH} chars)`

  const start = typeof e.startDateTime === 'string' ? Date.parse(e.startDateTime) : NaN
  if (Number.isNaN(start)) return 'invalid startDateTime (must be UTC ISO)'

  if (typeof e.sourceUrl !== 'string' || !/^https?:\/\//.test(e.sourceUrl)) return 'missing or invalid sourceUrl'
  if (typeof e.sourceType !== 'string' || !SOURCE_TYPES.has(e.sourceType)) return `unknown sourceType "${String(e.sourceType)}"`

  if (start < now.getTime() - 6 * 3_600_000) return 'startDateTime in the past'
  if (start > now.getTime() + MAX_DAYS_OUT * 86_400_000) return `startDateTime beyond ${MAX_DAYS_OUT} days out`

  if (e.venue !== undefined) {
    if (!isPlainObject(e.venue)) return 'invalid venue (must be an object)'
    if (typeof e.venue.name !== 'string' || !e.venue.name.trim()) return 'invalid venue (missing name)'
  }
  return null
}

export function validateExtracted(input: unknown[], now = new Date()):
  { valid: NormalizedEvent[]; rejected: Rejected[] } {
  if (!Array.isArray(input)) throw new Error('validateExtracted: input must be an array of events')

  const valid: NormalizedEvent[] = [], rejected: Rejected[] = []
  for (const raw of input) {
    let reason: string | null
    try {
      reason = checkEntry(raw, now)
    } catch (err) {
      reason = `validation error: ${err instanceof Error ? err.message : String(err)}`
    }
    if (reason) rejected.push({ event: raw, reason })
    else valid.push(raw as NormalizedEvent)
  }
  return { valid, rejected }
}

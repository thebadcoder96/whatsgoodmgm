import type { NormalizedEvent } from '../fetchers/types'

const SOURCE_TYPES = new Set(['eventbrite', 'facebook', 'ics', 'reddit', 'simpleview', 'tribe', 'statsapi', 'civicplus', 'website'])
const MAX_DAYS_OUT = 120

export type Rejected = { event: unknown; reason: string }

export function validateExtracted(input: unknown[], now = new Date()):
  { valid: NormalizedEvent[]; rejected: Rejected[] } {
  if (!Array.isArray(input)) throw new Error('validateExtracted: input must be an array of events')

  const valid: NormalizedEvent[] = [], rejected: Rejected[] = []
  for (const raw of input) {
    const e = raw as Partial<NormalizedEvent> | null | undefined
    const isObject = !!e && typeof e === 'object'
    const start = isObject && e.startDateTime ? Date.parse(e.startDateTime) : NaN
    const reason =
      !isObject ? 'not an object'
      : !e.title?.trim() ? 'missing title'
      : Number.isNaN(start) ? 'invalid startDateTime (must be UTC ISO)'
      : !e.sourceUrl || !/^https?:\/\//.test(e.sourceUrl) ? 'missing or invalid sourceUrl'
      : !e.sourceType || !SOURCE_TYPES.has(e.sourceType) ? `unknown sourceType "${e.sourceType}"`
      : start < now.getTime() - 6 * 3_600_000 ? 'startDateTime in the past'
      : start > now.getTime() + MAX_DAYS_OUT * 86_400_000 ? `startDateTime beyond ${MAX_DAYS_OUT} days out`
      : null
    if (reason) rejected.push({ event: raw, reason })
    else valid.push(e as NormalizedEvent)
  }
  return { valid, rejected }
}

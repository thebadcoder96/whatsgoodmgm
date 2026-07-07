import * as fuzz from 'fuzzball'
import { localDay, normalizeText } from './normalize'

export type ComparableEvent = { title: string; venueName?: string; startDateTime: string }

const TITLE_THRESHOLD = 85
const VENUE_THRESHOLD = 80

function titleMatch(a: ComparableEvent, b: ComparableEvent): boolean {
  const t = fuzz.token_set_ratio(normalizeText(a.title), normalizeText(b.title))
  if (t < TITLE_THRESHOLD) return false
  const av = normalizeText(a.venueName ?? ''); const bv = normalizeText(b.venueName ?? '')
  if (!av || !bv) return true // missing venue → title alone decides
  return fuzz.token_set_ratio(av, bv) >= VENUE_THRESHOLD
}

const MAX_START_DRIFT_MS = 2 * 60 * 60 * 1000 // cross-source listings drift (door vs show time); sequels are further apart

/**
 * Same real-world event: same Montgomery calendar day, start within 2h, fuzzy title/venue match.
 * Known limitation: one event listed with start times >2h apart across sources will create two
 * pending docs — the human approval queue catches those.
 */
export function isSameEvent(incoming: ComparableEvent, existing: ComparableEvent): boolean {
  return localDay(incoming.startDateTime) === localDay(existing.startDateTime) &&
    Math.abs(new Date(incoming.startDateTime).getTime() - new Date(existing.startDateTime).getTime()) <= MAX_START_DRIFT_MS &&
    titleMatch(incoming, existing)
}

/** Same title+venue as an approved event on a DIFFERENT day → probably a recurring series. */
export function isLikelyRecurring(incoming: ComparableEvent, approved: ComparableEvent[]): boolean {
  return approved.some(e => localDay(e.startDateTime) !== localDay(incoming.startDateTime) && titleMatch(incoming, e))
}

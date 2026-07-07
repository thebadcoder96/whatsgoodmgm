const TZ = 'America/Chicago'

export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()
}

/** Calendar day in Montgomery local time — two UTC timestamps on the same local evening must match. */
export function localDay(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(iso)) // en-CA → YYYY-MM-DD
}

export function makeDedupeKey(title: string, venueName: string, startIso: string): string {
  return `${localDay(startIso)}|${normalizeText(venueName)}|${normalizeText(title)}`
}

export function makeSlug(title: string, startIso: string): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${localDay(startIso)}`
}

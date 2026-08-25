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
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${base || 'event'}-${localDay(startIso)}`
}

/** "YYYY-MM-DD HH:mm[:ss]" (or date-only) in Montgomery local time → UTC ISO. */
export function chicagoToUtc(local: string): string {
  const [d, t = '00:00:00'] = local.trim().split(/[ T]/)
  const naive = new Date(`${d}T${t.length === 5 ? t + ':00' : t}Z`)
  if (Number.isNaN(naive.getTime())) throw new Error(`Invalid local datetime: "${local}"`)
  const offsetAt = (instant: Date): number => {
    const tzPart = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
      .formatToParts(instant).find(p => p.type === 'timeZoneName')!.value // "GMT-5" / "GMT-6"
    const m = tzPart.match(/GMT([+-]\d+)(?::(\d+))?/)
    return m ? parseInt(m[1], 10) * 60 + (m[2] ? Math.sign(parseInt(m[1], 10)) * parseInt(m[2], 10) : 0) : -360
  }
  // The offset at the naive instant can sit on the wrong side of a DST switch;
  // re-deriving it from the provisional UTC instant converges. The ambiguous
  // fall-back hour resolves to its earlier (daylight-time) occurrence.
  const provisional = new Date(naive.getTime() - offsetAt(naive) * 60_000)
  return new Date(naive.getTime() - offsetAt(provisional) * 60_000).toISOString()
}

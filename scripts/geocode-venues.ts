import { config } from 'dotenv'
config({ path: '.env.local', quiet: true })
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-07-01', token: process.env.SANITY_WRITE_TOKEN!, useCdn: false,
})

// ── Nominatim etiquette ───────────────────────────────────────────────────
const USER_AGENT = 'WhatsGoodMGM/1.0 (community events site; contact writemishal@gmail.com)'
const MIN_DELAY_MS = 1100

// Montgomery, AL metro bounding box
const BBOX = { minLat: 32.20, maxLat: 32.55, minLng: -86.45, maxLng: -86.05 }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

let lastCallAt = 0
async function throttledSearch(q: string): Promise<NominatimResult[]> {
  const elapsed = Date.now() - lastCallAt
  if (lastCallAt !== 0 && elapsed < MIN_DELAY_MS) await sleep(MIN_DELAY_MS - elapsed)
  lastCallAt = Date.now()

  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    format: 'jsonv2', limit: '3', q, addressdetails: '1',
  }).toString()}`

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' } })
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)
  return (await res.json()) as NominatimResult[]
}

interface NominatimResult {
  place_id: number
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  category: string // jsonv2 field name (older Nominatim docs call this "class")
  type: string
  importance?: number
  display_name: string
  address?: Record<string, string>
}

type Venue = { _id: string; name: string; address?: string | null; neighborhood?: string | null }

// ── Matching heuristics ──────────────────────────────────────────────────
const STOPWORDS = new Set(['the', 'and', 'of', 'on', 'at', 'for', 'a', 'an'])

function normalizeTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !STOPWORDS.has(t))
}

function nameTokenOverlap(name: string, displayName: string): boolean {
  const tokens = normalizeTokens(name)
  const dn = displayName.toLowerCase()
  return tokens.some(t => dn.includes(t))
}

function addressExactMatch(address: string | null | undefined, displayName: string): boolean {
  if (!address) return false
  const street = address.split(',')[0]!.trim().toLowerCase()
  if (street.length < 4) return false
  return displayName.toLowerCase().includes(street)
}

function typeScore(c: NominatimResult): number {
  if (c.category === 'amenity' || c.category === 'leisure' || c.category === 'tourism') return 2
  if (c.category === 'shop' || c.category === 'office') return 1
  return 0
}

function trimAddress(c: NominatimResult): string {
  const addr = c.address
  if (addr) {
    // OSM sometimes packs multiple house numbers as "2885;2885-B" — take the first.
    const houseNumber = addr.house_number?.split(';')[0]
    const street = [houseNumber, addr.road].filter(Boolean).join(' ')
    const city = addr.city || addr.town || addr.village || addr.suburb || 'Montgomery'
    const parts = [street, city, 'AL'].filter(Boolean)
    if (street) return parts.join(', ')
  }
  // Fallback: first couple of segments of the display_name.
  return c.display_name.split(',').slice(0, 2).join(',').trim()
}

type Evaluation =
  | { accepted: NominatimResult & { latNum: number; lngNum: number } }
  | { rejected: string }

function evaluate(results: NominatimResult[], venue: Venue): Evaluation {
  if (results.length === 0) return { rejected: 'no results from Nominatim' }

  const withCoords = results.map(r => ({ ...r, latNum: parseFloat(r.lat), lngNum: parseFloat(r.lon) }))

  const inBbox = withCoords.filter(
    c => c.latNum >= BBOX.minLat && c.latNum <= BBOX.maxLat && c.lngNum >= BBOX.minLng && c.lngNum <= BBOX.maxLng
  )
  if (inBbox.length === 0) return { rejected: `${results.length} result(s), all outside Montgomery metro bbox` }

  const inMontgomery = inBbox.filter(c => c.display_name.toLowerCase().includes('montgomery'))
  if (inMontgomery.length === 0) return { rejected: 'in-bbox result(s) missing "Montgomery" in display_name' }

  const matched = inMontgomery.filter(
    c => nameTokenOverlap(venue.name, c.display_name) || addressExactMatch(venue.address, c.display_name)
  )
  if (matched.length === 0) {
    return { rejected: `${inMontgomery.length} Montgomery candidate(s) but none matched venue name/address (likely generic-name collision)` }
  }

  matched.sort((a, b) => typeScore(b) - typeScore(a) || (b.importance ?? 0) - (a.importance ?? 0))
  return { accepted: matched[0]! }
}

// ── Known-imprecise pins to re-verify ─────────────────────────────────────
// These venues were pinned with hand-entered coordinates that review found
// imprecise (e.g. MMFA's pin reverse-geocoded to AUM Drive, ~4 km from the
// museum). Re-verify each against Nominatim using its authoritative street
// address and correct the pin. `fallback` coordinates are only present where
// they were independently reverse-geocode-verified; a venue without a
// fallback is left untouched if Nominatim cannot verify it.
const EPSILON = 0.0005 // ~50 m — a pin this close to the verified point is already correct

type Correction = {
  id: string
  name: string
  address: string
  fallback?: { lat: number; lng: number }
}

const CORRECTIONS: Correction[] = [
  { id: 'venue-mmfa', name: 'Montgomery Museum of Fine Arts', address: '1 Museum Dr, Montgomery, AL 36117', fallback: { lat: 32.351, lng: -86.2064 } },
  { id: 'venue-zoo', name: 'Montgomery Zoo', address: '2301 Coliseum Pkwy, Montgomery, AL 36110', fallback: { lat: 32.4213, lng: -86.2776 } },
  { id: 'venue-montgomerywhitewater', name: 'Montgomery Whitewater', address: '1100 Maxwell Blvd, Montgomery, AL 36104' },
  { id: 'venue-commonbond', name: 'Common Bond Brewers', address: '424 Bibb St, Montgomery, AL 36104' },
]

type Row = { venue: string; status: 'ACCEPTED' | 'REJECTED' | 'CORRECTED' | 'SKIPPED' | 'LEFT AS-IS'; detail: string }
const OK_STATUSES = new Set(['ACCEPTED', 'CORRECTED', 'SKIPPED'])

async function geocodeVenue(venue: Venue): Promise<Evaluation> {
  const queries: string[] = []
  if (venue.address) queries.push(`${venue.name}, ${venue.address}`)
  queries.push(`${venue.name}, Montgomery, Alabama`)

  let outcome: Evaluation = { rejected: 'no queries attempted' }
  for (const q of queries) {
    let raw: NominatimResult[]
    try {
      raw = await throttledSearch(q)
    } catch (e) {
      outcome = { rejected: `fetch error: ${(e as Error).message}` }
      continue
    }
    outcome = evaluate(raw, venue)
    if ('accepted' in outcome) break
  }
  return outcome
}

async function correctImprecisePins(rows: Row[]): Promise<void> {
  console.log(`\nRe-verifying ${CORRECTIONS.length} known-imprecise pin(s)...`)

  for (const c of CORRECTIONS) {
    const current = await client.fetch<{ lat?: number; lng?: number } | null>(
      `*[_type=="venue" && _id==$id][0]{lat, lng}`, { id: c.id }
    )
    if (!current) {
      rows.push({ venue: c.name, status: 'LEFT AS-IS', detail: `document ${c.id} not found in dataset` })
      continue
    }

    const outcome = await geocodeVenue({ _id: c.id, name: c.name, address: c.address })
    let target: { lat: number; lng: number; via: string } | null = null
    let rejectedReason = ''
    if ('accepted' in outcome) {
      target = { lat: outcome.accepted.latNum, lng: outcome.accepted.lngNum, via: outcome.accepted.display_name }
    } else {
      rejectedReason = outcome.rejected
      if (c.fallback) target = { ...c.fallback, via: 'fallback: independently reverse-geocode-verified coordinates' }
    }

    if (!target) {
      rows.push({ venue: c.name, status: 'LEFT AS-IS', detail: `unverifiable via Nominatim (${rejectedReason}); no verified fallback — keeping existing pin` })
      continue
    }

    const alreadyCorrect =
      current.lat != null && current.lng != null &&
      Math.abs(current.lat - target.lat) < EPSILON && Math.abs(current.lng - target.lng) < EPSILON
    if (alreadyCorrect) {
      rows.push({ venue: c.name, status: 'SKIPPED', detail: `pin already within ~50 m of verified point (${target.lat.toFixed(4)}, ${target.lng.toFixed(4)})` })
      continue
    }

    await client.patch(c.id).set({ lat: target.lat, lng: target.lng, address: c.address }).commit()
    const from = current.lat != null && current.lng != null ? `(${current.lat.toFixed(4)}, ${current.lng.toFixed(4)})` : '(unpinned)'
    rows.push({ venue: c.name, status: 'CORRECTED', detail: `${from} → (${target.lat.toFixed(4)}, ${target.lng.toFixed(4)}) — ${target.via}` })
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const venues = await client.fetch<Venue[]>(
    `*[_type=="venue" && !defined(lat)]{_id, name, address, neighborhood}`
  )

  console.log(`Found ${venues.length} unpinned venue(s). Geocoding via Nominatim (~${MIN_DELAY_MS}ms/request)...\n`)

  const rows: Row[] = []
  let accepted = 0

  for (const venue of venues) {
    const outcome = await geocodeVenue(venue)

    if ('accepted' in outcome) {
      const c = outcome.accepted
      const patch: Record<string, unknown> = { lat: c.latNum, lng: c.lngNum }
      if (!venue.address) patch.address = trimAddress(c)
      await client.patch(venue._id).set(patch).commit()
      accepted++
      rows.push({
        venue: venue.name,
        status: 'ACCEPTED',
        detail: `(${c.latNum.toFixed(4)}, ${c.lngNum.toFixed(4)}) — ${c.display_name}`,
      })
    } else {
      rows.push({ venue: venue.name, status: 'REJECTED', detail: outcome.rejected })
    }
  }

  await correctImprecisePins(rows)

  console.log('\n── Geocoding results ──────────────────────────────────────────────')
  for (const r of rows) {
    console.log(`${OK_STATUSES.has(r.status) ? '✔' : '✘'} ${r.venue.padEnd(32)} ${r.status.padEnd(10)} ${r.detail}`)
  }
  console.log('────────────────────────────────────────────────────────────────────')
  const corrected = rows.filter(r => r.status === 'CORRECTED').length
  const skipped = rows.filter(r => r.status === 'SKIPPED').length
  const leftAsIs = rows.filter(r => r.status === 'LEFT AS-IS').length
  const rejected = rows.filter(r => r.status === 'REJECTED').length
  console.log(
    `Unpinned: ${accepted} accepted, ${rejected} rejected. ` +
    `Corrections: ${corrected} corrected, ${skipped} already correct, ${leftAsIs} left as-is.`
  )
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

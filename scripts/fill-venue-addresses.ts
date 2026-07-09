import { config } from 'dotenv'
config({ path: '.env.local', quiet: true })
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-07-01', token: process.env.SANITY_WRITE_TOKEN!, useCdn: false,
})

// Nominatim etiquette (matches scripts/geocode-venues.ts)
const USER_AGENT = 'WhatsGoodMGM/1.0 (community events site; contact writemishal@gmail.com)'
const MIN_DELAY_MS = 1100

// Relaxed Montgomery County bounding box (widened south/west so rural Pintlala
// on Federal Rd still validates while keeping obviously-wrong pins out).
const BBOX = { minLat: 32.10, maxLat: 32.60, minLng: -86.50, maxLng: -86.00 }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

let lastCallAt = 0
async function throttledSearch(q: string): Promise<NominatimResult[]> {
  const elapsed = Date.now() - lastCallAt
  if (lastCallAt !== 0 && elapsed < MIN_DELAY_MS) await sleep(MIN_DELAY_MS - elapsed)
  lastCallAt = Date.now()

  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    format: 'jsonv2', limit: '5', q, addressdetails: '1',
  }).toString()}`

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' } })
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)
  return (await res.json()) as NominatimResult[]
}

interface NominatimResult {
  lat: string
  lon: string
  category: string
  type: string
  importance?: number
  display_name: string
  address?: Record<string, string>
}

// Research-verified addresses for venues that had no coordinates in the dataset.
// Each address is quoted from the credited source (business site, Yelp, city /
// library page). Coordinates are NOT hand-entered here: the script geocodes each
// address via Nominatim at runtime and stores lat/lng only on a confident match.
type Entry = { id: string; name: string; address: string; source: string }

const ENTRIES: Entry[] = [
  // https://www.811grill.com/  (official site, "2950 E SOUTH BLVD MONTGOMERY, AL 36116")
  { id: 'venue-811', name: '811 Bar and Grill', address: '2950 E South Blvd, Montgomery, AL 36116', source: '811grill.com' },
  // https://www.montgomeryal.gov/play/explore-montgomery/armory-learning-arts-center  (Yelp: 1018 Madison Ave)
  { id: 'venue-armory', name: 'Armory Learning Arts Center', address: '1018 Madison Ave, Montgomery, AL 36104', source: 'montgomeryal.gov' },
  // https://www.ablissmgm.com/contact  (official site / Waze: 5523 Wares Ferry Rd)
  { id: 'venue-atelierbliss', name: 'Atelier Bliss', address: '5523-A Wares Ferry Rd, Montgomery, AL 36117', source: 'ablissmgm.com' },
  // https://www.yelp.com/biz/bar-attico-montgomery  (rooftop above Ravello, 36 Commerce St)
  { id: 'venue-barattico', name: 'Bar Attico', address: '36 Commerce St, Montgomery, AL 36104', source: 'yelp.com' },
  // https://www.funinmontgomery.com/Home/Components/FacilityDirectory/FacilityDirectory/299/3055  (city facility dir)
  { id: 'venue-chisholm', name: 'Chisholm Community Center', address: '545 E Vandiver Blvd, Montgomery, AL 36110', source: 'funinmontgomery.com' },
  // https://info.aldi.us/stores/l/al/montgomery/7340-eastchase-parkway/l974  (market held in this Aldi lot at EastChase)
  { id: 'venue-eastchasefarmers', name: 'Eastchase Farmers Market', address: '7340 Eastchase Pkwy, Montgomery, AL 36117', source: 'aldi.us' },
  // https://hobby-hole.com/  (Yelp / Wizards store locator: 910 Adams Ave)
  { id: 'venue-hobbyhole', name: 'Hobby Hole', address: '910 Adams Ave, Montgomery, AL 36104', source: 'hobby-hole.com' },
  // https://jerrysjukejoint.com/  (Experience Montgomery: 108 Bibb St)
  { id: 'venue-jerrys', name: "Jerry's Juke Joint", address: '108 Bibb St, Montgomery, AL 36104', source: 'jerrysjukejoint.com' },
  // https://www.yelp.com/biz/kru-on-mount-meigs-montgomery-2  (2118 Mt Meigs Rd)
  { id: 'venue-kru', name: 'Kru on Mt Meigs', address: '2118 Mt Meigs Rd, Montgomery, AL 36107', source: 'yelp.com' },
  // https://www.facebook.com/p/Krush-Bar-and-Lounge-61584043418697/  (79 Commerce St Suite E, downtown)
  { id: 'venue-krush', name: 'Krush Bar & Lounge', address: '79 Commerce St Suite E, Montgomery, AL 36104', source: 'facebook.com' },
  // https://www.yelp.com/biz/leroy-montgomery  (Leroy Lounge, Old Cloverdale: 2752 Boultier St)
  { id: 'venue-leroy', name: 'Leroy', address: '2752 Boultier St, Montgomery, AL 36106', source: 'yelp.com' },
  // https://thelowerlounge.com/  (Yelp: 101-A Tallapoosa St)
  { id: 'venue-lowerlounge', name: 'Lower Lounge', address: '101-A Tallapoosa St, Montgomery, AL 36104', source: 'thelowerlounge.com' },
  // https://www.yelp.com/biz/new-moon-bar-and-grill-montgomery  (1343 Dalraida Rd)
  { id: 'venue-newmoon', name: 'New Moon Bar and Grill', address: '1343 Dalraida Rd, Montgomery, AL 36109', source: 'yelp.com' },
  // https://mccplblog.wordpress.com/locations/pintlala-branch-library/  (255 Federal Road, Pintlala 36043)
  { id: 'venue-pintlala', name: 'Pintlala Branch Library', address: '255 Federal Rd, Pintlala, AL 36043', source: 'mccpl.lib.al.us' },
  // https://www.yelp.com/biz/players-sports-pub-montgomery  (537 N Eastern Blvd)
  { id: 'venue-players', name: "Player's Sports Bar", address: '537 N Eastern Blvd, Montgomery, AL 36117', source: 'yelp.com' },
  // https://www.redbluffmgm.com/directions  (Red Bluff Bar at the Silos: 355 Coosa St)
  { id: 'venue-redbluff', name: 'Red Bluff Bar', address: '355 Coosa St, Montgomery, AL 36104', source: 'redbluffmgm.com' },
  // https://www.mccpl.lib.al.us/Pages/Index/20302/rufus-a-lewis-regional-library  (3095 Mobile Hwy)
  { id: 'venue-rufuslewis', name: 'Rufus A. Lewis Regional Library', address: '3095 Mobile Hwy, Montgomery, AL 36108', source: 'mccpl.lib.al.us' },
]

// Matching helpers
const STOPWORDS = new Set(['the', 'and', 'of', 'on', 'at', 'for', 'a', 'an', 'suite', 'ste'])
const STREET_STOPWORDS = new Set([
  'rd', 'road', 'st', 'street', 'ave', 'avenue', 'blvd', 'boulevard', 'pkwy', 'parkway',
  'dr', 'drive', 'hwy', 'highway', 'ln', 'lane', 'ct', 'court', 'way', 'cir', 'circle',
  'n', 's', 'e', 'w', 'north', 'south', 'east', 'west',
])

function houseNumber(address: string): string | null {
  const m = address.trim().match(/^(\d+)/)
  return m ? m[1]! : null
}

// Street tokens = words between the house number and the first comma, minus the
// generic street-type words, so we compare on the distinctive road name.
function streetTokens(address: string): string[] {
  const firstSeg = address.split(',')[0]!.toLowerCase().replace(/^\d+[a-z-]*/i, '')
  return firstSeg
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2 && !STREET_STOPWORDS.has(t) && !STOPWORDS.has(t))
}

function nameTokens(name: string): string[] {
  return name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/).filter(t => t.length >= 3 && !STOPWORDS.has(t))
}

function inBbox(lat: number, lng: number): boolean {
  return lat >= BBOX.minLat && lat <= BBOX.maxLat && lng >= BBOX.minLng && lng <= BBOX.maxLng
}

type GeoOutcome =
  | { lat: number; lng: number; how: string }
  | { rejected: string }

function evaluate(results: NominatimResult[], entry: Entry): GeoOutcome {
  if (results.length === 0) return { rejected: 'no results' }

  const wanted = houseNumber(entry.address)
  const streets = streetTokens(entry.address)
  const names = nameTokens(entry.name)

  const scored = results
    .map(r => ({ r, lat: parseFloat(r.lat), lng: parseFloat(r.lon) }))
    .filter(c => inBbox(c.lat, c.lng))

  if (scored.length === 0) return { rejected: `${results.length} result(s), none inside county bbox` }

  // 1) Precise: house number + distinctive street token both present.
  for (const c of scored) {
    const dn = c.r.display_name.toLowerCase()
    const hn = c.r.address?.house_number?.split(';')[0]
    const streetHit = streets.some(t => dn.includes(t))
    if (wanted && hn === wanted && streetHit) {
      return { lat: c.lat, lng: c.lng, how: `house# ${wanted} + street match` }
    }
  }

  // 2) POI match: Nominatim returned the named venue itself.
  for (const c of scored) {
    const dn = c.r.display_name.toLowerCase()
    if (names.length && names.filter(t => dn.includes(t)).length >= Math.min(2, names.length)) {
      return { lat: c.lat, lng: c.lng, how: 'named POI match' }
    }
  }

  return { rejected: `${scored.length} in-bbox result(s) but no house#/street or POI match` }
}

// Nominatim struggles with unit designators and abbreviated street types, so we
// also try a normalized variant: drop "Suite/Ste/Unit X", strip a letter suffix
// on the house number (5523-A -> 5523), and expand common abbreviations.
const STREET_EXPANSIONS: [RegExp, string][] = [
  [/\bRd\b/gi, 'Road'], [/\bSt\b/gi, 'Street'], [/\bAve\b/gi, 'Avenue'],
  [/\bBlvd\b/gi, 'Boulevard'], [/\bPkwy\b/gi, 'Parkway'], [/\bHwy\b/gi, 'Highway'],
  [/\bDr\b/gi, 'Drive'], [/\bLn\b/gi, 'Lane'], [/\bCt\b/gi, 'Court'],
]

function cleanAddress(address: string): string {
  let out = address
    .replace(/\b(?:suite|ste|unit|apt|#)\s*\w+/gi, '')
    .replace(/^(\d+)[a-z-]+/i, '$1')
  for (const [re, full] of STREET_EXPANSIONS) out = out.replace(re, full)
  return out.replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',').trim()
}

async function geocode(entry: Entry): Promise<GeoOutcome> {
  const cleaned = cleanAddress(entry.address)
  const queries = [entry.address]
  if (cleaned !== entry.address) queries.push(cleaned)
  queries.push(`${entry.name}, Montgomery, Alabama`)
  let outcome: GeoOutcome = { rejected: 'not attempted' }
  for (const q of queries) {
    let raw: NominatimResult[]
    try {
      raw = await throttledSearch(q)
    } catch (e) {
      outcome = { rejected: `fetch error: ${(e as Error).message}` }
      continue
    }
    outcome = evaluate(raw, entry)
    if ('lat' in outcome) break
  }
  return outcome
}

type Row = { name: string; address: string; source: string; coords: string; reason: string }

async function main() {
  console.log(`Filling ${ENTRIES.length} venue address(es) via Nominatim (~${MIN_DELAY_MS}ms/request)...\n`)
  const rows: Row[] = []
  let patched = 0

  for (const entry of ENTRIES) {
    const current = await client.fetch<{ address?: string; lat?: number; lng?: number } | null>(
      `*[_type=="venue" && _id==$id][0]{address, lat, lng}`, { id: entry.id }
    )
    if (!current) {
      rows.push({ name: entry.name, address: entry.address, source: entry.source, coords: 'n', reason: 'doc not found' })
      continue
    }

    // Idempotent: skip only when address already set AND coordinates present.
    if (current.address && current.lat != null && current.lng != null) {
      rows.push({ name: entry.name, address: current.address, source: entry.source, coords: 'y', reason: 'already complete (skipped)' })
      continue
    }

    const outcome = await geocode(entry)
    const patch: Record<string, unknown> = { address: entry.address }
    let coords = 'n'
    let reason: string
    if ('lat' in outcome) {
      patch.lat = outcome.lat
      patch.lng = outcome.lng
      coords = 'y'
      reason = `accepted (${outcome.lat.toFixed(4)}, ${outcome.lng.toFixed(4)}) via ${outcome.how}`
    } else {
      reason = `address only (${outcome.rejected})`
    }

    await client.patch(entry.id).set(patch).commit()
    patched++
    rows.push({ name: entry.name, address: entry.address, source: entry.source, coords, reason })
  }

  console.log('── Results ─────────────────────────────────────────────────────────')
  for (const r of rows) {
    console.log(`${r.coords === 'y' ? 'PIN ' : '    '} ${r.name.padEnd(30)} | ${r.address}`)
    console.log(`     source: ${r.source.padEnd(22)} coords=${r.coords}  ${r.reason}`)
  }
  console.log('────────────────────────────────────────────────────────────────────')
  const withCoords = rows.filter(r => r.coords === 'y').length
  console.log(`${patched} patched, ${rows.length - patched} skipped. ${withCoords}/${rows.length} have coordinates.`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

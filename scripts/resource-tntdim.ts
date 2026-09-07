import { config } from 'dotenv'
import { makeIngestClient } from '../ingest/lib/writer'
config({ path: '.env.local', quiet: true })

// One-time cleanup, 2026-09: the recurring events imported by hand from the
// TNTDIM reddit series pointed at the curator's reddit profile as their source.
// Re-point each at its venue's own verified page (researched + checked live)
// so "event details at the source" leads somewhere real. Only touches upcoming
// or recurring reddit-sourced events; past one-offs keep their history.
const VENUE_SOURCE: Record<string, string> = {
  'Armory Learning Arts Center': 'https://www.montgomeryal.gov/play/explore-montgomery/armory-learning-arts-center',
  "Player's Sports Bar": 'https://www.instagram.com/psbmgm/',
  'Hobby Hole': 'https://hobby-hole.com/organized-events',
  'Hilltop Public House': 'https://www.facebook.com/hilltoppublichouse/',
  'Adventure Sports II': 'https://www.advsports2.com/',
  'Montgomery Museum of Fine Arts': 'https://mmfa.org/events/calendar/',
  'Eastchase Farmers Market': 'https://www.theshoppesateastchase.com/events/the-shoppes-at-eastchase-farmers-market',
  'Montgomery Whitewater': 'https://montgomerywhitewater.com/events/',
  "Governor's Square Branch Library": 'https://www.mccpl.lib.al.us/Pages/Index/20304/governors-square-branch-library',
  'Rufus A. Lewis Regional Library': 'https://www.mccpl.lib.al.us/Pages/Index/20302/rufus-a-lewis-regional-library',
  'Gayle Planetarium': 'https://www.montgomeryzoo.com/experiences/planetarium-at-oak-park',
  'Red Bluff Bar': 'https://www.redbluffmgm.com/events',
  'Common Bond Brewers': 'https://www.commonbondbrewers.com/calendar',
  "Jerry's Juke Joint": 'https://jerrysjukejoint.com/',
  'New Moon Bar and Grill': 'https://www.facebook.com/p/New-Moon-Bar-Grill-100047634824921/',
  'Leroy': 'https://leroylounge.com',
  'Riverfront Park / Riverwalk Amphitheater': 'https://www.funinmontgomery.com/Home/Components/News/News/5007/3093',
  'Chisholm Community Center': 'https://www.funinmontgomery.com/Home/Components/FacilityDirectory/FacilityDirectory/299/3085',
  'Montgomery Zoo': 'https://www.montgomeryzoo.com/Home/Components/Calendar/Event/8199/2981',
}

// Venue names in Sanity sometimes carry curly apostrophes; compare normalized.
const norm = (s: string) => s.replace(/[‘’]/g, "'").trim()
const LOOKUP = new Map(Object.entries(VENUE_SOURCE).map(([k, v]) => [norm(k), v]))

type Row = { _id: string; title: string; venueName?: string }

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const client = makeIngestClient()
  const rows = await client.fetch<Row[]>(
    `*[_type == "event" && sourceType == "reddit" &&
       (startDateTime >= now() || defined(recurrence.frequency))]{
      _id, title, "venueName": venue->name }`)

  let patched = 0
  const unmatched: string[] = []
  for (const r of rows) {
    const url = r.venueName ? LOOKUP.get(norm(r.venueName)) : undefined
    if (!url) { unmatched.push(`${r.title} (venue: ${r.venueName ?? 'none'})`); continue }
    console.log(`${dryRun ? '[DRY] ' : ''}${r.title} -> ${url}`)
    if (!dryRun) await client.patch(r._id).set({ sourceType: 'website', sourceUrl: url }).commit()
    patched += 1
  }
  console.log(`\n${patched} re-sourced, ${unmatched.length} unmatched.`)
  unmatched.forEach(u => console.log(`  UNMATCHED: ${u}`))
}
main().catch((e) => { console.error(e); process.exit(1) })

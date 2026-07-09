import { config } from 'dotenv'
config({ path: '.env.local', quiet: true })
import { createClient } from '@sanity/client'
import { INTEREST_IDS, type InterestId } from '../src/lib/events/interests'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-07-01', token: process.env.SANITY_WRITE_TOKEN!, useCdn: false,
})

export type TaggableEvent = {
  _id?: string
  title?: string
  description?: string
  category?: string
  priceText?: string
}

// Category → sensible default interest, used only when no keyword rule fires so
// that EVERY event ends up with at least one tag.
const CATEGORY_FALLBACK: Record<string, InterestId> = {
  music: 'live-music',
  arts: 'art-and-making',
  food: 'food-and-drink',
  family: 'kids',
  nightlife: 'dancing',
  sports: 'fitness-and-outdoors',
  education: 'books-and-talks',
  community: 'history-and-civic',
  festival: 'live-music',
  other: 'history-and-civic',
}

/**
 * Best-effort keyword mapping over an event's title + description (+ price).
 * Pure and deterministic: returns a deduped, vocabulary-ordered, non-empty
 * list of interest ids. The curator refines from here.
 */
export function mapInterests(e: TaggableEvent): InterestId[] {
  const text = `${e.title ?? ''} ${e.description ?? ''}`.toLowerCase()
  const has = (re: RegExp) => re.test(text)
  const hits = new Set<InterestId>()

  // games & trivia — bar-night staples
  if (has(/\btrivia\b|\bbingo\b|\bgame\b|\bgames\b|karaoke|tournament/)) hits.add('games-and-trivia')

  // live music (karaoke counts here too — it is, after all, singing)
  if (has(/live music|\bband\b|\bjazz\b|\bblues\b|\bvinyl\b|\brevue\b|karaoke|\bdj\b|patio music/)) hits.add('live-music')

  // art & making
  if (has(/\bart\b|\bcraft|paint|drawing|portrait|masquerade|masking|studio art|museum|\bmmfa\b|sketch/)) hits.add('art-and-making')

  // film
  if (has(/\bfilm\b|\bmovie|\breels?\b|screening|cinema|showing|\bshrek\b|king kong/)) hits.add('film')

  // food & drink
  if (has(/\bfood\b|tasting|liquor|\bwine\b|\bbeer\b|brew|crepe|\bsweet\b|luau|\bdinner\b|\bsip\b|pop.?up|\beat/)) hits.add('food-and-drink')

  // kids & family
  if (has(/\bkids?\b|story time|\blego\b|\bdino|\bfamily\b|\bteen\b|play station|\bchild|toddler/)) hits.add('kids')

  // fitness & outdoors
  if (has(/zumba|futsal|\brun\b|jogg|self.?defense|\bfitness\b|workout|\byoga\b|pub run|\bmove\b|motivate|pilates/)) hits.add('fitness-and-outdoors')

  // books & talks
  if (has(/\btalk\b|discuss|\bnovel\b|\bbook\b|\bauthor\b|lecture|newsouth|\bpoetry\b|\bworkshop\b/)) hits.add('books-and-talks')

  // history & civic
  if (has(/declaration|liberty|independence|\b250th?\b|capitol|rededication|re-dedication|\bcivic\b|rendezvous|\bcar cruis/)) hits.add('history-and-civic')

  // markets
  if (has(/\bmarket\b|farmers|\bvendor/)) hits.add('markets')

  // dancing
  if (has(/danc|\bheels\b|\blatin\b|\bsalsa\b|\bbaila\b|zumba/)) hits.add('dancing')

  // free stuff — explicit "free" general admission
  if (/^free/i.test((e.priceText ?? '').trim()) || has(/\bfree\b/)) hits.add('free-stuff')

  if (hits.size === 0) {
    const fb = CATEGORY_FALLBACK[e.category ?? 'other'] ?? 'history-and-civic'
    hits.add(fb)
  }

  // Return in fixed vocabulary order for stable, readable output.
  return INTEREST_IDS.filter(id => hits.has(id))
}

async function main() {
  const events: TaggableEvent[] = await client.fetch(
    `*[_type == "event"]{ _id, title, description, category, priceText, interests }`
  )

  let tagged = 0
  let skipped = 0
  const rows: Array<{ title: string; interests: string }> = []
  const tx = client.transaction()

  for (const e of events as Array<TaggableEvent & { interests?: string[] }>) {
    // Never clobber a human-edited field: skip events that already have interests.
    if (Array.isArray(e.interests) && e.interests.length > 0) {
      skipped++
      rows.push({ title: `~ ${e.title ?? e._id}`, interests: `${e.interests.join(', ')} (kept)` })
      continue
    }
    const interests = mapInterests(e)
    tx.patch(e._id!, p => p.set({ interests }))
    tagged++
    rows.push({ title: e.title ?? e._id!, interests: interests.join(', ') })
  }

  if (tagged > 0) await tx.commit()

  const w = Math.min(52, Math.max(...rows.map(r => r.title.length), 5))
  console.log(`\ntitle`.padEnd(w + 2) + 'interests')
  console.log('-'.repeat(w + 2) + '-'.repeat(40))
  for (const r of rows) console.log(r.title.slice(0, w).padEnd(w + 2) + r.interests)
  console.log(`\n${tagged} tagged, ${skipped} skipped (already had interests), ${events.length} total.`)
}

// Only run when invoked directly (so tests can import mapInterests cleanly).
const invokedDirectly = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/tag-interests.ts')
if (invokedDirectly) main().catch((e) => { console.error(e); process.exit(1) })

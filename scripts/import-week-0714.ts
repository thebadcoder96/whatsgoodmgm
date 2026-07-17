import { config } from 'dotenv'
config({ path: '.env.local', quiet: true })
import { createClient } from '@sanity/client'
import { mapInterests } from './tag-interests'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-07-01', token: process.env.SANITY_WRITE_TOKEN!, useCdn: false,
})

const ref = (id: string) => ({ _type: 'reference' as const, _ref: id })
const SOURCE_URL =
  'https://www.reddit.com/r/montgomery/comments/1uvwbcz/theres_nothing_to_do_in_montgomery_weekly_post_714/'

// Montgomery is on America/Chicago (CDT in July = UTC-5). Add 5h to get UTC.
const ct = (date: string, h: number, min = 0) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, h + 5, min)).toISOString()
}

// ── New venues only (existing venues are reused, never overwritten) ──────────
// Geocoded via Nominatim (strict: in Montgomery-metro bbox, name/address match).
//   ASF + Cloverdale Playhouse → confident amenity matches, pinned.
//   The other four → no confident Nominatim match, listed name-only.
type V = { _id: string; name: string; address?: string; neighborhood?: string; lat?: number; lng?: number }
const newVenues: V[] = [
  { _id: 'venue-asf', name: 'Alabama Shakespeare Festival', address: '1 Festival Dr, Montgomery, AL 36117', neighborhood: 'Blount Cultural Park', lat: 32.3498626, lng: -86.2129746 },
  { _id: 'venue-cloverdaleplayhouse', name: 'Cloverdale Playhouse', address: '960 Cloverdale Rd, Montgomery, AL 36106', neighborhood: 'Cloverdale', lat: 32.3524219, lng: -86.2925676 },
  { _id: 'venue-historicalsociety', name: 'Montgomery County Historical Society' },
  { _id: 'venue-adventuresports', name: 'Adventure Sports II' },
  { _id: 'venue-onedayonepower', name: 'One Day One Power' },
  { _id: 'venue-southernarts', name: 'Southern Arts & Makers Collective' },
]
const venueDocs = newVenues.map(v => ({ _type: 'venue', slug: { current: v._id.replace('venue-', '') }, ...v }))

// ── One-off events (r/Montgomery TNTDIM weekly list, week of 7/14–7/20/2026) ─
type E = {
  id: string; title: string; venue: string; category: string
  start: string; end?: string; price?: string; desc?: string
}
const events: E[] = [
  // Tue 7/14
  { id: 'rw2-mini-makers-stories-0714', title: 'Mini Makers: Stories in Art', venue: 'venue-mmfa', category: 'arts', start: ct('2026-07-14', 9, 30), desc: 'A story-and-art session for young makers at the Montgomery Museum of Fine Arts.' },
  { id: 'rw2-crafts-and-coloring', title: 'Crafts and Coloring', venue: 'venue-morganlibrary', category: 'arts', start: ct('2026-07-14', 14, 30), desc: 'Drop in for crafts and coloring at the Juliette Hampton Morgan Memorial Library.' },

  // Wed 7/15
  { id: 'rw2-lets-just-color', title: "Let's Just Color", venue: 'venue-hampstead', category: 'arts', start: ct('2026-07-15', 10), desc: 'A relaxed all-day coloring drop-in at the Hampstead Branch Library.' },
  { id: 'rw2-secret-life-of-pets', title: 'The Secret Life of Pets', venue: 'venue-capri', category: 'arts', start: ct('2026-07-15', 10), price: '$2', desc: 'Summer film series. Showings at 10am and 1pm, Wednesday and Thursday.' },

  // Thu 7/16
  { id: 'rw2-karaoke-lower-lounge', title: 'Karaoke at Lower Lounge', venue: 'venue-lowerlounge', category: 'nightlife', start: ct('2026-07-16', 19), desc: 'Karaoke night at Lower Lounge.' },
  { id: 'rw2-dinosaur-suncatcher', title: 'Dinosaur Suncatcher Craft', venue: 'venue-rufuslewis', category: 'arts', start: ct('2026-07-16', 10), desc: 'A dinosaur suncatcher craft for kids at the Rufus A. Lewis Regional Library.' },
  { id: 'rw2-diy-perfume-bedazzle', title: 'DIY Roll-on Perfume Oil & Bedazzle Workshop', venue: 'venue-hilltop', category: 'arts', start: ct('2026-07-16', 18), desc: 'Blend your own roll-on perfume oil and bedazzle the bottle at Hilltop Public House.' },
  { id: 'rw2-lunch-learn-lithography', title: 'Lunch and Learn: Stone Lithography', venue: 'venue-historicalsociety', category: 'education', start: ct('2026-07-16', 11, 30), desc: 'A midday talk on the art and history of stone lithography, hosted by the Montgomery County Historical Society.' },
  { id: 'rw2-open-water-diver', title: 'Open Water Diver Class', venue: 'venue-adventuresports', category: 'sports', start: ct('2026-07-16', 18), desc: 'Open water scuba certification class at Adventure Sports II.' },
  { id: 'rw2-little-shop-of-horrors', title: 'Little Shop of Horrors', venue: 'venue-capri', category: 'arts', start: ct('2026-07-16', 19), desc: 'A screening of Little Shop of Horrors at the Capri Theatre.' },
  { id: 'rw2-mornings-at-museum-create', title: 'Mornings at the Museum: Create', venue: 'venue-mmfa', category: 'arts', start: ct('2026-07-16', 9, 30), desc: 'A morning hands-on art program at the Montgomery Museum of Fine Arts.' },
  { id: 'rw2-emperors-new-clothes', title: "The Emperor's New Clothes", venue: 'venue-cloverdaleplayhouse', category: 'arts', start: ct('2026-07-16', 19), desc: "A stage production at the Cloverdale Playhouse. Runs Thursday through Saturday at 7pm and Sunday at 2pm." },
  { id: 'rw2-beautiful-carole-king', title: 'Beautiful: The Carole King Musical', venue: 'venue-asf', category: 'arts', start: ct('2026-07-16', 19), desc: 'The Carole King musical at the Alabama Shakespeare Festival. Thursday and Friday at 7pm; Saturday at 2pm and 7pm; Sunday at 2pm.' },

  // Fri 7/17
  { id: 'rw2-end-of-summer-movie', title: 'End of Summer Movie', venue: 'venue-hampstead', category: 'arts', start: ct('2026-07-17', 15), desc: 'An end-of-summer movie afternoon at the Hampstead Branch Library.' },
  { id: 'rw2-midnight-summer-jam', title: 'Midnight Summer Jam', venue: 'venue-chisholm', category: 'community', start: ct('2026-07-17', 17, 30), desc: 'A summer community jam at the Chisholm Community Center.' },
  { id: 'rw2-hot-air-balloon-festival', title: 'Montgomery Hot Air Balloon Festival', venue: 'venue-blount', category: 'festival', start: ct('2026-07-17', 17), desc: 'The Montgomery Hot Air Balloon Festival lights up Blount Cultural Park. Friday and Saturday.' },
  { id: 'rw2-biscuits-smokies-0717', title: 'Biscuits vs Knoxville Smokies', venue: 'venue-riverwalk', category: 'sports', start: ct('2026-07-17', 18, 35), desc: 'Montgomery Biscuits host the Knoxville Smokies at Riverwalk Stadium.' },
  { id: 'rw2-meet-me-v4', title: 'Meet Me: V4', venue: 'venue-mmfa', category: 'arts', start: ct('2026-07-17', 11, 30), desc: 'The Meet Me gallery program at the Montgomery Museum of Fine Arts.' },
  { id: 'rw2-lunar-parque', title: 'Lunar Parque', venue: 'venue-redbluff', category: 'music', start: ct('2026-07-17', 20), desc: 'Live music from Lunar Parque at Red Bluff Bar.' },

  // Sat 7/18
  { id: 'rw2-mini-makers-stories-0718', title: 'Mini Makers: Stories in Art', venue: 'venue-mmfa', category: 'arts', start: ct('2026-07-18', 9, 30), desc: 'A story-and-art session for young makers at the Montgomery Museum of Fine Arts.' },
  { id: 'rw2-capri-85th-anniversary', title: 'Clover/Capri: 85th Anniversary Celebration', venue: 'venue-capri', category: 'community', start: ct('2026-07-18', 13), desc: "The Capri Theatre turns 85 with a day of birthday festivities, films and celebration for one of Montgomery's beloved landmarks." },
  { id: 'rw2-philadelphia-story', title: 'The Philadelphia Story', venue: 'venue-capri', category: 'arts', start: ct('2026-07-18', 15), desc: 'A classic film screening at the Capri Theatre, part of its 85th-anniversary weekend.' },
  { id: 'rw2-the-kickback', title: 'The Kickback', venue: 'venue-redbluff', category: 'music', start: ct('2026-07-18', 13), desc: 'Live music from The Kickback at Red Bluff Bar.' },
  { id: 'rw2-tap-takeover-fat-bottom', title: 'Tap Takeover: Fat Bottom Brewing & Bravazzi', venue: 'venue-hilltop', category: 'food', start: ct('2026-07-18', 17), desc: 'Fat Bottom Brewing and Bravazzi take over the taps at Hilltop Public House.' },
  { id: 'rw2-biscuits-smokies-0718', title: 'Biscuits vs Knoxville Smokies (Agriculture Night)', venue: 'venue-riverwalk', category: 'sports', start: ct('2026-07-18', 18, 35), desc: 'Agriculture Night as the Montgomery Biscuits host the Knoxville Smokies at Riverwalk Stadium.' },
  { id: 'rw2-maafa-commemoration', title: '5th Annual Montgomery MAAFA Commemoration', venue: 'venue-redbluff', category: 'community', start: ct('2026-07-18', 10), desc: 'The 5th annual commemoration of the MAAFA at Red Bluff Bar.' },

  // Sun 7/19
  { id: 'rw2-royal-soul-reunion', title: 'Royal Soul Reunion', venue: 'venue-onedayonepower', category: 'music', start: ct('2026-07-19', 18), desc: 'A soul music reunion at One Day One Power.' },
  { id: 'rw2-life-drawing', title: 'Life Drawing', venue: 'venue-southernarts', category: 'arts', start: ct('2026-07-19', 15), desc: 'A life drawing session at the Southern Arts & Makers Collective.' },
  { id: 'rw2-biscuits-smokies-0719', title: 'Biscuits vs Knoxville Smokies (Rays Day)', venue: 'venue-riverwalk', category: 'sports', start: ct('2026-07-19', 15, 33), desc: 'Rays Day as the Montgomery Biscuits host the Knoxville Smokies at Riverwalk Stadium.' },
]

const eventDocs = events.map(e => ({
  _type: 'event', _id: e.id, status: 'approved', featured: false,
  title: e.title,
  slug: { current: `${e.id.replace('rw2-', '')}-${e.start.slice(0, 10)}` },
  startDateTime: e.start,
  ...(e.end ? { endDateTime: e.end } : {}),
  venue: ref(e.venue),
  category: e.category,
  ...(e.desc ? { description: e.desc } : {}),
  ...(e.price ? { priceText: e.price } : {}),
  interests: mapInterests({ title: e.title, description: e.desc, category: e.category, priceText: e.price }),
  sourceType: 'reddit',
  sourceUrl: SOURCE_URL,
}))

// ── Weekly pick (our editorial voice — do not echo the source's phrasing) ────
const weekOf = '2026-07-13'
const p = (key: string, text: string) => ({
  _type: 'block', _key: key, style: 'normal', markDefs: [],
  children: [{ _type: 'span', _key: `${key}s`, marks: [], text }],
})
const weeklyPick = {
  _id: `pick-${weekOf}`, _type: 'weeklyPick',
  weekOf,
  headline: "What's good this weekend, Gump?",
  publishedAt: new Date().toISOString(),
  author: ref('contrib-mishal'),
  body: [
    p('b1', 'Sound the trumpets, Gump. The Capri Theatre turns 85 on Saturday, and it is throwing itself a proper birthday: a full day of festivities downtown, capped by a screening of "The Philadelphia Story." Eighty-five years of one of Montgomery’s best-loved rooms is worth a slice of cake and a ticket stub.'),
    p('b2', 'The skies get busy too. The Montgomery Hot Air Balloon Festival floats into Blount Cultural Park on Friday and Saturday, all color and open field and easy summer wonder.'),
    p('b3', 'And it is a genuine theatre week. "Beautiful: The Carole King Musical" plays the Alabama Shakespeare Festival, while the Cloverdale Playhouse stages "The Emperor’s New Clothes." Add a Biscuits homestand and a stack of live music, and there is no excuse to stay in. Go do something, Gump.'),
  ],
  featuredEvents: [
    ref('rw2-hot-air-balloon-festival'),
    ref('rw2-capri-85th-anniversary'),
    ref('rw2-beautiful-carole-king'),
  ].map((r, i) => ({ ...r, _key: `fe${i}` })),
}

async function main() {
  const tx = client.transaction()
  for (const doc of [...venueDocs, ...eventDocs, weeklyPick]) tx.createOrReplace(doc as any)
  await tx.commit()

  const pinned = newVenues.filter(v => v.lat != null).length
  console.log(
    `Upserted ${venueDocs.length} new venues (${pinned} pinned, ${venueDocs.length - pinned} name-only), ` +
    `${eventDocs.length} one-off events, 1 weekly pick (${weekOf}).`
  )
}
main().catch((e) => { console.error(e); process.exit(1) })

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

// Exact TNTDIM thread permalink was unavailable at import time; the coordinator
// will swap this for the real comments URL later.
const SOURCE_URL = 'https://www.reddit.com/user/More-Ideal5423/'

// Montgomery is on America/Chicago (CDT in August = UTC-5). Add 5h to get UTC.
const ct = (date: string, h: number, min = 0) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, h + 5, min)).toISOString()
}

// ── New venues only (existing venues are reused, never overwritten) ──────────
// Created with createIfNotExists so a later Nominatim geocode pass (and its
// pins) survives any re-run of this import. Addresses supplied where confident;
// pins are left to the strict Nominatim geocoder (scripts/geocode-venues.ts).
type V = { _id: string; name: string; address?: string; neighborhood?: string; lat?: number; lng?: number }
const newVenues: V[] = [
  { _id: 'venue-gayleplanetarium', name: 'Gayle Planetarium', address: '1010 Forest Ave, Montgomery, AL 36106', neighborhood: 'Oak Park' },
  { _id: 'venue-sanctuary', name: 'The Sanctuary', address: '432 S Goldthwaite St, Montgomery, AL 36104', neighborhood: 'Cottage Hill' },
  { _id: 'venue-kingscanvas', name: 'Kings Canvas', address: '1000 W Jeff Davis Ave, Montgomery, AL 36104', neighborhood: 'West Montgomery' },
  { _id: 'venue-renaissance', name: 'Renaissance Montgomery Hotel', address: '201 Tallapoosa St, Montgomery, AL 36104', neighborhood: 'Downtown' },
  { _id: 'venue-gunterpool', name: 'Gunter Swimming Pool' },
  { _id: 'venue-deanfainpark', name: 'Dean Fain Park' },
  { _id: 'venue-mcintyre', name: 'McIntyre Community Center' },
  { _id: 'venue-peppertree', name: "PepperTree Steaks N' Wine", address: 'Vaughn Rd, Montgomery, AL 36116' },
  { _id: 'venue-avrc', name: 'Alabama Veterans Resource Center', address: 'Dexter Ave, Montgomery, AL 36104' },
  { _id: 'venue-2afitness', name: '2A Fitness' },
  { _id: 'venue-smokynotes', name: 'Smoky Notes' },
  { _id: 'venue-alcazarshriners', name: 'Alcazar Shriners' },
  { _id: 'venue-cloverdalebottompark', name: 'Cloverdale Bottom Park', neighborhood: 'Cloverdale' },
]
const venueDocs = newVenues.map(v => ({ _type: 'venue', slug: { current: v._id.replace('venue-', '') }, ...v }))

// ── Events (r/Montgomery TNTDIM weekly list, week of 8/4-8/10/2026) ──────────
type E = {
  id: string; title: string; venue: string; category: string
  start: string; end?: string; price?: string; desc?: string; recur?: string
}
const events: E[] = [
  // ── New recurring-with-window items (create as weekly recurring docs) ──────
  { id: 'rw3-diver-stress-rescue', title: 'Diver Stress & Rescue', venue: 'venue-adventuresports', category: 'sports', start: ct('2026-08-05', 18), recur: 'through Aug 19', desc: 'A scuba diver stress and rescue course at Adventure Sports II.' },
  { id: 'rw3-stars-powerhouses', title: 'Stars: The Powerhouses of the Universe', venue: 'venue-gayleplanetarium', category: 'education', start: ct('2026-08-06', 13, 15), recur: 'daily at 1:15pm through Aug 14', desc: 'A planetarium feature on the life and physics of stars at the Gayle Planetarium in Oak Park.' },
  { id: 'rw3-gayle-public-shows', title: 'Gayle Planetarium Public Shows', venue: 'venue-gayleplanetarium', category: 'education', start: ct('2026-08-08', 10), recur: 'Saturdays through Sept 26: Cardboard Rocket 10am & 1pm, Firefall 11:30am & 2:30pm', desc: 'Weekend public dome shows at the Gayle Planetarium in Oak Park. Cardboard Rocket at 10am and 1pm; Firefall at 11:30am and 2:30pm.' },

  // ── Montgomery Film Fest (the week\'s star) — three one-off docs at the Capri ─
  { id: 'rw3-film-fest-friday', title: 'Montgomery Film Fest: Friday', venue: 'venue-capri', category: 'arts', start: ct('2026-08-07', 17, 45), desc: 'Possum Town (5:45pm) and Danny is My Boyfriend (8pm). 17th annual.' },
  { id: 'rw3-film-fest-saturday', title: 'Montgomery Film Fest: Saturday', venue: 'venue-capri', category: 'arts', start: ct('2026-08-08', 13, 15), desc: 'Student Works Shorts (1:15pm), Alabama Ties Shorts (4pm), Hard Boiled (7pm).' },
  { id: 'rw3-film-fest-sunday', title: 'Montgomery Film Fest: Sunday', venue: 'venue-capri', category: 'arts', start: ct('2026-08-09', 13, 45), desc: 'Chronovisor with ghoststory (1:45pm), Coast to Coast Shorts (3:45pm), The Samurai and The Prisoner (6pm).' },

  // ── Tue 8/4 (past — imported for archive completeness) ─────────────────────
  { id: 'rw3-national-night-out', title: 'National Night Out', venue: 'venue-cloverdalebottompark', category: 'community', start: ct('2026-08-04', 16), desc: 'The community-and-public-safety block party at Cloverdale Bottom Park.' },
  { id: 'rw3-women-veterans-coffee', title: 'Women Veterans Coffee', venue: 'venue-avrc', category: 'community', start: ct('2026-08-04', 7), desc: 'A morning coffee meetup for women veterans at the Alabama Veterans Resource Center on Dexter Avenue.' },
  { id: 'rw3-pat-cunningham-devoto', title: "Pat Cunningham Devoto: stories from Bookin' in the Big House", venue: 'venue-newsouth', category: 'education', start: ct('2026-08-04', 17, 30), desc: "Author Pat Cunningham Devoto shares stories from Bookin' in the Big House at The NewSouth Bookstore." },
  { id: 'rw3-baila-latin-night-0804', title: 'Baila Montgomery Latin Night', venue: 'venue-redbluff', category: 'nightlife', start: ct('2026-08-04', 19, 30), desc: 'Latin night at Red Bluff Bar.' },
  { id: 'rw3-mini-makers-animals-0804', title: 'Mini Makers: Animals in Art', venue: 'venue-mmfa', category: 'arts', start: ct('2026-08-04', 9, 30), desc: 'A hands-on art session for young makers at the Montgomery Museum of Fine Arts. Ages 2 to 5; registration required.' },

  // ── Wed 8/5 ────────────────────────────────────────────────────────────────
  { id: 'rw3-lunch-learn-thompson', title: 'Lunch & Learn: Doris Alexander Thompson', venue: 'venue-historicalsociety', category: 'education', start: ct('2026-08-05', 11, 30), desc: 'A midday talk featuring Doris Alexander Thompson, hosted by the Montgomery County Historical Society.' },
  { id: 'rw3-el-campesino-0805', title: 'El Campesino', venue: 'venue-hilltop', category: 'music', start: ct('2026-08-05', 18), desc: 'Live music from El Campesino at Hilltop Public House.' },

  // ── Thu 8/6 (today) ────────────────────────────────────────────────────────
  { id: 'rw3-karaoke-lower-lounge-0806', title: 'Karaoke at Lower Lounge', venue: 'venue-lowerlounge', category: 'nightlife', start: ct('2026-08-06', 19), desc: 'Karaoke night at Lower Lounge.' },
  { id: 'rw3-coaches-corner', title: 'Coaches Corner', venue: 'venue-hilltop', category: 'community', start: ct('2026-08-06', 17, 30), desc: 'A sports talk gathering at Hilltop Public House.' },
  { id: 'rw3-lee-farrow-heart-of-a-dog', title: 'Lee Farrow discusses Heart of a Dog', venue: 'venue-newsouth', category: 'education', start: ct('2026-08-06', 17, 30), desc: 'Lee Farrow discusses Heart of a Dog at The NewSouth Bookstore.' },
  { id: 'rw3-grease-singalong', title: 'Grease Sing-A-Long', venue: 'venue-capri', category: 'arts', start: ct('2026-08-06', 19), desc: 'A sing-along screening of Grease at the Capri Theatre.' },
  { id: 'rw3-margie-joe-0806', title: 'Margie Joe', venue: 'venue-hilltop', category: 'music', start: ct('2026-08-06', 18), desc: 'Live music from Margie Joe at Hilltop Public House.' },
  { id: 'rw3-angels-cowboys-wine-tasting', title: 'Angels & Cowboys Wine Tasting', venue: 'venue-peppertree', category: 'food', start: ct('2026-08-06', 17, 30), desc: "A guided wine tasting at PepperTree Steaks N' Wine." },
  { id: 'rw3-stolen-faces-0806', title: 'The Stolen Faces', venue: 'venue-redbluff', category: 'music', start: ct('2026-08-06', 19, 30), desc: 'Live music from The Stolen Faces at Red Bluff Bar.' },
  { id: 'rw3-mornings-at-museum-0806', title: 'Mornings at the Museum', venue: 'venue-mmfa', category: 'arts', start: ct('2026-08-06', 9, 30), desc: 'A morning program for pre-schoolers at the Montgomery Museum of Fine Arts. Registration required.' },

  // ── Fri 8/7 ────────────────────────────────────────────────────────────────
  { id: 'rw3-cbb-bbq', title: 'CBB BBQ', venue: 'venue-hilltop', category: 'food', start: ct('2026-08-07', 18), desc: 'A barbecue gathering at Hilltop Public House.' },
  { id: 'rw3-jewell-pitts-pickleball', title: 'Jewell Pitts Memorial Pickleball Classic', venue: 'venue-deanfainpark', category: 'sports', start: ct('2026-08-07', 16), desc: 'The inaugural Jewell Pitts Memorial Pickleball Classic at Dean Fain Park. Continues Saturday, 8am to 5pm.' },
  { id: 'rw3-voter-restoration-workshop', title: 'Voter Restoration Workshop', venue: 'venue-mcintyre', category: 'community', start: ct('2026-08-07', 16), desc: 'A voter rights restoration workshop at the McIntyre Community Center. Also Saturday, 9am to 1pm.' },
  { id: 'rw3-school-supplies-giveaway', title: 'School Supplies Giveaway', venue: 'venue-2afitness', category: 'community', start: ct('2026-08-07', 12), desc: 'A back-to-school supply giveaway at 2A Fitness.' },
  { id: 'rw3-stolen-faces-0807', title: 'The Stolen Faces', venue: 'venue-redbluff', category: 'music', start: ct('2026-08-07', 20), desc: 'Live music from The Stolen Faces at Red Bluff Bar.' },
  { id: 'rw3-emergence-david-banks', title: 'Emergence: an Introspective by David Banks, Exhibition Reception', venue: 'venue-kingscanvas', category: 'arts', start: ct('2026-08-07', 18), desc: 'Opening reception for Emergence, an introspective exhibition by David Banks, at Kings Canvas.' },

  // ── Sat 8/8 ────────────────────────────────────────────────────────────────
  { id: 'rw3-el-campesino-0808', title: 'El Campesino', venue: 'venue-hilltop', category: 'music', start: ct('2026-08-08', 10), desc: 'Live music from El Campesino at Hilltop Public House.' },
  { id: 'rw3-velvet-vengeance', title: 'Velvet Vengeance & Ashes of Us', venue: 'venue-smokynotes', category: 'music', start: ct('2026-08-08', 20), desc: 'Velvet Vengeance and Ashes of Us live at Smoky Notes.' },
  { id: 'rw3-teen-pool-party', title: 'Teen Back to School Pool Party', venue: 'venue-gunterpool', category: 'family', start: ct('2026-08-08', 16), price: '$3', desc: 'A back-to-school pool party for teens at Gunter Swimming Pool.' },
  { id: 'rw3-sdec-meeting', title: 'SDEC Meeting', venue: 'venue-renaissance', category: 'community', start: ct('2026-08-08', 9), desc: 'A State Democratic Executive Committee meeting at the Renaissance Montgomery Hotel.' },
  { id: 'rw3-summer-slaughterhouse', title: 'Summer Slaughterhouse', venue: 'venue-sanctuary', category: 'community', start: ct('2026-08-08', 18), desc: 'Summer Slaughterhouse at The Sanctuary on South Goldthwaite Street.' },
  { id: 'rw3-timeless-treasures-crafts', title: 'Timeless Treasures Handmade Arts and Crafts Show', venue: 'venue-alcazarshriners', category: 'arts', start: ct('2026-08-08', 9), desc: 'A handmade arts and crafts show at the Alcazar Shriners.' },
  { id: 'rw3-autumn-nature-school', title: 'Autumn Nature School', venue: 'venue-montgomerywhitewater', category: 'family', start: ct('2026-08-08', 9), price: '$25', desc: 'An outdoor nature school session at Montgomery Whitewater. Ages 2 to 10.' },
  { id: 'rw3-back-to-school-drive-0808', title: 'Back to School Drive', venue: 'venue-kingscanvas', category: 'community', start: ct('2026-08-08', 14), desc: 'A back-to-school drive at Kings Canvas.' },
  { id: 'rw3-magical-creatures-zoo', title: 'Magical Creatures Education Program', venue: 'venue-zoo', category: 'family', start: ct('2026-08-08', 10), desc: 'A wildlife education program at the Montgomery Zoo featuring animals inspired by Harry Potter and The Hobbit.' },
  { id: 'rw3-back-to-school-fit-fest', title: 'Alabama State Back to School Fit Fest and Giveaway', venue: 'venue-riverfrontpark', category: 'community', start: ct('2026-08-08', 9), desc: 'A back-to-school fitness festival and giveaway at Riverfront Park.' },
  { id: 'rw3-just-dri', title: 'Just Dri', venue: 'venue-redbluff', category: 'music', start: ct('2026-08-08', 19, 30), desc: 'Live music from Just Dri at Red Bluff Bar.' },
  { id: 'rw3-mini-makers-animals-0808', title: 'Mini Makers: Animals in Art', venue: 'venue-mmfa', category: 'arts', start: ct('2026-08-08', 9, 30), desc: 'A hands-on art session for young makers at the Montgomery Museum of Fine Arts. Ages 2 to 5; registration required.' },

  // ── Sun 8/9 ────────────────────────────────────────────────────────────────
  { id: 'rw3-funky-forte', title: 'Funky Forte', venue: 'venue-hilltop', category: 'music', start: ct('2026-08-09', 10), desc: 'Live music from Funky Forte at Hilltop Public House.' },
]

const eventDocs = events.map(e => ({
  _type: 'event', _id: e.id, status: 'approved', featured: false,
  title: e.title,
  slug: { current: `${e.id.replace('rw3-', '')}-${e.start.slice(0, 10)}` },
  startDateTime: e.start,
  ...(e.end ? { endDateTime: e.end } : {}),
  venue: ref(e.venue),
  category: e.category,
  ...(e.desc ? { description: e.desc } : {}),
  ...(e.price ? { priceText: e.price } : {}),
  interests: mapInterests({ title: e.title, description: e.desc, category: e.category, priceText: e.price }),
  sourceType: 'reddit',
  sourceUrl: SOURCE_URL,
  ...(e.recur ? { recurrence: { frequency: 'weekly', note: e.recur } } : {}),
}))

// ── Weekly pick (our editorial voice — never echo the source; no em dashes) ──
const weekOf = '2026-08-03'
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
    p('b1', 'Roll out the red carpet, Gump. The 17th annual Montgomery Film Fest takes over the Capri Theatre all weekend, three full days of shorts, features and homegrown Alabama stories from Friday night through Sunday evening. Grab a ticket, settle into that beloved old room and let the reels run.'),
    p('b2', 'It is also a back-to-school kind of weekend. Supply drives and giveaways pop up across town, teens get a pool party at Gunter, and the Riverfront hosts a Back to School Fit Fest and Giveaway on Saturday morning. Bring the kids and load up before the first bell.'),
    p('b3', 'And look up while you are at it. The public dome shows are back at the Gayle Planetarium out in Oak Park, with Cardboard Rocket and Firefall lighting up Saturday. Add live music at Hilltop and Red Bluff all week and there is no excuse to stay in. Go do something, Gump.'),
  ],
  featuredEvents: [
    ref('rw3-film-fest-friday'),
    ref('rw3-back-to-school-fit-fest'),
    ref('rw3-gayle-public-shows'),
  ].map((r, i) => ({ ...r, _key: `fe${i}` })),
}

async function main() {
  const tx = client.transaction()
  // Venues: create once, never clobber (preserves later Nominatim geocoding).
  for (const doc of venueDocs) tx.createIfNotExists(doc as any)
  // Events + pick: carry all their own data, safe to replace on every run.
  for (const doc of [...eventDocs, weeklyPick]) tx.createOrReplace(doc as any)
  await tx.commit()

  const recurring = events.filter(e => e.recur).length
  console.log(
    `Upserted ${venueDocs.length} new venues (createIfNotExists), ` +
    `${eventDocs.length} events (${recurring} recurring, ${eventDocs.length - recurring} one-off), ` +
    `1 weekly pick (${weekOf}).`
  )
}
main().catch((e) => { console.error(e); process.exit(1) })

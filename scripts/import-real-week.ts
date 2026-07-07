import { config } from 'dotenv'
config({ path: '.env.local', quiet: true })
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-07-01', token: process.env.SANITY_WRITE_TOKEN!, useCdn: false,
})

const ref = (id: string) => ({ _type: 'reference' as const, _ref: id })

// Montgomery is on America/Chicago (CDT in July = UTC-5). Add 5h to get UTC.
const ct = (date: string, h: number, min = 0) => {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, h + 5, min)).toISOString()
}

// ── Venues ──────────────────────────────────────────────────────────────────
// lat/lng ONLY where the location is genuinely known (famous venue or a street
// address I'm confident of). Everything else lists with text but does not pin.
type V = { _id: string; name: string; address?: string; neighborhood?: string; lat?: number; lng?: number }
const venues: V[] = [
  // Confidently geocoded (famous or known downtown address)
  { _id: 'venue-mmfa', name: 'Montgomery Museum of Fine Arts', address: '1 Museum Dr, Montgomery, AL 36117', neighborhood: 'Blount Cultural Park', lat: 32.3743, lng: -86.1729 },
  { _id: 'venue-montgomerywhitewater', name: 'Montgomery Whitewater', address: '1100 Maxwell Blvd, Montgomery, AL 36104', neighborhood: 'Downtown / Riverfront', lat: 32.3905, lng: -86.3235 },
  { _id: 'venue-riverfrontpark', name: 'Riverfront Park / Riverwalk Amphitheater', address: 'Coosa St, Montgomery, AL 36104', neighborhood: 'Downtown Riverfront', lat: 32.3835, lng: -86.3115 },
  { _id: 'venue-capitol', name: 'Alabama State Capitol', address: '600 Dexter Ave, Montgomery, AL 36130', neighborhood: 'Downtown', lat: 32.3777, lng: -86.3000 },
  { _id: 'venue-zoo', name: 'Montgomery Zoo', address: '2301 Coliseum Pkwy, Montgomery, AL 36110', neighborhood: 'North Montgomery', lat: 32.4157, lng: -86.2570 },
  { _id: 'venue-morganlibrary', name: 'Juliette Hampton Morgan Memorial Library', address: '245 High St, Montgomery, AL 36104', neighborhood: 'Downtown', lat: 32.3800, lng: -86.3045 },
  { _id: 'venue-newsouth', name: 'The NewSouth Bookstore', address: '105 S Court St, Montgomery, AL 36104', neighborhood: 'Downtown', lat: 32.3767, lng: -86.3092 },
  { _id: 'venue-commonbond', name: 'Common Bond Brewers', address: '424 Bibb St, Montgomery, AL 36104', neighborhood: 'Downtown', lat: 32.3805, lng: -86.3065 },

  // Known street / neighborhood but NO confident coordinates — list, don't pin.
  { _id: 'venue-hilltop', name: 'Hilltop Public House', address: 'Goldthwaite St, Montgomery, AL 36104', neighborhood: 'The Hilltop / Cottage Hill' },
  { _id: 'venue-armory', name: 'Armory Learning Arts Center', address: 'Madison Ave, Montgomery, AL 36104', neighborhood: 'Cramton Bowl / Cottage Hill' },
  { _id: 'venue-leroy', name: 'Leroy', neighborhood: 'Cloverdale' },
  { _id: 'venue-kru', name: 'Kru on Mt Meigs', address: 'Mt Meigs Rd, Montgomery, AL', neighborhood: 'East Montgomery' },
  { _id: 'venue-eastchasefarmers', name: 'Eastchase Farmers Market', address: 'Aldi parking lot, The Shoppes at EastChase, Montgomery, AL 36117', neighborhood: 'EastChase' },
  { _id: 'venue-littledonkey', name: 'Little Donkey', address: 'The Shoppes at EastChase, Montgomery, AL 36117', neighborhood: 'EastChase' },
  { _id: 'venue-chisholm', name: 'Chisholm Community Center', neighborhood: 'Chisholm' },
  { _id: 'venue-hampstead', name: 'Hampstead Branch Library', neighborhood: 'Hampstead / East Montgomery' },
  { _id: 'venue-pintlala', name: 'Pintlala Branch Library', neighborhood: 'Pintlala' },
  { _id: 'venue-governorssquare', name: "Governor's Square Branch Library", neighborhood: 'South Montgomery' },
  { _id: 'venue-rufuslewis', name: 'Rufus A. Lewis Regional Library', neighborhood: 'West Montgomery' },
  { _id: 'venue-barattico', name: 'Bar Attico', neighborhood: 'Downtown (rooftop)' },

  // Name only — no address or coordinates I can stand behind.
  { _id: 'venue-redbluff', name: 'Red Bluff Bar' },
  { _id: 'venue-players', name: "Player's Sports Bar" },
  { _id: 'venue-jerrys', name: "Jerry's Juke Joint" },
  { _id: 'venue-hobbyhole', name: 'Hobby Hole' },
  { _id: 'venue-newmoon', name: 'New Moon Bar and Grill' },
  { _id: 'venue-lowerlounge', name: 'Lower Lounge' },
  { _id: 'venue-atelierbliss', name: 'Atelier Bliss' },
  { _id: 'venue-krush', name: 'Krush Bar & Lounge' },
  { _id: 'venue-811', name: '811 Bar and Grill' },
]
const venueDocs = venues.map(v => ({ _type: 'venue', slug: { current: v._id.replace('venue-', '') }, ...v }))

// ── Events (r/Montgomery weekly list, week of Tue 7/7/2026) ──────────────────
type E = {
  id: string; title: string; venue: string; category: string
  start: string; end?: string; price?: string; desc?: string; recur?: string
}
const w = (note: string) => note // marks a weekly-recurring entry
const events: E[] = [
  // Tue 7/7
  { id: 'rw-family-game-night', title: 'Family Game Night', venue: 'venue-montgomerywhitewater', category: 'family', start: ct('2026-07-07', 18), recur: w('every week, through Aug 11'), desc: 'Family game night at Eddy’s at Montgomery Whitewater.' },
  { id: 'rw-trivia-hilltop', title: 'Trivia at Hilltop Public House', venue: 'venue-hilltop', category: 'nightlife', start: ct('2026-07-07', 19), recur: w('every week') },
  { id: 'rw-drop-in-art-workshop', title: 'Drop-In Art Workshop', venue: 'venue-mmfa', category: 'arts', start: ct('2026-07-07', 10), end: ct('2026-07-07', 13), recur: w('daily, 10am–1pm, through the summer — first come first serve'), desc: 'Drop in for a hands-on art project. Kids get priority. First come, first serve.' },
  { id: 'rw-bingo-players', title: 'Bingo', venue: 'venue-players', category: 'nightlife', start: ct('2026-07-07', 19), recur: w('every week') },
  { id: 'rw-zumba-armory', title: 'Midday Zumba Express', venue: 'venue-armory', category: 'sports', start: ct('2026-07-07', 11, 30), recur: w('every week') },
  { id: 'rw-teen-art-studio', title: 'Teen Art Studio', venue: 'venue-armory', category: 'arts', start: ct('2026-07-07', 15, 45), recur: w('every week') },
  { id: 'rw-thrifty-tuesdays', title: 'Thrifty Tuesdays', venue: 'venue-zoo', category: 'family', start: ct('2026-07-07', 12), recur: w('every week, through July'), desc: 'Discounted admission to the Montgomery Zoo on Tuesdays.' },
  { id: 'rw-financial-prosperity-1', title: 'Financial Prosperity, Part 1', venue: 'venue-morganlibrary', category: 'education', start: ct('2026-07-07', 17, 30), price: 'Free', desc: 'Free financial-literacy workshop. Registration required.' },
  { id: 'rw-riverfront-rendezvous', title: '2026 Riverfront Rendezvous', venue: 'venue-riverfrontpark', category: 'education', start: ct('2026-07-07', 9), end: ct('2026-07-08', 16), price: 'Free', desc: 'A two-day educational event on the river with free boat rides. Runs Tuesday and Wednesday, 9am–4pm.' },
  { id: 'rw-seth-panitch-antique', title: 'Seth Panitch discusses his novel “Antique”', venue: 'venue-newsouth', category: 'arts', start: ct('2026-07-07', 17, 30) },

  // Wed 7/8
  { id: 'rw-leroy-pub-run', title: 'Leroy Pub Run', venue: 'venue-leroy', category: 'sports', start: ct('2026-07-08', 18), recur: w('every week') },
  { id: 'rw-karaoke-jerrys', title: 'Karaoke at Jerry’s Juke Joint', venue: 'venue-jerrys', category: 'nightlife', start: ct('2026-07-08', 19), recur: w('every week') },
  { id: 'rw-kids-lego-club', title: 'Kids Lego Club', venue: 'venue-rufuslewis', category: 'family', start: ct('2026-07-08', 16), recur: w('every week') },
  { id: 'rw-shrek-2', title: 'Shrek 2', venue: 'venue-capri', category: 'arts', start: ct('2026-07-08', 10), desc: 'Two showings: 10am and 1pm.' },
  { id: 'rw-declaration-reading', title: 'Declaration of Independence Reading & Liberty Bell Re-dedication', venue: 'venue-capitol', category: 'community', start: ct('2026-07-08', 17), desc: 'Part of America’s 250th commemoration, on the south lawn of the State Capitol.' },
  { id: 'rw-margie-joe', title: 'Margie Joe (live music)', venue: 'venue-hilltop', category: 'music', start: ct('2026-07-08', 18) },
  { id: 'rw-baila-latin-night', title: 'Baila Montgomery Latin Night', venue: 'venue-redbluff', category: 'nightlife', start: ct('2026-07-08', 19, 30) },
  { id: 'rw-groovin-dinos-story-time', title: 'Groovin’ With Dinos Story Time', venue: 'venue-hampstead', category: 'family', start: ct('2026-07-08', 10) },

  // Thu 7/9
  { id: 'rw-pickup-futsal', title: 'Pick-up Futsal', venue: 'venue-chisholm', category: 'sports', start: ct('2026-07-09', 18), recur: w('every week') },
  { id: 'rw-board-game-league', title: 'Board Game League', venue: 'venue-hobbyhole', category: 'community', start: ct('2026-07-09', 18), recur: w('every week') },
  { id: 'rw-karaoke-players', title: 'Karaoke at Player’s Sports Bar', venue: 'venue-players', category: 'nightlife', start: ct('2026-07-09', 19, 30), recur: w('every week') },
  { id: 'rw-karaoke-newmoon', title: 'Karaoke at New Moon Bar and Grill', venue: 'venue-newmoon', category: 'nightlife', start: ct('2026-07-09', 19), recur: w('every week') },
  { id: 'rw-thursday-game-tournament', title: 'Thursday Night Game Tournament', venue: 'venue-hilltop', category: 'nightlife', start: ct('2026-07-09', 21), recur: w('every week') },
  { id: 'rw-trivia-leroy', title: 'Trivia at Leroy', venue: 'venue-leroy', category: 'nightlife', start: ct('2026-07-09', 19), recur: w('every week') },
  { id: 'rw-trivia-whitewater', title: 'Trivia at Montgomery Whitewater', venue: 'venue-montgomerywhitewater', category: 'nightlife', start: ct('2026-07-09', 19), recur: w('every week') },
  { id: 'rw-line-dancing-tonya', title: 'Line Dancing with Tonya', venue: 'venue-jerrys', category: 'nightlife', start: ct('2026-07-09', 20), recur: w('every week') },
  { id: 'rw-king-kong', title: 'King Kong', venue: 'venue-capri', category: 'arts', start: ct('2026-07-09', 19) },
  { id: 'rw-rooftop-reels-waiting-to-exhale', title: 'Rooftop Reels: Waiting to Exhale', venue: 'venue-barattico', category: 'arts', start: ct('2026-07-09', 19), desc: 'Open-air film on the rooftop.' },
  { id: 'rw-karren-pell-revue', title: 'Karren Pell & the Old Alabama Revue', venue: 'venue-newsouth', category: 'music', start: ct('2026-07-09', 17, 30) },
  { id: 'rw-free-liquor-tasting', title: 'Free Liquor Tasting', venue: 'venue-hilltop', category: 'food', start: ct('2026-07-09', 18), price: 'Free' },
  { id: 'rw-1k-vibe-takeover', title: '1K Vibe Takeover', venue: 'venue-krush', category: 'nightlife', start: ct('2026-07-09', 19) },

  // Fri 7/10
  { id: 'rw-friday-play-station', title: 'Friday Play Station', venue: 'venue-governorssquare', category: 'family', start: ct('2026-07-10', 14), recur: w('every week') },
  { id: 'rw-self-defense-class', title: 'Self Defense Class', venue: 'venue-armory', category: 'sports', start: ct('2026-07-10', 17), price: '$10', recur: w('every week') },
  { id: 'rw-rnb-heels-class', title: '90’s & 2000s R&B Heels Class', venue: 'venue-atelierbliss', category: 'sports', start: ct('2026-07-10', 18), desc: 'A heels dance class set to ’90s and 2000s R&B.' },
  { id: 'rw-time-and-water', title: 'Time and Water', venue: 'venue-capri', category: 'arts', start: ct('2026-07-10', 16), desc: 'Film showing daily through Monday, 4pm & 7pm.' },
  { id: 'rw-meet-me-masquerade', title: 'Meet Me: From Masquerade to Masking', venue: 'venue-mmfa', category: 'arts', start: ct('2026-07-10', 11, 30) },
  { id: 'rw-ash-and-honey', title: 'Ash & Honey (live music)', venue: 'venue-redbluff', category: 'music', start: ct('2026-07-10', 20) },

  // Sat 7/11
  { id: 'rw-eastchase-farmers-market', title: 'EastChase Farmers Market', venue: 'venue-eastchasefarmers', category: 'food', start: ct('2026-07-11', 7), recur: w('every week, through Sept 12') },
  { id: 'rw-patio-music-whitewater', title: 'Patio Music', venue: 'venue-montgomerywhitewater', category: 'music', start: ct('2026-07-11', 13), recur: w('every week') },
  { id: 'rw-somewhat-crafters', title: 'Somewhat Crafters Collective', venue: 'venue-hilltop', category: 'arts', start: ct('2026-07-11', 15), recur: w('every week') },
  { id: 'rw-move-meet-motivate', title: 'Move, Meet and Motivate', venue: 'venue-riverfrontpark', category: 'sports', start: ct('2026-07-11', 7, 30), recur: w('every week in July') },
  { id: 'rw-car-cruisin', title: 'Car Cruisin’', venue: 'venue-811', category: 'community', start: ct('2026-07-11', 11) },
  { id: 'rw-sweet-hook-up', title: 'Sweet Hook Up', venue: 'venue-hilltop', category: 'food', start: ct('2026-07-11', 14) },
  { id: 'rw-blues-city-all-stars', title: 'Blues City All Stars', venue: 'venue-redbluff', category: 'music', start: ct('2026-07-11', 19, 30) },
  { id: 'rw-head-drawing-portrait', title: 'Head Drawing & Portrait Strategies with Nathaniel Allen', venue: 'venue-mmfa', category: 'arts', start: ct('2026-07-11', 10) },
  { id: 'rw-andy-whatley', title: 'Andy Whatley & Co.', venue: 'venue-capri', category: 'music', start: ct('2026-07-11', 19), desc: 'Live music at the Capri during its 85th-anniversary month.' },
  { id: 'rw-luau-party', title: 'Luau Party', venue: 'venue-kru', category: 'nightlife', start: ct('2026-07-11', 19) },

  // Sun 7/12
  { id: 'rw-jazz-on-the-river', title: 'Jazz on the River', venue: 'venue-redbluff', category: 'music', start: ct('2026-07-12', 18), recur: w('every week') },
  { id: 'rw-crepe-magic', title: 'Crepe Magic', venue: 'venue-hilltop', category: 'food', start: ct('2026-07-12', 10) },
  { id: 'rw-charitable-paint-sip', title: 'Charitable Paint and Sip', venue: 'venue-littledonkey', category: 'arts', start: ct('2026-07-12', 17) },

  // Mon 7/13
  { id: 'rw-joggers-n-lagers', title: 'Joggers ’n Lagers', venue: 'venue-commonbond', category: 'sports', start: ct('2026-07-13', 18), recur: w('every week') },
  { id: 'rw-byo-vinyl', title: 'Bring Your Own Vinyl w/ Village Green Records', venue: 'venue-hilltop', category: 'music', start: ct('2026-07-13', 19), recur: w('every week') },
  { id: 'rw-adult-studio-art', title: 'Adult Studio Art', venue: 'venue-armory', category: 'arts', start: ct('2026-07-13', 13, 15), recur: w('every week') },
  { id: 'rw-story-time-hampstead', title: 'Story Time', venue: 'venue-hampstead', category: 'family', start: ct('2026-07-13', 10) },
  { id: 'rw-freedom-season-talk', title: '“Freedom Season” talk with Peniel E. Joseph', venue: 'venue-newsouth', category: 'education', start: ct('2026-07-13', 17, 30) },
]

const eventDocs = events.map(e => ({
  _type: 'event', _id: e.id, status: 'approved', featured: false,
  title: e.title,
  slug: { current: `${e.id.replace('rw-', '')}-${e.start.slice(0, 10)}` },
  startDateTime: e.start,
  ...(e.end ? { endDateTime: e.end } : {}),
  venue: ref(e.venue),
  category: e.category,
  ...(e.desc ? { description: e.desc } : {}),
  ...(e.price ? { priceText: e.price } : {}),
  sourceType: 'reddit',
  sourceUrl: 'https://www.reddit.com/r/Montgomery/',
  ...(e.recur ? { recurrence: { frequency: 'weekly', note: e.recur } } : {}),
}))

// ── Weekly pick (our editorial voice) ────────────────────────────────────────
const today = '2026-07-07'
const p = (key: string, text: string) => ({
  _type: 'block', _key: key, style: 'normal', markDefs: [],
  children: [{ _type: 'span', _key: `${key}s`, marks: [], text }],
})
const weeklyPick = {
  _id: `pick-${today}`, _type: 'weeklyPick',
  weekOf: today,
  headline: "What's good this weekend, Gump?",
  publishedAt: new Date().toISOString(),
  author: ref('contrib-mishal'),
  body: [
    p('b1', 'Big week on the river. The Riverfront Rendezvous takes over Riverfront Park Tuesday and Wednesday with free boat rides and hands-on learning — an easy, free way to spend a summer morning downtown.'),
    p('b2', 'The Capri turns 85 this month and celebrates with Andy Whatley & Co. live on Saturday night, on top of a full slate of films. And on Wednesday, the State Capitol’s south lawn hosts a reading of the Declaration of Independence and a Liberty Bell re-dedication for America’s 250th.'),
    p('b3', 'Add nightly trivia, karaoke, farmers-market Saturdays and a stack of live music, and there’s no excuse to stay in. Go do something, Gump.'),
  ],
  featuredEvents: [ref('rw-riverfront-rendezvous'), ref('rw-andy-whatley'), ref('rw-declaration-reading')].map((r, i) => ({ ...r, _key: `fe${i}` })),
}

async function main() {
  // 1+2. Upsert venues, events, weekly pick
  const tx = client.transaction()
  for (const doc of [...venueDocs, ...eventDocs, weeklyPick]) tx.createOrReplace(doc as any)
  await tx.commit()

  // 3. Remove the fictional seed events (keep venues). Tolerate already-deleted.
  let removed = 0
  for (let i = 1; i <= 8; i++) {
    try { await client.delete(`seed-ev-${i}`); removed++ } catch { /* 404 tolerated */ }
  }

  const withCoords = venues.filter(v => v.lat != null && v.lng != null).length
  const recurring = events.filter(e => e.recur).length
  console.log(
    `Imported ${venueDocs.length} venues (${withCoords} pinned, ${venueDocs.length - withCoords} unpinned), ` +
    `${eventDocs.length} events (${recurring} recurring, ${eventDocs.length - recurring} one-off), 1 weekly pick. ` +
    `Removed ${removed}/8 seed events.`
  )
}
main().catch((e) => { console.error(e); process.exit(1) })

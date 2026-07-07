import { config } from 'dotenv'
config({ path: '.env.local', quiet: true })
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-07-01', token: process.env.SANITY_WRITE_TOKEN!, useCdn: false,
})

const days = (n: number, hour = 19) => {
  const d = new Date(); d.setDate(d.getDate() + n); d.setUTCHours(hour + 5, 0, 0, 0) // ~CT evening
  return d.toISOString()
}

const venues = [
  { _id: 'venue-riverwalk', name: 'Riverwalk Stadium', address: '200 Coosa St, Montgomery, AL 36104', neighborhood: 'Downtown', lat: 32.3792, lng: -86.3122 },
  { _id: 'venue-capri', name: 'Capri Theatre', address: '1045 E Fairview Ave, Montgomery, AL 36106', neighborhood: 'Cloverdale', lat: 32.3541, lng: -86.2867 },
  { _id: 'venue-mpac', name: 'Montgomery Performing Arts Centre', address: '201 Tallapoosa St, Montgomery, AL 36104', neighborhood: 'Downtown', lat: 32.3787, lng: -86.3105 },
  { _id: 'venue-oldalabamatown', name: 'Old Alabama Town', address: '301 Columbus St, Montgomery, AL 36104', neighborhood: 'Downtown', lat: 32.3817, lng: -86.3057 },
  { _id: 'venue-thealley', name: 'The Alley', address: '166 Commerce St, Montgomery, AL 36104', neighborhood: 'Downtown', lat: 32.3778, lng: -86.3112 },
  { _id: 'venue-blount', name: 'Blount Cultural Park', address: '1 Festival Dr, Montgomery, AL 36117', neighborhood: 'East Montgomery', lat: 32.3736, lng: -86.1746 },
].map(v => ({ _type: 'venue', slug: { current: v._id.replace('venue-', '') }, ...v }))

const ref = (id: string) => ({ _type: 'reference' as const, _ref: id })

const events = [
  { _id: 'seed-ev-1', title: 'Biscuits Baseball vs. Pensacola', category: 'sports', startDateTime: days(2), venue: ref('venue-riverwalk'), priceText: '$12-18', description: 'Minor league baseball on the river. Fireworks after the game.', sourceType: 'manual' },
  { _id: 'seed-ev-2', title: 'Classic Film Night', category: 'arts', startDateTime: days(3), venue: ref('venue-capri'), priceText: '$10', description: "A classic on the big screen at the Capri, Montgomery's historic single-screen theatre.", sourceType: 'manual' },
  { _id: 'seed-ev-3', title: 'Symphony Under the Stars', category: 'music', startDateTime: days(5), venue: ref('venue-blount'), priceText: 'Free', description: 'Bring a blanket. The MSO plays as the sun goes down over the park.', sourceType: 'manual' },
  { _id: 'seed-ev-4', title: 'Downtown Food Truck Rally', category: 'food', startDateTime: days(4, 11), venue: ref('venue-thealley'), priceText: 'Free entry', description: 'A dozen local trucks in The Alley. Lunch and live music.', sourceType: 'manual' },
  { _id: 'seed-ev-5', title: 'Family Day: Living History', category: 'family', startDateTime: days(6, 10), venue: ref('venue-oldalabamatown'), priceText: '$8, kids free', description: 'Costumed interpreters, crafts, and 19th-century Montgomery brought to life.', sourceType: 'manual' },
  { _id: 'seed-ev-6', title: 'Broadway Series: Touring Show', category: 'arts', startDateTime: days(9), venue: ref('venue-mpac'), priceText: '$35-85', description: 'National touring production at MPAC.', sourceType: 'manual' },
  { _id: 'seed-ev-7', title: 'Trivia Night at The Alley', category: 'nightlife', startDateTime: days(1), venue: ref('venue-thealley'), priceText: 'Free', description: 'Weekly team trivia. Winners drink cheap.', sourceType: 'manual', recurrence: { frequency: 'weekly', note: 'Every week, same time' } },
  { _id: 'seed-ev-8', title: 'Community Cleanup: Riverfront', category: 'community', startDateTime: days(5, 8), venue: ref('venue-riverwalk'), priceText: 'Free', description: 'Gloves and bags provided. Coffee for early birds.', sourceType: 'manual' },
].map(e => ({
  _type: 'event', status: 'approved', featured: false,
  slug: { current: `${e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${e.startDateTime.slice(0, 10)}` },
  ...e,
}))

const contributor = { _id: 'contrib-mishal', _type: 'contributor', name: 'Mishal Salim', role: 'founder', bio: 'Builds software in Montgomery with MM Intelligence.' }

const weeklyPick = {
  _id: `pick-${new Date().toISOString().slice(0, 10)}`, _type: 'weeklyPick',
  weekOf: new Date().toISOString().slice(0, 10),
  headline: "What's good this weekend, Gump?",
  publishedAt: new Date().toISOString(),
  author: ref('contrib-mishal'),
  body: [{ _type: 'block', _key: 'b1', style: 'normal', markDefs: [], children: [{ _type: 'span', _key: 's1', marks: [], text: 'Free symphony in the park, baseball with fireworks, and a food truck rally downtown. Not a bad week to live here.' }] }],
  featuredEvents: [ref('seed-ev-3'), ref('seed-ev-1'), ref('seed-ev-4')].map((r, i) => ({ ...r, _key: `fe${i}` })),
}

async function main() {
  const tx = client.transaction()
  for (const doc of [...venues, contributor, ...events, weeklyPick]) tx.createOrReplace(doc as any)
  await tx.commit()
  console.log(`Seeded ${venues.length} venues, ${events.length} events, 1 contributor, 1 weekly pick.`)
}
main().catch((e) => { console.error(e); process.exit(1) })

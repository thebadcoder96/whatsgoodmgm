import { config } from 'dotenv'
import { makeIngestClient } from '../ingest/lib/writer'
config({ path: '.env.local', quiet: true })

const SOURCES = [
  { _id: 'src-experience-montgomery', name: 'Experience Montgomery (CVB)', platform: 'simpleview',
    identifier: 'https://experiencemontgomeryal.org', homepage: 'https://www.experiencemontgomeryal.org', trusted: true },
  { _id: 'src-mccpl', name: 'Montgomery City-County Public Library', platform: 'tribe',
    identifier: 'https://mccpl.lib.al.us', homepage: 'https://www.mccpl.lib.al.us', trusted: true },
  { _id: 'src-mmfa', name: 'Montgomery Museum of Fine Arts', platform: 'tribe',
    identifier: 'https://mmfa.org', homepage: 'https://mmfa.org', trusted: true },
  { _id: 'src-biscuits', name: 'Montgomery Biscuits (home games)', platform: 'statsapi',
    identifier: '421', homepage: 'https://www.milb.com/montgomery', trusted: true },
  { _id: 'src-wetumpka', name: 'City of Wetumpka calendar', platform: 'civicplus',
    identifier: 'https://wetumpkaal.gov/RSSFeed.aspx?ModID=58&CID=All-calendar.xml', homepage: 'https://www.wetumpkaal.gov', trusted: true },
  { _id: 'src-millbrook', name: 'City of Millbrook calendar', platform: 'tribe',
    identifier: 'https://cityofmillbrook.org', homepage: 'https://cityofmillbrook.org', trusted: true },
]

async function main() {
  const client = makeIngestClient()
  for (const s of SOURCES) {
    await client.createIfNotExists({ _type: 'source', active: true, ...s })
    // createIfNotExists skips existing docs, so sync display fields explicitly
    await client.patch(s._id).set({ name: s.name, homepage: s.homepage }).commit()
    console.log(`ok: ${s.name}`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })

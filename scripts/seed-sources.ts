import { config } from 'dotenv'
import { makeIngestClient } from '../ingest/lib/writer'
config({ path: '.env.local', quiet: true })

const SOURCES = [
  { _id: 'src-experience-montgomery', name: 'Experience Montgomery (CVB)', platform: 'simpleview',
    identifier: 'https://experiencemontgomeryal.org', trusted: true },
  { _id: 'src-mccpl', name: 'Montgomery City-County Public Library', platform: 'tribe',
    identifier: 'https://mccpl.lib.al.us', trusted: true },
  { _id: 'src-mmfa', name: 'Montgomery Museum of Fine Arts', platform: 'tribe',
    identifier: 'https://mmfa.org', trusted: true },
  { _id: 'src-biscuits', name: 'Montgomery Biscuits (home games)', platform: 'statsapi',
    identifier: '421', trusted: true },
  { _id: 'src-wetumpka', name: 'City of Wetumpka calendar', platform: 'civicplus',
    identifier: 'https://wetumpkaal.gov/RSSFeed.aspx?ModID=58&CID=All-calendar.xml', trusted: true },
]

async function main() {
  const client = makeIngestClient()
  for (const s of SOURCES) {
    await client.createIfNotExists({ _type: 'source', active: true, ...s })
    console.log(`ok: ${s.name}`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })

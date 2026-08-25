import { config } from 'dotenv'
import { eventbriteFetcher } from './fetchers/eventbrite'
import { simpleviewFetcher } from './fetchers/simpleview'
import { tribeFetcher } from './fetchers/tribe'
import { statsapiFetcher } from './fetchers/statsapi'
import { civicplusFetcher } from './fetchers/civicplus'
import type { Fetcher, SourceDoc } from './fetchers/types'
import { makeIngestClient, writeEvents } from './lib/writer'

// Local dev reads .env.local (gitignored); scheduled-agent/CI environments inject env vars directly.
config({ path: '.env.local', quiet: true })

const FETCHERS: Record<string, Fetcher> = {
  eventbrite: eventbriteFetcher, simpleview: simpleviewFetcher,
  tribe: tribeFetcher, statsapi: statsapiFetcher, civicplus: civicplusFetcher,
}
const WINDOW_DAYS = 60

type SourceResult = { name: string; platform: string; fetched: number; created: number; merged: number; skipped: number; error?: string }

async function main() {
  const all = process.argv.includes('--all')
  const platform = process.argv.includes('--platform')
    ? process.argv[process.argv.indexOf('--platform') + 1] : all ? null : 'simpleview'
  const dryRun = process.argv.includes('--dry-run')

  const client = makeIngestClient()
  const platforms = platform ? [platform] : Object.keys(FETCHERS)
  const sources: SourceDoc[] = await client.fetch(
    `*[_type == "source" && platform in $platforms && active == true]{ _id, name, platform, identifier, trusted }`,
    { platforms })
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Ingesting ${platforms.join(', ')}: ${sources.length} source(s)`)

  const results: SourceResult[] = []
  for (const source of sources) {
    const fetcher = FETCHERS[source.platform]
    if (!fetcher) { results.push({ name: source.name, platform: source.platform, fetched: 0, created: 0, merged: 0, skipped: 0, error: 'no fetcher' }); continue }
    try {
      const events = await fetcher.fetchUpcoming(source, WINDOW_DAYS)
      console.log(`${source.name}: fetched ${events.length} upcoming`)
      const r = await writeEvents(client, events, dryRun, { autoApprove: source.trusted === true })
      console.log(`${source.name}: created ${r.created}, merged ${r.merged}, skipped ${r.skipped}`)
      if (!dryRun) await client.patch(source._id).set({ lastPulled: new Date().toISOString() }).commit()
      results.push({ name: source.name, platform: source.platform, fetched: events.length, ...r })
    } catch (err) {
      console.error(`FAILED ${source.name}:`, err)
      results.push({ name: source.name, platform: source.platform, fetched: 0, created: 0, merged: 0, skipped: 0, error: String(err) })
    }
  }
  // DIGEST_JSON is the machine-readable summary the weekly scheduled agent greps from stdout —
  // keep this a single line with a stable prefix; never remove or rename it.
  console.log(`\nDIGEST_JSON ${JSON.stringify({ dryRun, at: new Date().toISOString(), results })}`)
  const failures = results.filter(r => r.error).length
  if (failures === results.length && results.length > 0) process.exit(1) // all failed → red run
  console.log(`Done. ${failures} source(s) failed.`)
}
main().catch((e) => { console.error(e); process.exit(1) })

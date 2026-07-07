import { config } from 'dotenv'
import { eventbriteFetcher } from './fetchers/eventbrite'
import type { Fetcher, SourceDoc } from './fetchers/types'
import { makeIngestClient, writeEvents } from './lib/writer'

// Local dev reads .env.local (gitignored); CI (GitHub Actions) injects env vars directly via
// the workflow's `env:` block, so a missing .env.local there is expected and harmless.
config({ path: '.env.local', quiet: true })

const FETCHERS: Record<string, Fetcher> = { eventbrite: eventbriteFetcher }
const WINDOW_DAYS = 60

async function main() {
  const platform = process.argv.includes('--platform')
    ? process.argv[process.argv.indexOf('--platform') + 1] : 'eventbrite'
  const dryRun = process.argv.includes('--dry-run')
  const fetcher = FETCHERS[platform]
  if (!fetcher) throw new Error(`No fetcher for platform "${platform}"`)

  const client = makeIngestClient()
  const sources: SourceDoc[] = await client.fetch(
    `*[_type == "source" && platform == $platform && active == true]{ _id, name, platform, identifier }`, { platform })
  console.log(`${dryRun ? '[DRY RUN] ' : ''}Ingesting ${platform}: ${sources.length} source(s)`)

  let failures = 0
  for (const source of sources) {
    try {
      const events = await fetcher.fetchUpcoming(source, WINDOW_DAYS)
      console.log(`${source.name}: fetched ${events.length} upcoming`)
      const result = await writeEvents(client, events, dryRun)
      console.log(`${source.name}: created ${result.created}, merged ${result.merged}, skipped ${result.skipped}`)
      if (!dryRun) await client.patch(source._id).set({ lastPulled: new Date().toISOString() }).commit()
    } catch (err) {
      failures += 1
      console.error(`FAILED ${source.name}:`, err)
    }
  }
  if (failures === sources.length && sources.length > 0) { process.exit(1) } // all failed → red run
  console.log(`Done. ${failures} source(s) failed.`)
}
main().catch((e) => { console.error(e); process.exit(1) })

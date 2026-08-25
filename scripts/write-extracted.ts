import { config } from 'dotenv'
import { readFileSync } from 'node:fs'
import { validateExtracted } from '../ingest/lib/validate'
import { makeIngestClient, writeEvents } from '../ingest/lib/writer'
config({ path: '.env.local', quiet: true })

// Usage: npx tsx scripts/write-extracted.ts <events.json> [--dry-run] [--pending]
// Input: JSON array of NormalizedEvent. Default publishes approved (trusted extraction);
// pass --pending for anything that should wait for human review.
async function main() {
  const file = process.argv[2]
  if (!file || file.startsWith('--')) { console.error('Usage: write-extracted.ts <events.json> [--dry-run] [--pending]'); process.exit(1) }
  const dryRun = process.argv.includes('--dry-run')
  const autoApprove = !process.argv.includes('--pending')

  const { valid, rejected } = validateExtracted(JSON.parse(readFileSync(file, 'utf8')))
  for (const r of rejected) console.log(`REJECTED (${r.reason}): ${JSON.stringify(r.event).slice(0, 120)}`)

  const client = makeIngestClient()
  const result = await writeEvents(client, valid, dryRun, { autoApprove })
  console.log(`\nDIGEST_JSON ${JSON.stringify({ dryRun, at: new Date().toISOString(), input: file,
    validated: valid.length, rejected: rejected.length, ...result })}`)
}
main().catch((e) => { console.error(e); process.exit(1) })

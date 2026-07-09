import { createClient } from '@sanity/client'

const BASE = process.argv[2] ?? 'http://localhost:3333'
const c = createClient({ projectId: 'r4b3vt07', dataset: 'production', apiVersion: '2026-07-01', useCdn: false })

type Result = { url: string; status: number; ms: number; note?: string }
const results: Result[] = []
let fail = 0

async function hit(path: string, expect = 200, note?: string) {
  const t0 = Date.now()
  try {
    const res = await fetch(BASE + path, { redirect: 'manual' })
    const ms = Date.now() - t0
    const ok = res.status === expect
    if (!ok) { fail++; console.log(`FAIL ${res.status} (want ${expect}) ${path}`) }
    results.push({ url: path, status: res.status, ms, note })
    return res
  } catch (e) {
    fail++
    console.log(`ERROR ${path}: ${(e as Error).message}`)
    results.push({ url: path, status: -1, ms: Date.now() - t0 })
    return null
  }
}

async function main() {
  const slugs: string[] = await c.fetch(`*[_type=="event" && status=="approved"].slug.current`)
  console.log(`crawling: 7 static pages + ${slugs.length} event pages + filters + links\n`)

  // core pages
  const core = ['/', '/events', '/map', '/archive', '/submit', '/about', '/privacy']
  for (const p of core) await hit(p)

  // every single event detail page
  for (const s of slugs) await hit(`/events/${s}`)

  // filter matrix
  const cats = ['music','arts','food','family','nightlife','community','sports','education','festival','other']
  for (const cat of cats) await hit(`/events?category=${cat}`)
  for (const d of ['7','30','90','abc','-5','9999']) await hit(`/events?days=${d}`)
  await hit('/events?free=1')
  await hit('/events?q=trivia')
  await hit('/events?q=zzznope')
  await hit('/events?category=music&free=1&days=7&q=a')

  // error paths
  await hit('/events/does-not-exist-at-all', 404)
  await hit('/nope', 404)

  // api auth
  const r1 = await fetch(BASE + '/api/revalidate?secret=wrong', { method: 'POST' })
  if (r1.status !== 401) { fail++; console.log(`FAIL revalidate wrong-secret: ${r1.status}`) }

  // link integrity: collect every internal href from every core page + 5 event pages
  const seen = new Set<string>()
  const pagesToScan = [...core, ...slugs.slice(0, 5).map(s => `/events/${s}`)]
  for (const p of pagesToScan) {
    const res = await fetch(BASE + p)
    const html = await res.text()
    for (const m of html.matchAll(/href="(\/[^"#?]*)(\?[^"#]*)?"/g)) {
      const link = m[1]
      if (link.startsWith('/_next') || link.startsWith('/studio')) continue
      seen.add(link)
    }
    // consistency: footer credit present on every site page
    if (!html.includes('TNTDIM')) { fail++; console.log(`FAIL missing footer credit on ${p}`) }
    if (html.includes('—')) { fail++; console.log(`FAIL em dash rendered on ${p}`) }
  }
  console.log(`\ninternal links discovered: ${seen.size}`)
  for (const link of seen) {
    if (results.some(r => r.url === link)) continue
    await hit(link)
  }

  // repeat-load stability (the worker-crash class): hammer the heaviest dynamic page
  for (let i = 0; i < 15; i++) await hit('/events')
  for (let i = 0; i < 10; i++) await hit(`/events/${slugs[i % slugs.length]}`)

  const total = results.length
  const slow = results.filter(r => r.ms > 3000)
  console.log(`\n===== SUMMARY =====`)
  console.log(`requests: ${total}, failures: ${fail}, >3s: ${slow.length}`)
  if (slow.length) slow.forEach(s => console.log(`SLOW ${s.ms}ms ${s.url}`))
  if (fail > 0) process.exit(1)
  console.log('ALL GREEN')
}
main().catch(e => { console.error(e); process.exit(1) })

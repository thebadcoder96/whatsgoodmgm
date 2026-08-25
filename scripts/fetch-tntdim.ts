import { config } from 'dotenv'
config({ path: '.env.local', quiet: true })

const USER = 'More-Ideal5423'
const UA = 'whatsgoodmgm-ingest/1.0 (community events site; contact info@mmintelligence.ai)'

async function main() {
  const id = process.env.REDDIT_CLIENT_ID, secret = process.env.REDDIT_CLIENT_SECRET
  if (!id || !secret) { console.error('Missing REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET'); process.exit(1) }

  const tok = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: 'grant_type=client_credentials',
  })
  if (!tok.ok) throw new Error(`reddit auth: HTTP ${tok.status}`)
  const { access_token } = await tok.json()

  const res = await fetch(`https://oauth.reddit.com/user/${USER}/submitted?limit=10&sort=new&raw_json=1`,
    { headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': UA } })
  if (!res.ok) throw new Error(`reddit fetch: HTTP ${res.status}`)
  const data = await res.json()

  const posts = data.data.children
    .map((c: any) => c.data)
    .filter((p: any) => /nothing to do in montgomery|tntdim/i.test(p.title))
  if (posts.length === 0) { console.log('NO_TNTDIM_POSTS_FOUND'); return }
  for (const p of posts.slice(0, 2)) {
    console.log(`=== POST ===`)
    console.log(`TITLE: ${p.title}`)
    console.log(`PERMALINK: https://www.reddit.com${p.permalink}`)
    console.log(`POSTED_UTC: ${new Date(p.created_utc * 1000).toISOString()}`)
    console.log(`BODY:\n${p.selftext}`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })

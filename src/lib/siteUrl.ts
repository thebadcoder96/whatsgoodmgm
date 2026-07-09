// Canonical origin for absolute URLs (metadata, sitemap, robots, JSON-LD).
// Precedence:
//   1. NEXT_PUBLIC_SITE_URL  - set this when the real domain (whatsgoodmgm.com) lands.
//   2. VERCEL_PROJECT_PRODUCTION_URL - auto-set by Vercel to the stable prod host.
//   3. localhost fallback for local dev.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3333')

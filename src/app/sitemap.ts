import type { MetadataRoute } from 'next'
import { groq } from 'next-sanity'
import { client } from '@/lib/sanity/client'
import { SITE_URL } from '@/lib/siteUrl'

// Plain client (not the tagged sanityFetch helper) so build-time generation
// resolves without Next's fetch cache tags.
const APPROVED_EVENT_SLUGS = groq`
  *[_type == "event" && status == "approved"]{ "slug": slug.current, _updatedAt }`

type SitemapEvent = { slug: string; _updatedAt: string }

const STATIC_PATHS = ['', '/events', '/map', '/archive', '/submit', '/about', '/privacy', '/guide']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(path => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
  }))

  const events = await client.fetch<SitemapEvent[]>(APPROVED_EVENT_SLUGS)

  const eventEntries: MetadataRoute.Sitemap = events
    .filter(e => e.slug)
    .map(e => ({
      url: `${SITE_URL}/events/${e.slug}`,
      lastModified: e._updatedAt ? new Date(e._updatedAt) : now,
    }))

  return [...staticEntries, ...eventEntries]
}

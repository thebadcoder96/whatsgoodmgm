import { sanityFetch } from '@/lib/sanity/fetch'
import { UPCOMING_OR_RECURRING, EVENT_BY_SLUG, type EventDoc } from '@/lib/sanity/queries'
import { expandOccurrences } from '@/lib/events/occurrences'
import { matchesFilters } from '@/lib/events/filter'
import { buildCalendar } from '@/lib/ics'
import { SITE_URL } from '@/lib/siteUrl'

const FEED_DAYS = 90

function icsResponse(body: string, filename: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const now = new Date()

  // single-event mode: /api/calendar.ics?event=<slug>
  const slug = searchParams.get('event')
  if (slug) {
    const event = await sanityFetch<EventDoc | null>(EVENT_BY_SLUG, { slug })
    if (!event) return new Response('not found', { status: 404 })
    return icsResponse(
      buildCalendar([{ e: event, occursAt: event.startDateTime }], SITE_URL, now),
      `${slug}.ics`)
  }

  // feed mode: same filter params the site UI uses; unknown params are ignored
  const filters = {
    category: searchParams.get('category') ?? undefined,
    interest: searchParams.get('interest') ?? undefined,
    free: !!searchParams.get('free'),
  }
  const to = new Date(now.getTime() + FEED_DAYS * 86_400_000)
  const events = await sanityFetch<EventDoc[]>(UPCOMING_OR_RECURRING, { from: now.toISOString() })
  const items = events
    .filter(e => matchesFilters(e, filters))
    .flatMap(e => expandOccurrences(e, now.toISOString(), to.toISOString())
      .map(occursAt => ({ e, occursAt })))
    .sort((a, b) => a.occursAt.localeCompare(b.occursAt))

  return icsResponse(buildCalendar(items, SITE_URL, now), 'whatsgoodmgm.ics')
}

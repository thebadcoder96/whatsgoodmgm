import { sanityFetch } from '@/lib/sanity/fetch'
import { UPCOMING_OR_RECURRING, EVENTS_SEARCH, type EventDoc } from '@/lib/sanity/queries'
import { CATEGORIES } from '@/lib/events/categories'
import { INTERESTS } from '@/lib/events/interests'
import { expandOccurrences } from '@/lib/events/occurrences'
import { matchesFilters } from '@/lib/events/filter'
import {
  addDays, addMonths, groupByDay, isDayKey, isMonthKey, monthGrid, todayKey, weekStart,
  type Occurrence,
} from '@/lib/events/grouping'
import { SITE_URL } from '@/lib/siteUrl'
import EventFilters from '@/components/EventFilters'
import { EventList } from '@/components/events/EventList'
import { MonthView } from '@/components/events/MonthView'
import { WeekView } from '@/components/events/WeekView'
import { ViewTabs, type EventsView } from '@/components/events/ViewTabs'
import { SubscribeMenu } from '@/components/events/SubscribeMenu'

export type SurfaceSearchParams = Record<string, string | undefined>

const monthLabelFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' })

function query(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v)
  const s = p.toString()
  return s ? `?${s}` : ''
}

export async function EventsSurface({ view, searchParams }: { view: EventsView; searchParams: SurfaceSearchParams }) {
  const { q, category, interest, free, days: daysParam, m, w } = searchParams
  const filters = { category, interest, free: !!free }
  const filterParams = { category, interest, free: free ? '1' : undefined }
  const now = new Date()
  const today = todayKey(now)

  // window per view
  const windowDays = Math.min(Math.max(Number(daysParam) || 30, 1), 90)
  const ym = m && isMonthKey(m) ? m : today.slice(0, 7)
  const anchor = w && isDayKey(w) ? weekStart(w) : weekStart(today)
  const weeks = monthGrid(ym)
  const from = now.toISOString()
  const to =
    view === 'month' ? `${addDays(weeks[weeks.length - 1][6].day, 2)}T00:00:00Z`
    : view === 'week' ? `${addDays(anchor, 9)}T00:00:00Z`
    : new Date(now.getTime() + windowDays * 86_400_000).toISOString()

  // search only applies to the list view
  const searching = view === 'list' && !!q
  const events = searching
    ? await sanityFetch<EventDoc[]>(EVENTS_SEARCH, { q })
    : await sanityFetch<EventDoc[]>(UPCOMING_OR_RECURRING, { from })

  const filtered = events.filter(e => matchesFilters(e, filters))
  const occurrences: Occurrence[] = searching
    ? filtered.map(e => ({ e, occursAt: e.startDateTime }))
    : filtered
        .flatMap(e => expandOccurrences(e, from, to).map(occursAt => ({ e, occursAt })))
        .sort((a, b) => a.occursAt.localeCompare(b.occursAt))
  const groups = groupByDay(occurrences)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewTabs view={view} query={query(filterParams)} />
        <SubscribeMenu siteUrl={SITE_URL} feedQuery={query(filterParams)} filtered={!!(category || interest || free)} />
      </div>

      <EventFilters
        q={view === 'list' ? q : undefined}
        category={category}
        interest={interest}
        days={view === 'list' ? daysParam : undefined}
        free={free}
        categories={CATEGORIES}
        interests={INTERESTS}
      />

      {view === 'list' && <EventList groups={groups} />}
      {view === 'month' && (
        <MonthView
          weeks={weeks}
          groups={groups}
          monthLabel={monthLabelFmt.format(new Date(`${ym}-01T12:00:00Z`)).toLowerCase()}
          today={today}
          prevHref={`/calendar${query({ ...filterParams, m: addMonths(ym, -1) })}`}
          nextHref={`/calendar${query({ ...filterParams, m: addMonths(ym, 1) })}`}
          todayHref={`/calendar${query(filterParams)}`}
        />
      )}
      {view === 'week' && (
        <WeekView
          anchor={anchor}
          groups={groups}
          prevHref={`/calendar/week${query({ ...filterParams, w: addDays(anchor, -7) })}`}
          nextHref={`/calendar/week${query({ ...filterParams, w: addDays(anchor, 7) })}`}
          todayHref={`/calendar/week${query(filterParams)}`}
        />
      )}
    </div>
  )
}

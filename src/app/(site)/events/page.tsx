import { sanityFetch } from '@/lib/sanity/fetch'
import { UPCOMING_OR_RECURRING, EVENTS_SEARCH, type EventDoc } from '@/lib/sanity/queries'
import { CATEGORIES } from '@/lib/events/categories'
import { expandOccurrences } from '@/lib/events/occurrences'
import { EventCard } from '@/components/EventCard'

export const revalidate = 3600
export const metadata = { title: 'All events' }

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { category, free, q, days: daysParam } = await searchParams
  const windowDays = Math.min(Math.max(Number(daysParam) || 30, 1), 90)
  const now = new Date()
  const to = new Date(now.getTime() + windowDays * 86_400_000)

  const events = q
    ? await sanityFetch<EventDoc[]>(EVENTS_SEARCH, { q })
    : await sanityFetch<EventDoc[]>(UPCOMING_OR_RECURRING, { from: now.toISOString() })

  const filtered = events.filter(e =>
    (!category || e.category === category) &&
    (!free || /^free/i.test((e.priceText ?? '').trim()))) // free = free general admission, not "$8, kids free"

  const occurrences = q
    ? filtered.map(e => ({ e, occursAt: e.startDateTime }))
    : filtered
        .flatMap(e => expandOccurrences(e, now.toISOString(), to.toISOString()).map(occursAt => ({ e, occursAt })))
        .sort((a, b) => a.occursAt.localeCompare(b.occursAt))

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">All events</h1>
      <form className="mt-4 flex flex-wrap items-center gap-3 text-sm" method="GET">
        <input name="q" defaultValue={q} placeholder="Search events…"
          className="rounded-md border border-white/15 bg-[var(--surface)] px-3 py-2" />
        <select name="category" defaultValue={category ?? ''} className="rounded-md border border-white/15 bg-[var(--surface)] px-3 py-2">
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="days" defaultValue={daysParam ?? '30'} className="rounded-md border border-white/15 bg-[var(--surface)] px-3 py-2">
          <option value="7">Next 7 days</option>
          <option value="30">Next 30 days</option>
          <option value="90">Next 90 days</option>
        </select>
        <label className="flex items-center gap-1.5"><input type="checkbox" name="free" value="1" defaultChecked={!!free} /> Free only</label>
        <button className="rounded-md bg-[var(--accent)] px-3 py-2 font-medium text-[var(--accent-ink)]">Filter</button>
      </form>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {occurrences.map(({ e, occursAt }) => <EventCard key={`${e._id}${occursAt}`} event={e} occursAt={occursAt} />)}
      </div>
      {occurrences.length === 0 && <p className="mt-6 text-[var(--ink-dim)]">Nothing matches — try widening the filters.</p>}
    </div>
  )
}

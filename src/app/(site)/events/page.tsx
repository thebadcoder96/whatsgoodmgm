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

  const pill = 'rounded-full border border-white/10 bg-[var(--surface-2)] px-3.5 py-1.5 text-[var(--ink)] focus:border-[var(--accent-deep)]'

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">all events</h1>
      <form className="mt-5 flex flex-wrap items-center gap-2 border-b border-white/5 pb-5 text-sm" method="GET">
        <input name="q" defaultValue={q} placeholder="search events…" className={`${pill} min-w-40`} />
        <select name="category" defaultValue={category ?? ''} className={pill}>
          <option value="">all categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="days" defaultValue={daysParam ?? '30'} className={pill}>
          <option value="7">next 7 days</option>
          <option value="30">next 30 days</option>
          <option value="90">next 90 days</option>
        </select>
        <label className={`${pill} flex cursor-pointer items-center gap-1.5 text-[var(--ink-dim)]`}>
          <input type="checkbox" name="free" value="1" defaultChecked={!!free} className="accent-[var(--accent)]" /> free only
        </label>
        <button className="rounded-full bg-[var(--accent)] px-4 py-1.5 font-medium text-[var(--accent-ink)]">filter</button>
      </form>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {occurrences.map(({ e, occursAt }) => <EventCard key={`${e._id}${occursAt}`} event={e} occursAt={occursAt} />)}
      </div>
      {occurrences.length === 0 && (
        <p className="mt-8 border-y border-dotted border-[var(--accent)]/40 py-4 font-display italic text-[var(--ink-dim)]">
          quiet on that front. the Gump&apos;s not asleep, though — try loosening a filter, or{' '}
          <a href="/events" className="link-gold">clear them all</a>.
        </p>
      )}
    </div>
  )
}

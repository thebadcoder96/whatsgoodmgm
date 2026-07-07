import { PortableText } from '@portabletext/react'
import { sanityFetch } from '@/lib/sanity/fetch'
import { PAST_WEEKLY_PICKS, PAST_EVENTS, type EventDoc } from '@/lib/sanity/queries'
import { EventCard } from '@/components/EventCard'
import { formatWeekOf } from '@/lib/events/format'

export const revalidate = 3600
export const metadata = { title: 'Archive' }

export default async function ArchivePage() {
  const [picks, events] = await Promise.all([
    sanityFetch<any[]>(PAST_WEEKLY_PICKS),
    sanityFetch<EventDoc[]>(PAST_EVENTS, { now: new Date().toISOString() }),
  ])
  return (
    <div className="space-y-12">
      <section>
        <h1 className="font-display text-2xl font-bold">Past weekly picks</h1>
        <div className="mt-4 space-y-6">
          {picks.map(p => (
            <div key={p._id} className="rounded-lg border border-white/10 bg-[var(--surface)] p-5">
              <p className="text-xs text-[var(--ink-dim)]">Week of {formatWeekOf(p.weekOf)}</p>
              <h2 className="mt-1 font-semibold">{p.headline}</h2>
              {p.body && <div className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--ink-dim)]"><PortableText value={p.body} /></div>}
              {p.author && <p className="mt-2 text-xs text-[var(--ink-dim)]">— {p.author.name}</p>}
            </div>
          ))}
          {picks.length === 0 && <p className="text-[var(--ink-dim)]">The archive starts filling up after the first Thursday.</p>}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl font-semibold">Past events</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {events.map(e => <EventCard key={e._id} event={e} />)}
        </div>
        {events.length === 0 && <p className="mt-4 text-[var(--ink-dim)]">Nothing in the rearview yet.</p>}
      </section>
    </div>
  )
}

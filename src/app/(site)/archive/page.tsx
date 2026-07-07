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
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">the archive</h1>
        <p className="mt-2 font-display italic text-[var(--ink-dim)]">every Thursday since day one. the receipts.</p>
        <div className="mt-6 space-y-4">
          {picks.map(p => (
            <div key={p._id} className="rounded-r-lg border-l-2 border-dotted border-[var(--accent-deep)] bg-[var(--surface)] p-5 ring-1 ring-white/5">
              <p className="font-mono text-xs text-[var(--ink-dim)]">week of {formatWeekOf(p.weekOf).toLowerCase()}</p>
              <h2 className="mt-1.5 font-semibold leading-snug">{p.headline}</h2>
              {p.body && <div className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--ink-dim)]"><PortableText value={p.body} /></div>}
              {p.author && <p className="mt-3 font-mono text-xs text-[var(--ink-dim)]">picked by {p.author.name}</p>}
            </div>
          ))}
          {picks.length === 0 && (
            <p className="border-y border-dotted border-[var(--accent)]/40 py-4 font-display italic text-[var(--ink-dim)]">
              the archive starts filling up after the first Thursday.
            </p>
          )}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl font-semibold italic">past events</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {events.map(e => <EventCard key={e._id} event={e} />)}
        </div>
        {events.length === 0 && (
          <p className="mt-4 border-y border-dotted border-[var(--accent)]/40 py-4 font-display italic text-[var(--ink-dim)]">
            nothing in the rearview yet.
          </p>
        )}
      </section>
    </div>
  )
}

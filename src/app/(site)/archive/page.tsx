import { sanityFetch } from '@/lib/sanity/fetch'
import { PAST_EVENTS, type EventDoc } from '@/lib/sanity/queries'
import { EventCard } from '@/components/EventCard'

export const revalidate = 3600
export const metadata = { title: 'Archive' }

export default async function ArchivePage() {
  const events = await sanityFetch<EventDoc[]>(PAST_EVENTS, { now: new Date().toISOString() })
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">the archive</h1>
      <p className="mt-2 font-display italic text-[var(--ink-dim)]">everything that already happened. the receipts.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {events.map(e => <EventCard key={e._id} event={e} />)}
      </div>
      {events.length === 0 && (
        <p className="mt-4 border-y border-dotted border-[var(--accent)]/40 py-4 font-display italic text-[var(--ink-dim)]">
          nothing in the rearview yet.
        </p>
      )}
    </div>
  )
}

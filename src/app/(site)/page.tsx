import Link from 'next/link'
import { sanityFetch } from '@/lib/sanity/fetch'
import { LATEST_WEEKLY_PICK, UPCOMING_OR_RECURRING, type EventDoc } from '@/lib/sanity/queries'
import { expandOccurrences } from '@/lib/events/occurrences'
import { EventCard } from '@/components/EventCard'
import { WeeklyPickHero } from '@/components/WeeklyPickHero'

export const revalidate = 3600

export default async function HomePage() {
  const now = new Date()
  const in3days = new Date(now.getTime() + 3 * 86_400_000)
  const [pick, events] = await Promise.all([
    sanityFetch<any>(LATEST_WEEKLY_PICK),
    sanityFetch<EventDoc[]>(UPCOMING_OR_RECURRING, { from: now.toISOString() }),
  ])

  const thisWeekend = events
    .flatMap(e => expandOccurrences(e, now.toISOString(), in3days.toISOString()).map(occursAt => ({ e, occursAt })))
    .sort((a, b) => a.occursAt.localeCompare(b.occursAt))
    .slice(0, 6)

  return (
    <div className="space-y-10">
      {pick ? <WeeklyPickHero pick={pick} /> : (
        <section className="rounded-xl border border-white/10 p-8 text-center">
          <h1 className="text-3xl font-bold">Know what&apos;s good in the Gump.</h1>
          <p className="mt-2 text-[var(--ink-dim)]">The weekly pick lands every Thursday.</p>
        </section>
      )}
      <section>
        <h2 className="text-xl font-semibold">This weekend</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {thisWeekend.map(({ e, occursAt }) => <EventCard key={`${e._id}${occursAt}`} event={e} occursAt={occursAt} />)}
        </div>
        {thisWeekend.length === 0 && <p className="mt-4 text-[var(--ink-dim)]">Quiet few days — check the full list.</p>}
        <Link href="/events" className="mt-6 inline-block rounded-md bg-[var(--accent)] px-4 py-2 font-medium text-[var(--accent-ink)]">
          See everything happening →
        </Link>
      </section>
    </div>
  )
}

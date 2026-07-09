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
        <section className="border-y border-[var(--accent-deep)]">
          <div className="my-1 border-y border-dotted border-[var(--accent)]/40 px-4 py-12 text-center">
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Know what&apos;s good in the Gump.</h1>
            <p className="mt-3 font-mono text-[13px] text-[var(--ink-dim)]">the weekly pick lands every thursday</p>
          </div>
        </section>
      )}
      <section>
        <h2 className="font-display text-xl font-semibold italic">this weekend</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {thisWeekend.map(({ e, occursAt }) => <EventCard key={`${e._id}${occursAt}`} event={e} occursAt={occursAt} />)}
        </div>
        {thisWeekend.length === 0 && (
          <p className="mt-4 border-y border-dotted border-[var(--accent)]/40 py-4 font-display italic text-[var(--ink-dim)]">
            quiet few days. the Gump&apos;s not asleep, though. <Link href="/events" className="link-gold">see everything upcoming</Link>.
          </p>
        )}
        <Link href="/events" className="link-gold mt-6 inline-block font-medium">
          see everything happening →
        </Link>
      </section>
    </div>
  )
}

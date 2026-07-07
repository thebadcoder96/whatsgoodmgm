import { PortableText } from '@portabletext/react'
import { EventCard } from './EventCard'
import type { EventDoc } from '@/lib/sanity/queries'

type Pick = {
  weekOf: string; headline: string; body?: any
  author?: { name: string; handle?: string }
  featuredEvents?: EventDoc[]
}

export function WeeklyPickHero({ pick }: { pick: Pick }) {
  return (
    <section className="rounded-xl border border-[var(--accent)]/30 bg-[var(--surface)] p-6 md:p-8">
      <p className="text-xs uppercase tracking-widest text-[var(--accent)]">What&apos;s Good This Weekend</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">{pick.headline}</h1>
      {pick.body && <div className="mt-4 max-w-none space-y-3 leading-relaxed text-[var(--ink-dim)]"><PortableText value={pick.body} /></div>}
      {pick.author && <p className="mt-3 text-sm text-[var(--ink-dim)]">— {pick.author.name}{pick.author.handle && ` (${pick.author.handle})`}</p>}
      {!!pick.featuredEvents?.length && (
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {pick.featuredEvents.map(e => <EventCard key={e._id} event={e} />)}
        </div>
      )}
    </section>
  )
}

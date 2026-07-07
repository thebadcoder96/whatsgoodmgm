import { sanityFetch } from '@/lib/sanity/fetch'
import { CONTRIBUTORS } from '@/lib/sanity/queries'

export const revalidate = 3600
export const metadata = { title: 'About' }

export default async function AboutPage() {
  const contributors = await sanityFetch<{ name: string; handle?: string; role?: string; bio?: string }[]>(CONTRIBUTORS)
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <h1 className="font-display text-3xl font-bold">Know what&apos;s good in the Gump.</h1>
        <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">
          WhatsGoodMGM is a free, no-ads guide to what&apos;s happening in Montgomery, Alabama.
          Events here are found, chosen, and written up by real people who live here. A machine helps
          collect; a human always decides. We link every event back to its source, because the people
          putting these events on are the point.
        </p>
        <p className="mt-4 leading-relaxed text-[var(--ink-dim)]">
          This started with the weekly events lists on r/Montgomery — proof the city wanted this —
          and grew into a place where those picks can live, be searched, and never get buried.
        </p>
      </section>
      <section>
        <h2 className="font-display text-xl font-semibold">The people</h2>
        <ul className="mt-4 space-y-4">
          {contributors.map(c => (
            <li key={c.name} className="rounded-lg border border-white/10 bg-[var(--surface)] p-4">
              <p className="font-semibold">{c.name} {c.handle && <span className="font-normal text-[var(--ink-dim)]">({c.handle})</span>}</p>
              {c.role && <p className="text-xs uppercase tracking-wide text-[var(--accent)]">{c.role}</p>}
              {c.bio && <p className="mt-1 text-sm text-[var(--ink-dim)]">{c.bio}</p>}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-xl font-semibold">Sources &amp; thanks</h2>
        <p className="mt-2 text-[var(--ink-dim)]">r/Montgomery, local venues, Eventbrite organizers, and everyone who submits. Want in? <a href="/submit" className="text-[var(--accent)] underline">Submit here</a>.</p>
      </section>
    </div>
  )
}

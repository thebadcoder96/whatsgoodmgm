import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { EventCard } from './EventCard'
import { formatEventDate } from '@/lib/events/format'
import type { EventDoc } from '@/lib/sanity/queries'

type Pick = {
  weekOf: string; headline: string; body?: any
  publishedAt?: string
  author?: { name: string; handle?: string }
  featuredEvents?: EventDoc[]
}

const FRESH_WINDOW_MS = 72 * 60 * 60 * 1000

export function WeeklyPickHero({ pick }: { pick: Pick }) {
  const isFresh = !!pick.publishedAt && Date.now() - Date.parse(pick.publishedAt) < FRESH_WINDOW_MS
  return (
    <section className="border-y border-[var(--accent-deep)]">
      <div className="relative my-1 border-y border-dotted border-[var(--accent)]/40 px-4 py-7 md:px-8 md:py-9">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(224,182,79,0.10),transparent_70%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]">What&apos;s good this weekend</p>
            {isFresh && (
              <span className="shrink-0 -rotate-2 border border-[var(--accent)] px-2 py-0.5 text-[11px] uppercase tracking-widest text-[var(--accent)]">
                fresh · thu
              </span>
            )}
          </div>
          <h1 className="font-display mt-3 text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-6xl">
            {pick.headline}
          </h1>
          {pick.body && (
            <>
              {/* md+: full body, exactly as before. */}
              <div className="font-display mt-5 hidden max-w-prose space-y-3 text-lg leading-8 md:block">
                <PortableText value={pick.body} />
              </div>
              {/* below md: first block only, remainder behind a quiet "keep
                  reading" <details> (no JS). */}
              <div className="font-display mt-5 max-w-prose space-y-3 text-lg leading-8 md:hidden">
                <PortableText value={Array.isArray(pick.body) ? pick.body.slice(0, 1) : pick.body} />
                {Array.isArray(pick.body) && pick.body.length > 1 && (
                  <details className="group space-y-3">
                    <summary className="link-gold flex cursor-pointer list-none items-center gap-1.5 text-base font-medium text-[var(--accent)] [&::-webkit-details-marker]:hidden">
                      keep reading
                      <svg
                        aria-hidden="true"
                        width="12"
                        height="8"
                        viewBox="0 0 12 8"
                        fill="none"
                        className="transition-transform duration-150 group-open:rotate-180"
                      >
                        <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <PortableText value={pick.body.slice(1)} />
                  </details>
                )}
              </div>
            </>
          )}
          {pick.author && (
            <p className="mt-5 font-mono text-[13px] text-[var(--ink-dim)]">
              picked by {pick.author.handle ?? pick.author.name}
              {pick.publishedAt && (
                <>
                  <span className="max-md:hidden">, </span>
                  <span className="max-md:block">{formatEventDate(pick.publishedAt).toLowerCase()}</span>
                </>
              )}
            </p>
          )}
          <Link href="/events" className="link-gold mt-5 inline-block font-medium">
            see everything this weekend →
          </Link>
          {!!pick.featuredEvents?.length && (
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {pick.featuredEvents.map(e => <EventCard key={e._id} event={e} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

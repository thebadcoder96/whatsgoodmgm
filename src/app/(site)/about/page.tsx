export const metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Know what&apos;s good in the Gump.</h1>
        <p className="mt-5 leading-7 text-[var(--ink-dim)]">
          WhatsGoodMGM is a free, no-ads guide to what&apos;s happening in Montgomery, Alabama.
          Events here are found and chosen by people who live here. A machine helps collect;
          a human always decides. Every event links back to its source, because the people
          putting it on are the point.
        </p>
        <p className="mt-4 leading-7 text-[var(--ink-dim)]">
          This started with the{' '}
          <a href="https://www.reddit.com/user/More-Ideal5423/" className="link-gold text-[var(--ink)]" target="_blank" rel="noopener noreferrer">
            &ldquo;There&apos;s Nothing To Do In Montgomery&rdquo;
          </a>{' '}
          weekly threads on r/Montgomery, the best events list this city has, posted every week.
          Proof the city wanted this. Those lists deserved a permanent, searchable home instead of
          getting buried in a feed by Monday.
        </p>
      </section>
      <section>
        <h2 className="font-display text-xl font-semibold italic">who&apos;s behind this</h2>
        <p className="mt-3 leading-7 text-[var(--ink-dim)]">
          WhatsGoodMGM is built and kept running by{' '}
          <a href="https://www.mmintelligence.ai" className="link-gold text-[var(--ink)]" target="_blank" rel="noopener noreferrer">
            MM Intelligence
          </a>
          , a Montgomery software studio run by two brothers who build AI for real businesses
          and wanted to give something back to the city they build from. Free forever, no ads,
          no selling your data.
        </p>
      </section>
      <section>
        <h2 className="font-display text-xl font-semibold italic">sources &amp; thanks</h2>
        <p className="mt-3 leading-7 text-[var(--ink-dim)]">
          the TNTDIM weekly lists,{' '}
          <a href="https://www.reddit.com/r/Montgomery/" className="link-gold text-[var(--ink)]" target="_blank" rel="noopener noreferrer">
            r/Montgomery
          </a>{' '}
          and its city wiki, local venues, Eventbrite organizers, and everyone who submits.
          Want in? <a href="/submit" className="link-gold text-[var(--ink)]">submit here</a>.
        </p>
      </section>
    </div>
  )
}

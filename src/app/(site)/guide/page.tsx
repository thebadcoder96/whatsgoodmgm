export const metadata = { title: 'Guide' }

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">the curator&apos;s guide.</h1>
        <p className="mt-5 leading-7 text-[var(--ink-dim)]">
          Everything you do lives in the Studio, at{' '}
          <a href="/studio" className="link-gold text-[var(--ink)]">/studio</a>. Log in with your
          own account. Three jobs, and a bit of reference for the rest.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold italic">1. the thursday pick</h2>
        <p className="mt-3 leading-7 text-[var(--ink-dim)]">
          This is the main gig. In the sidebar, open <strong className="text-[var(--ink)]">Weekly picks</strong> and
          create a new one. Set <strong className="text-[var(--ink)]">weekOf</strong> to that Thursday, write a{' '}
          <strong className="text-[var(--ink)]">headline</strong>, then a short intro in your voice. Search for and
          add three to six events under <strong className="text-[var(--ink)]">featuredEvents</strong>. Hit{' '}
          <strong className="text-[var(--ink)]">Publish</strong>, bottom right. What you write lands at the top of
          the homepage.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold italic">2. adding an event</h2>
        <p className="mt-3 leading-7 text-[var(--ink-dim)]">
          Takes under a minute. Open <strong className="text-[var(--ink)]">All events</strong> and start a new one.
          Fill in the title and date, then search for the venue. Not in there yet? Hit{' '}
          <strong className="text-[var(--ink)]">+ Create</strong> and give it a name and address, that&apos;s all it
          needs. Pick a category, write a sentence of description, add the price if you know it. Check any{' '}
          <strong className="text-[var(--ink)]">Interests</strong> that fit, that&apos;s what the site&apos;s
          filters use. Hit Publish.
        </p>
        <p className="mt-3 leading-7 text-[var(--ink-dim)]">
          For weekly things, trivia night and the like, set <strong className="text-[var(--ink)]">Recurrence</strong>{' '}
          to weekly and add a short note. One event covers every week, no need to re-enter it.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold italic">3. the inbox</h2>
        <p className="mt-3 leading-7 text-[var(--ink-dim)]">
          A few clicks, most days. <strong className="text-[var(--ink)]">Pending approval</strong> holds events
          found automatically or sent in by the public. Open one, give it a glance, and hit the green{' '}
          <strong className="text-[var(--ink)]">Approve</strong> button, bottom right, to publish it. It&apos;s live
          within a minute. Junk or a duplicate? Change its Status to rejected instead.
        </p>
        <p className="mt-3 leading-7 text-[var(--ink-dim)]">
          <strong className="text-[var(--ink)]">New submissions</strong> are tips from the public form, mostly
          loose text, not a full event yet. If it&apos;s real, build it properly over in All events, then come back
          and set the submission&apos;s status to added.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold italic">good to know</h2>
        <ul className="mt-3 space-y-2 leading-7 text-[var(--ink-dim)]">
          <li>Everything links back to its source. That credit matters, keep it.</li>
          <li>Whatever you edit or approve shows up on the live site within a minute.</li>
          <li>You can&apos;t break the website. Click around, nothing here is fragile.</li>
          <li>Something looks off, or you&apos;re stuck? Tell Mishal.</li>
        </ul>
      </section>
    </div>
  )
}

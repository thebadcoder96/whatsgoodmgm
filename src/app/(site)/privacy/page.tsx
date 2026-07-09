export const metadata = { title: 'Privacy' }

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">The short version.</h1>
      <p className="leading-7 text-[var(--ink-dim)]">
        We don&apos;t have accounts. We don&apos;t run trackers or analytics that follow you
        around the internet. We don&apos;t sell anything, including your data.
      </p>
      <p className="leading-7 text-[var(--ink-dim)]">
        The <a href="/submit" className="link-gold text-[var(--ink)]">submit form</a> stores exactly
        what you type (the event info, and an optional handle or email) so a human can review it.
        If you leave an email, we only use it to ask questions about your submission. Ask us to
        delete yours anytime, either through the submit form or over on{' '}
        <a href="https://www.reddit.com/r/Montgomery/" className="link-gold text-[var(--ink)]" target="_blank" rel="noopener noreferrer">
          r/Montgomery
        </a>.
      </p>
      <p className="leading-7 text-[var(--ink-dim)]">
        Our hosting and CMS providers (Vercel, Sanity) keep standard server logs to run the
        infrastructure. That&apos;s their business, not ours, and it&apos;s the ordinary cost
        of a website existing.
      </p>
    </div>
  )
}

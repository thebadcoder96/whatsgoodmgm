import Link from 'next/link'

// Root-level 404 for URLs that match no route. Bad event slugs inside the
// site segment use src/app/(site)/not-found.tsx, which keeps the site chrome.
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl border-y border-dotted border-[var(--accent)]/40 py-16 text-center">
        <p className="font-mono text-[13px] text-[var(--ink-dim)]">404</p>
        <p className="mt-3 font-display text-xl italic text-[var(--ink-dim)]">
          that page wandered off down Dexter Avenue.
        </p>
        <Link href="/" className="link-gold mt-6 inline-block font-medium">head back home →</Link>
      </div>
    </div>
  )
}

import Link from 'next/link'

const nav = [
  { href: '/events', label: 'events' },
  { href: '/map', label: 'map' },
  { href: '/archive', label: 'archive' },
  { href: '/submit', label: 'submit' },
  { href: '/about', label: 'about' },
]

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-4">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight md:text-2xl">
            What&apos;s Good<span className="text-[var(--accent)]">.</span>MGM
          </Link>
          <nav className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-[var(--ink-dim)]">
            {nav.map(n => (
              <Link key={n.href} href={n.href}
                className="underline-offset-4 transition-colors hover:text-[var(--ink)] hover:underline hover:decoration-[var(--accent)] hover:decoration-2">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 md:py-12">{children}</main>
      <footer className="mt-8 border-t border-white/10 px-4 py-10 text-center">
        <p className="font-display text-sm italic text-[var(--ink-dim)]">
          made in Montgomery, for Montgomery. no ads, no algorithm — just what&apos;s good.
        </p>
        <p className="mt-2 font-mono text-xs text-[var(--ink-dim)]">fresh every thursday</p>
      </footer>
    </>
  )
}

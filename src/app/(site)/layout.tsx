import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import ThemeToggle from '@/components/ThemeToggle'

const nav = [
  { href: '/calendar', label: 'calendar' },
  { href: '/map', label: 'map' },
  { href: '/submit', label: 'submit' },
  { href: '/about', label: 'about' },
]

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-4">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight md:text-2xl">
            What&apos;s Good<span className="text-[var(--accent)]">.</span>MGM
          </Link>
          <div className="flex items-center gap-4">
            {/* mobile gets the bottom tab bar; up top only "about" (not a tab) + theme */}
            <nav className="hidden items-baseline gap-x-4 text-sm text-[var(--ink-dim)] md:flex">
              {nav.map(n => (
                <Link key={n.href} href={n.href}
                  className="underline-offset-4 transition-colors hover:text-[var(--ink)] hover:underline hover:decoration-[var(--accent)] hover:decoration-2">
                  {n.label}
                </Link>
              ))}
            </nav>
            <Link href="/about" className="py-2 text-sm text-[var(--ink-dim)] md:hidden">about</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 md:py-12 md:pb-12">{children}</main>
      <footer className="mt-8 border-t border-[var(--line)] px-4 pb-24 pt-10 text-center md:pb-10">
        <p className="font-display text-sm italic text-[var(--ink-dim)]">
          made in Montgomery, for Montgomery. no ads, no algorithm, just what&apos;s good.
        </p>
        <p className="mt-5 text-sm text-[var(--ink)]">
          built by{' '}
          <a href="https://www.mmintelligence.ai" className="link-gold font-medium" target="_blank" rel="noopener noreferrer">
            MM Intelligence
          </a>
          {' '}&middot; © 2026 &middot;{' '}
          <Link href="/archive" className="link-gold">archive</Link>
          {' '}&middot; <Link href="/privacy" className="link-gold">privacy</Link>
          {' '}&middot; <a href="mailto:info@mmintelligence.ai" className="link-gold">email us</a>
        </p>
      </footer>
      <BottomNav />
    </>
  )
}

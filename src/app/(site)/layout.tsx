import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

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
          <nav className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-[var(--ink-dim)] max-md:gap-x-5">
            {nav.map(n => (
              <Link key={n.href} href={n.href}
                className="underline-offset-4 transition-colors hover:text-[var(--ink)] hover:underline hover:decoration-[var(--accent)] hover:decoration-2 max-md:py-2">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 md:py-12 md:pb-12">{children}</main>
      <footer className="mt-8 border-t border-white/10 px-4 pb-24 pt-10 text-center md:pb-10">
        <p className="font-display text-sm italic text-[var(--ink-dim)]">
          made in Montgomery, for Montgomery. no ads, no algorithm, just what&apos;s good.
        </p>
        <p className="mt-2 font-mono text-xs text-[var(--ink-dim)]">fresh every thursday</p>
        {/* Desktop: one line with middot separators. Mobile: a clean stack with
            no dangling separators. */}
        <p className="mt-5 hidden text-sm text-[var(--ink)] md:block">
          in collaboration with{' '}
          <a href="https://www.reddit.com/user/More-Ideal5423/" className="link-gold font-medium" target="_blank" rel="noopener noreferrer">
            TNTDIM
          </a>
          {' '}&middot; built by{' '}
          <a href="https://www.mmintelligence.ai" className="link-gold font-medium" target="_blank" rel="noopener noreferrer">
            MM Intelligence
          </a>
          {' '}&middot; © 2026 &middot;{' '}
          <Link href="/privacy" className="link-gold">privacy</Link>
          {' '}&middot; <Link href="/guide" className="link-gold">guide</Link>
        </p>
        <div className="mt-5 flex flex-col items-center gap-1 text-sm text-[var(--ink)] md:hidden">
          <span>
            in collaboration with{' '}
            <a href="https://www.reddit.com/user/More-Ideal5423/" className="link-gold font-medium" target="_blank" rel="noopener noreferrer">
              TNTDIM
            </a>
          </span>
          <span>
            built by{' '}
            <a href="https://www.mmintelligence.ai" className="link-gold font-medium" target="_blank" rel="noopener noreferrer">
              MM Intelligence
            </a>
          </span>
          <span>
            © 2026 &middot; <Link href="/privacy" className="link-gold">privacy</Link> &middot;{' '}
            <Link href="/guide" className="link-gold">guide</Link>
          </span>
        </div>
      </footer>
      <BottomNav />
    </>
  )
}

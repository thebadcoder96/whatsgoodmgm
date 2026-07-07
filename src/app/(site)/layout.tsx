import Link from 'next/link'

const nav = [
  { href: '/events', label: 'Events' },
  { href: '/map', label: 'Map' },
  { href: '/archive', label: 'Archive' },
  { href: '/submit', label: 'Submit' },
  { href: '/about', label: 'About' },
]

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-display font-bold tracking-tight text-[var(--accent)]">WhatsGood<span className="text-[var(--ink)]">MGM</span></Link>
          <nav className="flex gap-4 text-sm text-[var(--ink-dim)]">
            {nav.map(n => <Link key={n.href} href={n.href} className="hover:text-[var(--ink)]">{n.label}</Link>)}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <footer className="border-t border-white/10 py-8 text-center text-sm text-[var(--ink-dim)]">
        <p>Events curated by the Montgomery community. Free, no ads, made with love in the Gump.</p>
      </footer>
    </>
  )
}

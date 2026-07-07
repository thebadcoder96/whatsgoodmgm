import type { Metadata } from 'next'
import Link from 'next/link'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: { default: 'WhatsGoodMGM — Know what\'s good in the Gump', template: '%s · WhatsGoodMGM' },
  description: 'A free, community-made guide to what\'s good in Montgomery, Alabama. Events, curated weekly.',
}

const nav = [
  { href: '/events', label: 'Events' },
  { href: '/map', label: 'Map' },
  { href: '/archive', label: 'Archive' },
  { href: '/submit', label: 'Submit' },
  { href: '/about', label: 'About' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-bold tracking-tight text-[var(--accent)]">WhatsGood<span className="text-[var(--ink)]">MGM</span></Link>
            <nav className="flex gap-4 text-sm text-[var(--ink-dim)]">
              {nav.map(n => <Link key={n.href} href={n.href} className="hover:text-[var(--ink)]">{n.label}</Link>)}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-white/10 py-8 text-center text-sm text-[var(--ink-dim)]">
          <p>Events curated by the Montgomery community. Free, no ads, made with love in the Gump.</p>
        </footer>
      </body>
    </html>
  )
}

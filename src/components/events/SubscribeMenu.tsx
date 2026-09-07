'use client'
import { useEffect, useRef, useState } from 'react'

export function SubscribeMenu({ siteUrl, feedQuery, filtered }: {
  siteUrl: string
  feedQuery: string // '' or '?category=music&free=1'
  filtered: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    return () => document.removeEventListener('pointerdown', onDocPointerDown)
  }, [open])

  const feedUrl = `${siteUrl}/api/calendar.ics${feedQuery}`
  const webcal = feedUrl.replace(/^https?/, 'webcal')
  const items = [
    { label: 'google calendar', href: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}` },
    { label: 'apple calendar', href: webcal },
    { label: 'outlook', href: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl)}&name=whatsgoodmgm` },
    { label: 'download .ics', href: feedUrl },
  ]

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="cursor-pointer rounded-full border border-[var(--accent-deep)] px-3.5 py-1.5 text-sm text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
      >
        subscribe ▾
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] py-1.5 shadow-lg shadow-[color:var(--shadow)]"
        >
          {items.map(i => (
            <a
              key={i.label}
              role="menuitem"
              href={i.href}
              target={i.label === 'apple calendar' || i.label === 'download .ics' ? undefined : '_blank'}
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-3.5 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--wash)]"
            >
              {i.label}
            </a>
          ))}
          <p className="border-t border-[var(--line-soft)] px-3.5 pb-1 pt-2 text-[11px] text-[var(--ink-dim)]">
            {filtered ? 'subscribes to your current filters' : 'auto-updates as events land'}
          </p>
        </div>
      )}
    </div>
  )
}

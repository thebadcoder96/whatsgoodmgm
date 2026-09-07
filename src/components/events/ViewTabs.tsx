import Link from 'next/link'

export type EventsView = 'list' | 'month' | 'week'

const tabs: { view: EventsView; href: string; label: string }[] = [
  { view: 'list', href: '/', label: 'list' },
  { view: 'month', href: '/calendar', label: 'month' },
  { view: 'week', href: '/calendar/week', label: 'week' },
]

export function ViewTabs({ view, query }: { view: EventsView; query: string }) {
  return (
    <div role="group" aria-label="view" className="inline-flex overflow-hidden rounded-full border border-[var(--line)]">
      {tabs.map(t => (
        <Link
          key={t.view}
          href={`${t.href}${query}`}
          aria-current={t.view === view ? 'page' : undefined}
          className={`px-3.5 py-1.5 text-sm transition-colors ${
            t.view === view
              ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
              : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}

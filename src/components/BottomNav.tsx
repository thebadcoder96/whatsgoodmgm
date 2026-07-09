'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = { href: string; label: string; icon: React.ReactNode }

// Consistent stroke-style set at ~22px. Icons inherit currentColor so the
// active/inactive color is driven entirely by the link className.
const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const tabs: Tab[] = [
  {
    href: '/',
    label: 'home',
    icon: (
      <svg {...iconProps}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    href: '/events',
    label: 'events',
    icon: (
      <svg {...iconProps}>
        <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
        <path d="M3.5 9h17M8 3v3M16 3v3M7.5 13h6M7.5 16.5h4" />
      </svg>
    ),
  },
  {
    href: '/map',
    label: 'map',
    icon: (
      <svg {...iconProps}>
        <path d="M19 10.5c0 5-7 10.5-7 10.5s-7-5.5-7-10.5a7 7 0 0 1 14 0Z" />
        <circle cx="12" cy="10.5" r="2.5" />
      </svg>
    ),
  },
  {
    href: '/submit',
    label: 'submit',
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[var(--surface)]/90 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch">
        {tabs.map(tab => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-14 min-w-12 flex-col items-center justify-center gap-1 py-2 transition-colors ${
                  active ? 'text-[var(--accent)]' : 'text-[var(--ink-dim)]'
                }`}
              >
                {tab.icon}
                <span className="text-[10px] lowercase tracking-wide">{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

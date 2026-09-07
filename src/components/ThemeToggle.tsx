'use client'

const iconProps = {
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

// Stateless: the html[data-theme] attribute is the single source of truth.
// CSS picks the icon, so SSR markup never disagrees with the stored theme.
export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try { localStorage.setItem('wg-theme', next) } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="toggle light or dark mode"
      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink-dim)] transition-colors hover:text-[var(--ink)]"
    >
      {/* sun: shown in dark mode */}
      <svg {...iconProps} className="hidden [[data-theme=dark]_&]:block">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      {/* moon: shown in light mode */}
      <svg {...iconProps} className="[[data-theme=dark]_&]:hidden">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  )
}

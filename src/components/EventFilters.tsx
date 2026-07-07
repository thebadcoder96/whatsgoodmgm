'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from 'react'

const pill = 'rounded-full border border-white/10 bg-[var(--surface-2)] px-3.5 py-1.5 text-[var(--ink)] focus:border-[var(--accent-deep)]'

type Option = { value: string; label: string }

/**
 * Custom listbox dropdown so the OPEN state matches the site too — native
 * <select> popups are OS chrome and can't be themed. Follows the WAI-ARIA
 * "select-only combobox" pattern: focus stays on the pill button and
 * aria-activedescendant tracks the highlighted option.
 */
function PillSelect({ id, label, value, options, onChange }: {
  id: string
  label: string
  value: string
  options: readonly Option[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(0, options.findIndex(o => o.value === value))
  const [active, setActive] = useState(selectedIndex)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  function openPanel() {
    setActive(selectedIndex)
    setOpen(true)
  }

  function choose(i: number) {
    setOpen(false)
    buttonRef.current?.focus()
    if (options[i] && options[i].value !== value) onChange(options[i].value)
  }

  // Click outside closes.
  useEffect(() => {
    if (!open) return
    function onDocPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    return () => document.removeEventListener('pointerdown', onDocPointerDown)
  }, [open])

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        openPanel()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive(i => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive(i => Math.max(i - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(active)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        buttonRef.current?.focus()
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        id={id}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={onKeyDown}
        className={`${pill} flex cursor-pointer items-center gap-2`}
      >
        {options[selectedIndex]?.label}
        <svg
          aria-hidden="true"
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 1l4 4 4-4" stroke="var(--ink-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-20 mt-2 max-h-64 min-w-full max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-white/10 bg-[var(--surface-2)] py-1.5 shadow-lg shadow-black/40"
        >
          {options.map((o, i) => {
            const selected = i === selectedIndex
            return (
              <li
                key={o.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center gap-2 whitespace-nowrap px-3.5 py-1.5 ${
                  i === active ? 'bg-white/5' : ''
                } ${selected ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${selected ? 'bg-[var(--accent)]' : 'bg-transparent'}`}
                />
                {o.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

type Props = {
  q?: string
  category?: string
  days?: string
  free?: string
  categories: readonly string[]
}

export default function EventFilters({ q, category, days, free, categories }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState(q ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep the field in sync if the URL changes from elsewhere (e.g. back/forward nav).
  useEffect(() => setSearch(q ?? ''), [q])

  function navigate(next: { q?: string; category?: string; days?: string; free?: boolean }) {
    const params = new URLSearchParams()
    if (next.q) params.set('q', next.q)
    if (next.category) params.set('category', next.category)
    if (next.days && next.days !== '30') params.set('days', next.days)
    if (next.free) params.set('free', '1')
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  function current(overrides: Partial<{ q: string; category: string; days: string; free: boolean }> = {}) {
    return {
      q: overrides.q ?? search,
      category: overrides.category ?? category ?? '',
      days: overrides.days ?? days ?? '30',
      free: overrides.free ?? !!free,
    }
  }

  function onSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate(current({ q: value })), 400)
  }

  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      navigate(current({ q: search }))
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const categoryOptions: Option[] = [
    { value: '', label: 'all categories' },
    ...categories.map(c => ({ value: c, label: c })),
  ]
  const daysOptions: Option[] = [
    { value: '7', label: 'next 7 days' },
    { value: '30', label: 'next 30 days' },
    { value: '90', label: 'next 90 days' },
  ]

  return (
    <form
      className="mt-5 flex flex-wrap items-center gap-2 border-b border-white/5 pb-5 text-sm"
      method="GET"
      onSubmit={e => {
        // JS is active — we already auto-filter, so a native submit (e.g. a
        // stray Enter we didn't catch) should still just update the URL
        // rather than doing a full page reload.
        e.preventDefault()
        navigate(current())
      }}
    >
      <label className="sr-only" htmlFor="events-search">
        search events
      </label>
      <input
        id="events-search"
        name="q"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        onKeyDown={onSearchKeyDown}
        placeholder="search events…"
        className={`${pill} min-w-40`}
      />

      <PillSelect
        id="events-category"
        label="category"
        value={category ?? ''}
        options={categoryOptions}
        onChange={v => navigate(current({ category: v }))}
      />

      <PillSelect
        id="events-days"
        label="date range"
        value={days ?? '30'}
        options={daysOptions}
        onChange={v => navigate(current({ days: v }))}
      />

      <label className={`${pill} flex cursor-pointer items-center gap-1.5 text-[var(--ink-dim)]`}>
        <input
          type="checkbox"
          name="free"
          value="1"
          defaultChecked={!!free}
          onChange={e => navigate(current({ free: e.target.checked }))}
          className="accent-[var(--accent)]"
        />{' '}
        free only
      </label>

      {/* No-JS fallback (degraded, accepted): the custom dropdowns require JS,
          but these hidden inputs keep the active category/days in the URL when
          the search box is submitted natively via Enter. */}
      {category ? <input type="hidden" name="category" value={category} /> : null}
      {days && days !== '30' ? <input type="hidden" name="days" value={days} /> : null}

      <span
        aria-hidden={!pending}
        className={`text-xs text-[var(--ink-dim)] transition-opacity duration-150 ${pending ? 'opacity-100' : 'opacity-0'}`}
      >
        updating…
      </span>
    </form>
  )
}

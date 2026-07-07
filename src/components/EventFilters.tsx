'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from 'react'

const pill = 'rounded-full border border-white/10 bg-[var(--surface-2)] px-3.5 py-1.5 text-[var(--ink)] focus:border-[var(--accent-deep)]'

// Custom chevron, drawn once as a data-URI so native <select> chrome (the
// clashing bit) can be switched off via appearance-none while keeping an
// affordance that it's a dropdown.
const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23a49d8f' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")"

const select =
  `${pill} appearance-none bg-no-repeat bg-[right_0.9rem_center] bg-[length:10px_6px] pr-8 cursor-pointer`

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

      <label className="sr-only" htmlFor="events-category">
        category
      </label>
      <select
        id="events-category"
        name="category"
        defaultValue={category ?? ''}
        onChange={e => navigate(current({ category: e.target.value }))}
        className={select}
        style={{ backgroundImage: chevron }}
      >
        <option value="">all categories</option>
        {categories.map(c => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="events-days">
        date range
      </label>
      <select
        id="events-days"
        name="days"
        defaultValue={days ?? '30'}
        onChange={e => navigate(current({ days: e.target.value }))}
        className={select}
        style={{ backgroundImage: chevron }}
      >
        <option value="7">next 7 days</option>
        <option value="30">next 30 days</option>
        <option value="90">next 90 days</option>
      </select>

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

      <span
        aria-hidden={!pending}
        className={`text-xs text-[var(--ink-dim)] transition-opacity duration-150 ${pending ? 'opacity-100' : 'opacity-0'}`}
      >
        updating…
      </span>
    </form>
  )
}

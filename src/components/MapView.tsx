'use client'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { divIcon, type Map as LeafletMap, type Marker as LeafletMarker } from 'leaflet'
import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { EventDoc } from '@/lib/sanity/queries'
import { expandOccurrences } from '@/lib/events/occurrences'
import { categoryHue } from '@/lib/events/categoryHue'

/**
 * List side: one card per event OCCURRENCE, chronological with day headers -
 * the same expansion the /events page uses, so "trivia every Tuesday" shows
 * up on its actual next Tuesday instead of a stale first date.
 *
 * Map side: one pin per venue (events at the same address would stack
 * invisibly otherwise) with a count badge. Venue-grouping lives ONLY in the
 * pin popup, where it's natural geography - never in the list.
 *
 * Sync: card click → fly to + open that venue's popup. Pin click → filter
 * the list to that venue (a chronological list scatters one venue's events
 * across day groups, so scrolling could only ever reach the first one);
 * a "showing events at X · clear" chip is the way back.
 */

type Occ = { e: EventDoc; occursAt: string }

type VenueGroup = {
  key: string
  lat: number
  lng: number
  name: string
  neighborhood?: string
  hue: string
  occs: Occ[]
}

// ---- date window ------------------------------------------------------

type RangeKey = 'today' | 'weekend' | 'week' | 'month'

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'today' },
  { key: 'weekend', label: 'this weekend' },
  { key: 'week', label: 'next 7 days' },
  { key: 'month', label: 'next 30 days' },
]

const DAY_MS = 86_400_000

function rangeWindow(key: RangeKey, now: Date): [Date, Date] {
  switch (key) {
    case 'today': {
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      return [now, end]
    }
    case 'weekend': {
      // Fri 00:00 through Sun 23:59 - if the weekend already started, from now.
      const dow = now.getDay() // 0 sun … 6 sat
      const start = new Date(now)
      if (dow >= 1 && dow <= 5) {
        start.setDate(start.getDate() + (5 - dow))
        start.setHours(0, 0, 0, 0)
      }
      const end = new Date(now)
      end.setDate(end.getDate() + (dow === 0 ? 0 : 7 - dow))
      end.setHours(23, 59, 59, 999)
      return [start < now ? now : start, end]
    }
    case 'week':
      return [now, new Date(now.getTime() + 7 * DAY_MS)]
    case 'month':
      return [now, new Date(now.getTime() + 30 * DAY_MS)]
  }
}

// ---- formatting (site timezone, matching src/lib/events/format.ts) ----

const TZ = 'America/Chicago'
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const dayLabelFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
const popupWhenFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
})

// A venue only earns a map key when it can actually be placed on the map.
const venueKey = (v?: EventDoc['venue']): string | null =>
  v && v.lat != null && v.lng != null ? (v._id ?? `${v.lat},${v.lng}`) : null

const directionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

// Gold dot in a category-hue ring, plus an event-count badge when the venue
// hosts more than one occurrence in the window. iconSize stays fixed so
// state changes never re-anchor the pin; visual weight changes live in CSS.
const pinFor = (hue: string, count: number, state: '' | 'on' | 'hover' | 'dim') =>
  divIcon({
    className: '',
    // The visible dot sits centered inside a 40px transparent hit box so the
    // tap target clears the 40px Material/HIG minimum without changing the
    // dot's look or anchor position.
    html: `<div class="wg-pin-hit"><div class="wg-pin${state ? ` wg-pin--${state}` : ''}" style="--pin-hue:${hue}">${
      count > 1 ? `<span class="wg-pin-count">${count}</span>` : ''
    }</div></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -16],
  })

// Small "place" glyph so the venue line can never be mistaken for the title
// or the date - a pin shape reads as geography before the word is even read.
function PinGlyph() {
  return (
    <svg aria-hidden="true" width="9" height="12" viewBox="0 0 9 12" fill="currentColor" className="shrink-0">
      <path d="M4.5 0C2.02 0 0 2.02 0 4.5 0 7.88 4.5 12 4.5 12S9 7.88 9 4.5C9 2.02 6.98 0 4.5 0Zm0 6.3a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z" />
    </svg>
  )
}

export default function MapView({ events }: { events: EventDoc[] }) {
  const [now] = useState(() => new Date())
  const [range, setRange] = useState<RangeKey>('week')
  const [venueFilter, setVenueFilter] = useState<{ key: string; name: string } | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRefs = useRef<Record<string, LeafletMarker | null>>({})

  // Every occurrence in the window, in date order - recurring events land on
  // their actual next dates instead of appearing once with a stale date.
  const occurrences = useMemo<Occ[]>(() => {
    const [from, to] = rangeWindow(range, now)
    return events
      .flatMap(e => expandOccurrences(e, from.toISOString(), to.toISOString()).map(occursAt => ({ e, occursAt })))
      .sort((a, b) => a.occursAt.localeCompare(b.occursAt))
  }, [events, range, now])

  const venues = useMemo<VenueGroup[]>(() => {
    const byVenue = new Map<string, VenueGroup>()
    for (const o of occurrences) {
      const k = venueKey(o.e.venue)
      if (!k) continue
      const v = o.e.venue!
      const g = byVenue.get(k)
      if (g) g.occs.push(o)
      else
        byVenue.set(k, {
          key: k,
          lat: v.lat!,
          lng: v.lng!,
          name: v.name,
          neighborhood: v.neighborhood,
          hue: categoryHue(o.e.category),
          occs: [o],
        })
    }
    return [...byVenue.values()]
  }, [occurrences])

  // The list: chronological, optionally narrowed to one venue by a pin click.
  // Events without coords stay IN the list (they just can't sync to the map).
  const listed = venueFilter ? occurrences.filter(o => venueKey(o.e.venue) === venueFilter.key) : occurrences

  const todayKey = dayKeyFmt.format(now)
  const tomorrowKey = dayKeyFmt.format(new Date(now.getTime() + DAY_MS))
  const days: { key: string; label: string; occs: Occ[] }[] = []
  for (const o of listed) {
    const d = new Date(o.occursAt)
    const key = dayKeyFmt.format(d)
    const last = days[days.length - 1]
    if (last?.key === key) last.occs.push(o)
    else {
      const base = dayLabelFmt.format(d).toLowerCase()
      const label = key === todayKey ? `today · ${base}` : key === tomorrowKey ? `tomorrow · ${base}` : base
      days.push({ key, label, occs: [o] })
    }
  }

  // Card → map: fly to the venue and open its popup. Never filters.
  const showOnMap = (key: string) => {
    const g = venues.find(v => v.key === key)
    if (!g) return
    setSelected(key)
    const m = mapRef.current
    if (m) m.flyTo([g.lat, g.lng], Math.max(m.getZoom(), 14), { duration: 0.6 })
    markerRefs.current[key]?.openPopup()
  }

  // Pin → list: narrow to that venue (its events are scattered through the
  // chronological list, so scrolling could only reach the first one).
  const filterToVenue = (g: VenueGroup) => {
    setSelected(g.key)
    setVenueFilter({ key: g.key, name: g.name })
  }

  const clearVenue = () => {
    setVenueFilter(null)
    setSelected(null)
  }

  const pinState = (key: string): '' | 'on' | 'hover' | 'dim' => {
    if (selected === key) return 'on'
    if (hovered === key) return 'hover'
    if (venueFilter) return 'dim'
    return ''
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: pills + status span the full width above both the list and
          the map, one row that wraps on mobile. Sticky above the list while
          the page scrolls; static once the list/map row itself has a scroll
          container on desktop. */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-[var(--bg)] pb-3 pt-1 md:static md:z-auto md:pt-0">
        <div className="flex flex-wrap gap-2" role="group" aria-label="date range">
          {RANGES.map(r => {
            const on = range === r.key
            return (
              <button
                key={r.key}
                type="button"
                aria-pressed={on}
                onClick={() => setRange(r.key)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors max-md:px-4 max-md:py-2.5 ${
                  on
                    ? 'border-[var(--accent-deep)] text-[var(--accent)]'
                    : 'border-white/10 text-[var(--ink-dim)] hover:border-white/20 hover:text-[var(--ink)]'
                }`}
              >
                {r.label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-dim)]">
            {listed.length} {listed.length === 1 ? 'event' : 'events'} · {venues.length}{' '}
            {venues.length === 1 ? 'spot' : 'spots'} on the map
          </p>
          {venueFilter && (
            <button
              type="button"
              onClick={clearVenue}
              className="inline-flex items-center gap-1.5 rounded-full border border-dotted border-[var(--accent)]/60 px-3 py-1 text-xs text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
            >
              showing events at {venueFilter.name.toLowerCase()} · clear
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:h-[75vh] md:flex-row">
        {/* List panel - left on desktop, below the map on mobile. */}
        <aside className="order-2 flex flex-col md:order-1 md:min-h-0 md:w-[38%] md:min-w-[300px] md:max-w-[440px]">
          {/* The scrolling stack of per-event cards, grouped by day. */}
          <div className="wg-scroll flex flex-col gap-2 md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-2">
            {days.map(day => (
              <section key={day.key} aria-label={day.label}>
                <div className="bg-[var(--bg)] pb-1.5 pt-1 md:sticky md:top-0 md:z-10">
                  <h2 className="font-display text-sm italic text-[var(--ink-dim)]">{day.label}</h2>
                  <div aria-hidden="true" className="mt-1 h-px w-10 bg-[var(--accent-deep)]" />
                </div>
                <div className="mt-1.5 flex flex-col gap-2">
                  {day.occs.map(o => {
                    const hue = categoryHue(o.e.category)
                    const v = o.e.venue
                    const k = venueKey(v)
                    const isFree = /^free/i.test((o.e.priceText ?? '').trim())
                    const ringOn = k !== null && selected === k && !venueFilter
                    return (
                      <article
                        key={`${o.e._id}-${o.occursAt}`}
                        onMouseEnter={() => k && setHovered(k)}
                        onMouseLeave={() => setHovered(null)}
                        className={`relative rounded-r-lg border-l-2 bg-[var(--surface)] px-4 py-3 ring-1 transition-colors ${
                          ringOn ? 'ring-[var(--accent)]' : 'ring-white/5'
                        } ${k ? 'cursor-pointer hover:bg-[var(--surface-2)]' : ''}`}
                        style={{ borderLeftColor: hue }}
                      >
                        {/* Stretched button: any click on the card surface pans the
                            map to this venue. Title + directions links sit above it
                            at z-10 and keep their own navigation. */}
                        {k && (
                          <button
                            type="button"
                            aria-label={`show ${v!.name} on the map`}
                            onClick={() => showOnMap(k)}
                            className="absolute inset-0 z-0 cursor-pointer rounded-r-lg"
                          />
                        )}
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-semibold leading-snug">
                            <Link href={`/events/${o.e.slug}`} className="relative z-10 hover:text-[var(--accent)]">
                              {o.e.title}
                            </Link>
                          </h3>
                          {o.e.category && (
                            <span className="shrink-0 text-[11px] tracking-[0.14em]" style={{ color: hue }}>
                              {o.e.category}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 font-mono text-[13px] tabular-nums text-[var(--ink-dim)]">
                          {timeFmt.format(new Date(o.occursAt)).toLowerCase()}
                          {o.e.priceText && (
                            <>
                              {' · '}
                              <span className={isFree ? 'text-[var(--accent)]' : undefined}>
                                {o.e.priceText.toLowerCase()}
                              </span>
                            </>
                          )}
                          {o.e.recurrence?.frequency && <> · repeats {o.e.recurrence.frequency}</>}
                        </p>
                        <div className="mt-2 flex items-baseline justify-between gap-3">
                          <p
                            className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em]"
                            style={{ color: v ? hue : 'var(--ink-dim)' }}
                          >
                            <PinGlyph />
                            <span className="truncate">{v?.name ?? 'venue tba'}</span>
                            {v?.neighborhood && (
                              <span className="shrink-0 font-normal normal-case tracking-normal text-[var(--ink-dim)]">
                                · {v.neighborhood.toLowerCase()}
                              </span>
                            )}
                            {v && !k && (
                              <span className="shrink-0 font-normal normal-case italic tracking-normal text-[var(--ink-dim)]">
                                · not on the map yet
                              </span>
                            )}
                          </p>
                          {v && k && (
                            <a
                              href={directionsUrl(v.lat!, v.lng!)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-gold relative z-10 shrink-0 text-xs max-md:inline-block max-md:py-1.5"
                            >
                              directions →
                            </a>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}

            {listed.length === 0 && (
              <div className="border-y border-dotted border-[var(--accent)]/40 py-5 font-display italic leading-relaxed text-[var(--ink-dim)]">
                {venueFilter ? (
                  <>
                    nothing at {venueFilter.name.toLowerCase()} in this window.{' '}
                    <button type="button" onClick={clearVenue} className="link-gold">
                      see everywhere
                    </button>
                  </>
                ) : range !== 'month' ? (
                  <>
                    quiet on that front. the Gump&apos;s not asleep, though.{' '}
                    <button type="button" onClick={() => setRange('month')} className="link-gold">
                      try the next 30 days
                    </button>
                    .
                  </>
                ) : (
                  <>nothing on the books for the next month. check back Thursday.</>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Map - top on mobile, right on desktop. z-0 keeps leaflet panes under
            the sticky pill bar. */}
        <div className="relative z-0 order-1 md:order-2 md:min-w-0 md:flex-1">
          <MapContainer
            ref={mapRef}
            center={[32.3771, -86.3]}
            zoom={12}
            className="h-[55vh] w-full rounded-lg md:h-full"
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {venues.map(g => {
              // The popup is the one place venue-grouping is natural: a compact
              // per-event digest (deduped - a weekly event shows once with its
              // next date, not four times).
              const seen = new Map<string, Occ>()
              for (const o of g.occs) if (!seen.has(o.e._id)) seen.set(o.e._id, o)
              const digest = [...seen.values()]
              return (
                <Marker
                  key={g.key}
                  position={[g.lat, g.lng]}
                  icon={pinFor(g.hue, g.occs.length, pinState(g.key))}
                  ref={el => {
                    markerRefs.current[g.key] = el
                  }}
                  eventHandlers={{ click: () => filterToVenue(g) }}
                >
                  <Popup>
                    <div className="wg-popup">
                      <strong>{g.name}</strong>
                      {g.neighborhood && <span className="wg-popup-hood">{g.neighborhood}</span>}
                      <ul>
                        {digest.slice(0, 4).map(o => (
                          <li key={o.e._id}>
                            <Link href={`/events/${o.e.slug}`}>{o.e.title}</Link>
                            <span className="wg-popup-when">
                              {popupWhenFmt.format(new Date(o.occursAt)).toLowerCase()}
                              {o.e.recurrence?.frequency && ` · ${o.e.recurrence.frequency}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {digest.length > 4 && <span className="wg-popup-more">+ {digest.length - 4} more · see the list</span>}
                      <a href={directionsUrl(g.lat, g.lng)} target="_blank" rel="noopener noreferrer">
                        directions →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}

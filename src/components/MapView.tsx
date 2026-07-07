'use client'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { divIcon, type Map as LeafletMap, type Marker as LeafletMarker } from 'leaflet'
import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { EventDoc } from '@/lib/sanity/queries'
import { formatEventDateTime } from '@/lib/events/format'
import { categoryHue } from '@/lib/events/categoryHue'

// One pin per venue: same-venue events would otherwise stack invisibly on top
// of each other. A group carries the venue's coords + every event held there.
type VenueGroup = {
  key: string
  lat: number
  lng: number
  name: string
  neighborhood?: string
  hue: string
  events: EventDoc[]
}

const directionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

// Recurring events show the recurrence note (or frequency) instead of a stale
// single date. Falls back to the actual date/time for one-off events.
function eventWhen(e: EventDoc): string {
  if (e.recurrence?.note) return e.recurrence.note
  if (e.recurrence?.frequency) return `repeats ${e.recurrence.frequency}`
  return formatEventDateTime(e.startDateTime)
}

// Gold dot inside a category-hue ring — same colour language as the cards.
// iconSize stays fixed so selecting never re-anchors the pin; the visual
// weight change is done in CSS (.wg-pin--on).
const pinFor = (hue: string, selected: boolean) =>
  divIcon({
    className: '',
    html: `<div class="wg-pin${selected ? ' wg-pin--on' : ''}" style="--pin-hue:${hue}"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })

export default function MapView({ events }: { events: EventDoc[] }) {
  const groups = useMemo<VenueGroup[]>(() => {
    const byVenue = new Map<string, VenueGroup>()
    for (const e of events) {
      const v = e.venue
      if (v?.lat == null || v?.lng == null) continue
      const key = v._id ?? `${v.lat},${v.lng}`
      const existing = byVenue.get(key)
      if (existing) existing.events.push(e)
      else
        byVenue.set(key, {
          key,
          lat: v.lat,
          lng: v.lng,
          name: v.name,
          neighborhood: v.neighborhood,
          hue: categoryHue(e.category),
          events: [e],
        })
    }
    return [...byVenue.values()]
  }, [events])

  const [selected, setSelected] = useState<string | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRefs = useRef<Record<string, LeafletMarker | null>>({})
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Card → map: fly to the venue and open its popup.
  const selectFromCard = (g: VenueGroup) => {
    setSelected(g.key)
    mapRef.current?.flyTo([g.lat, g.lng], 15, { duration: 0.6 })
    markerRefs.current[g.key]?.openPopup()
  }

  // Pin → card: highlight and scroll the matching card into view.
  const selectFromPin = (g: VenueGroup) => {
    setSelected(g.key)
    cardRefs.current[g.key]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div className="flex flex-col gap-4 md:h-[75vh] md:flex-row">
      {/* Side panel of event cards — left on desktop, below map on mobile. */}
      <aside className="order-2 flex flex-col md:order-1 md:w-1/3 md:min-w-[280px]">
        <p className="mb-3 shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-dim)]">
          {groups.length} {groups.length === 1 ? 'spot' : 'spots'} on the map
        </p>
        <div className="flex flex-col gap-2 md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-1">
          {groups.map(g => {
            const on = selected === g.key
            return (
              <div
                key={g.key}
                ref={el => {
                  cardRefs.current[g.key] = el
                }}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                onClick={() => selectFromCard(g)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    selectFromCard(g)
                  }
                }}
                className={`cursor-pointer rounded-r-lg border-l-2 bg-[var(--surface)] px-4 py-3 ring-1 transition-colors hover:bg-[var(--surface-2)] ${
                  on ? 'ring-2 ring-[var(--accent)]' : 'ring-white/5'
                }`}
                style={{ borderLeftColor: g.hue }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em]">{g.name}</h3>
                  {g.neighborhood && (
                    <span className="shrink-0 text-[11px] text-[var(--ink-dim)]">{g.neighborhood}</span>
                  )}
                </div>
                <ul className="mt-2 flex flex-col gap-2">
                  {g.events.map(e => (
                    <li key={e._id}>
                      <Link
                        href={`/events/${e.slug}`}
                        onClick={ev => ev.stopPropagation()}
                        className="font-medium leading-snug hover:text-[var(--accent)]"
                      >
                        {e.title}
                      </Link>
                      <p className="font-mono text-[12px] tabular-nums text-[var(--ink-dim)]">{eventWhen(e)}</p>
                    </li>
                  ))}
                </ul>
                <a
                  href={directionsUrl(g.lat, g.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={ev => ev.stopPropagation()}
                  className="link-gold mt-2 inline-block text-xs"
                >
                  directions →
                </a>
              </div>
            )
          })}
        </div>
      </aside>

      {/* Map — top on mobile, right on desktop. */}
      <div className="order-1 md:order-2 md:min-w-0 md:flex-1">
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
          {groups.map(g => (
            <Marker
              key={g.key}
              position={[g.lat, g.lng]}
              icon={pinFor(g.hue, selected === g.key)}
              ref={el => {
                markerRefs.current[g.key] = el
              }}
              eventHandlers={{ click: () => selectFromPin(g) }}
            >
              <Popup>
                <div className="wg-popup">
                  <strong>{g.name}</strong>
                  <ul>
                    {g.events.map(e => (
                      <li key={e._id}>
                        <Link href={`/events/${e.slug}`}>{e.title}</Link>
                        <span className="wg-popup-when">{eventWhen(e)}</span>
                      </li>
                    ))}
                  </ul>
                  <a href={directionsUrl(g.lat, g.lng)} target="_blank" rel="noopener noreferrer">
                    directions →
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

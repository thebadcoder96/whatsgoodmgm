'use client'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { divIcon } from 'leaflet'
import Link from 'next/link'
import type { EventDoc } from '@/lib/sanity/queries'
import { formatEventDateTime } from '@/lib/events/format'
import { categoryHue } from '@/lib/events/categoryHue'

// Gold dot, 2px ring in the event's category hue — same language as the cards.
const pinCache = new Map<string, ReturnType<typeof divIcon>>()
const pinFor = (category?: string) => {
  const hue = categoryHue(category)
  let icon = pinCache.get(hue)
  if (!icon) {
    icon = divIcon({ className: '', html: `<div style="width:14px;height:14px;border-radius:50%;background:#e0b64f;border:2px solid ${hue};box-shadow:0 0 0 1px #12100a"></div>`, iconSize: [14, 14] })
    pinCache.set(hue, icon)
  }
  return icon
}

export default function MapView({ events }: { events: EventDoc[] }) {
  return (
    <MapContainer center={[32.3771, -86.3]} zoom={12} className="h-[70vh] w-full rounded-lg" scrollWheelZoom>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
      {events.filter(e => e.venue?.lat && e.venue?.lng).map(e => (
        <Marker key={e._id} position={[e.venue!.lat!, e.venue!.lng!]} icon={pinFor(e.category)}>
          <Popup>
            <strong>{e.title}</strong><br />
            <span style={{ fontFamily: 'var(--font-plex-mono), monospace', fontSize: 12, color: 'var(--ink-dim)' }}>{formatEventDateTime(e.startDateTime)}</span><br />
            <Link href={`/events/${e.slug}`}>details →</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

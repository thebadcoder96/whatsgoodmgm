'use client'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { divIcon } from 'leaflet'
import Link from 'next/link'
import type { EventDoc } from '@/lib/sanity/queries'
import { formatEventDateTime } from '@/lib/events/format'

const pin = divIcon({ className: '', html: '<div style="width:14px;height:14px;border-radius:50%;background:#e0b64f;border:2px solid #12100a"></div>', iconSize: [14, 14] })

export default function MapView({ events }: { events: EventDoc[] }) {
  return (
    <MapContainer center={[32.3771, -86.3]} zoom={12} className="h-[70vh] w-full rounded-xl" scrollWheelZoom>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
      {events.filter(e => e.venue?.lat && e.venue?.lng).map(e => (
        <Marker key={e._id} position={[e.venue!.lat!, e.venue!.lng!]} icon={pin}>
          <Popup>
            <strong>{e.title}</strong><br />{formatEventDateTime(e.startDateTime)}<br />
            <Link href={`/events/${e.slug}`}>Details →</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

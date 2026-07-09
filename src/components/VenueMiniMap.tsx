'use client'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { useMemo } from 'react'

/**
 * A small, near-static locator map for a single venue on the event detail
 * page. One category-hue pin (the same .wg-pin the big map uses) over the
 * shared warm-dark tile filter. Interaction is switched off - this is a
 * "here's the spot" glance, not a tool: no drag, no wheel zoom, no controls.
 */
export default function VenueMiniMap({
  lat,
  lng,
  hue,
  name,
}: {
  lat: number
  lng: number
  hue: string
  name: string
}) {
  const icon = useMemo(
    () =>
      divIcon({
        className: '',
        html: `<div class="wg-pin" style="--pin-hue:${hue}"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    [hue],
  )

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      className="h-48 w-full rounded-lg ring-1 ring-white/5"
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[lat, lng]} icon={icon} title={name} />
    </MapContainer>
  )
}

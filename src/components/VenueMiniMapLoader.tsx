'use client'
import dynamic from 'next/dynamic'

// Leaflet touches `window`, so the map can only mount client-side. Same
// ssr:false dynamic-import pattern as MapViewLoader.
const VenueMiniMap = dynamic(() => import('@/components/VenueMiniMap'), { ssr: false })

export default function VenueMiniMapLoader(props: {
  lat: number
  lng: number
  hue: string
  name: string
}) {
  return <VenueMiniMap {...props} />
}

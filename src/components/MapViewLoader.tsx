'use client'
import dynamic from 'next/dynamic'
import type { EventDoc } from '@/lib/sanity/queries'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export default function MapViewLoader({ events }: { events: EventDoc[] }) {
  return <MapView events={events} />
}

import { EventsSurface, type SurfaceSearchParams } from '@/components/events/EventsSurface'

export const revalidate = 3600
export const metadata = { title: 'Calendar' }

export default async function CalendarPage({ searchParams }: { searchParams: Promise<SurfaceSearchParams> }) {
  return <EventsSurface view="month" searchParams={await searchParams} />
}

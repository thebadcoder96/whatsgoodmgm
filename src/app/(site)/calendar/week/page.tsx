import { EventsSurface, type SurfaceSearchParams } from '@/components/events/EventsSurface'

export const revalidate = 3600
export const metadata = { title: 'This week' }

export default async function CalendarWeekPage({ searchParams }: { searchParams: Promise<SurfaceSearchParams> }) {
  return <EventsSurface view="week" searchParams={await searchParams} />
}

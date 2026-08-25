export type SourceType =
  | 'eventbrite' | 'facebook' | 'ics' | 'reddit'
  | 'simpleview' | 'tribe' | 'statsapi' | 'civicplus' | 'website'

export type NormalizedEvent = {
  title: string
  startDateTime: string      // UTC ISO
  endDateTime?: string
  description?: string
  priceText?: string
  imageUrl?: string
  category?: string          // best-effort map to src/lib/events/categories ids; omit when unsure
  sourceType: SourceType
  sourceUrl: string
  venue?: { name: string; address?: string; lat?: number; lng?: number }
}

export type SourceDoc = { _id: string; name: string; platform: string; identifier: string; trusted?: boolean }

export interface Fetcher {
  platform: string
  fetchUpcoming(source: SourceDoc, windowDays: number): Promise<NormalizedEvent[]>
}

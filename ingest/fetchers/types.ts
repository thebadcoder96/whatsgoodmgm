export type NormalizedEvent = {
  title: string
  startDateTime: string      // UTC ISO
  endDateTime?: string
  description?: string
  priceText?: string
  imageUrl?: string
  sourceType: 'eventbrite' | 'facebook' | 'ics'
  sourceUrl: string
  venue?: { name: string; address?: string; lat?: number; lng?: number }
}

export type SourceDoc = { _id: string; name: string; platform: string; identifier: string }

export interface Fetcher {
  platform: string
  fetchUpcoming(source: SourceDoc, windowDays: number): Promise<NormalizedEvent[]>
}

import { groq } from 'next-sanity'

const EVENT_FIELDS = groq`
  _id, title, "slug": slug.current, startDateTime, endDateTime, category,
  description, priceText, imageUrl, sourceType, sourceUrl, additionalSourceUrls,
  featured, recurrence,
  venue->{ _id, name, address, neighborhood, lat, lng }
`

export const LATEST_WEEKLY_PICK = groq`
  *[_type == "weeklyPick" && defined(publishedAt)] | order(weekOf desc)[0]{
    _id, weekOf, headline, body, publishedAt,
    author->{ name, handle, avatarUrl },
    featuredEvents[]->{ ${EVENT_FIELDS} }
  }`

// Approved events that either start after $from, or recur (expanded in code)
export const UPCOMING_OR_RECURRING = groq`
  *[_type == "event" && status == "approved" &&
    (startDateTime >= $from || defined(recurrence.frequency))]{ ${EVENT_FIELDS} }`

export const EVENT_BY_SLUG = groq`
  *[_type == "event" && status == "approved" && slug.current == $slug][0]{ ${EVENT_FIELDS} }`

export const EVENTS_SEARCH = groq`
  *[_type == "event" && status == "approved" && title match $q + "*"]
    | order(startDateTime desc)[0...50]{ ${EVENT_FIELDS} }`

export const PAST_WEEKLY_PICKS = groq`
  *[_type == "weeklyPick" && defined(publishedAt)] | order(weekOf desc)[0...52]{
    _id, weekOf, headline, body, author->{ name } }`

export const PAST_EVENTS = groq`
  *[_type == "event" && status == "approved" && startDateTime < $now]
    | order(startDateTime desc)[0...100]{ ${EVENT_FIELDS} }`

export const CONTRIBUTORS = groq`*[_type == "contributor"]{ name, handle, role, bio, avatarUrl }`

export type VenueDoc = { _id: string; name: string; address?: string; neighborhood?: string; lat?: number; lng?: number }
export type EventDoc = {
  _id: string; title: string; slug: string; startDateTime: string; endDateTime?: string
  category: string; description?: string; priceText?: string; imageUrl?: string
  sourceType?: string; sourceUrl?: string; additionalSourceUrls?: string[]
  featured?: boolean; recurrence?: { frequency?: 'weekly' | 'biweekly' | 'monthly'; note?: string }
  venue?: VenueDoc
}

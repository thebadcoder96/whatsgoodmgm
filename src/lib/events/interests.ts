// Single source of truth for cross-cutting event "interests" tags.
// Categories answer "what IS this event" (one per event); interests answer
// "who is it FOR / what are you into" (many per event). Kept free of any
// `sanity` package import so it is safe in RSC/client bundles.
// `sanity/schemaTypes/event.ts` derives its checkbox list from INTERESTS.
//
// Tuned to Montgomery's actual event mix (bar trivia/karaoke/bingo, live
// music, museum art workshops, films at the Capri, library kids programs,
// fitness/run clubs, farmers markets, 250th/civic events, book talks,
// food pop-ups). Best-effort vocabulary the curator can refine over time.

export type Interest = { id: string; label: string }

export const INTERESTS = [
  { id: 'live-music', label: 'live music' },
  { id: 'games-and-trivia', label: 'games & trivia' },
  { id: 'art-and-making', label: 'art & making' },
  { id: 'film', label: 'film' },
  { id: 'food-and-drink', label: 'food & drink' },
  { id: 'kids', label: 'kids & family' },
  { id: 'fitness-and-outdoors', label: 'fitness & outdoors' },
  { id: 'books-and-talks', label: 'books & talks' },
  { id: 'history-and-civic', label: 'history & civic' },
  { id: 'markets', label: 'markets' },
  { id: 'dancing', label: 'dancing' },
  { id: 'free-stuff', label: 'free stuff' },
] as const satisfies readonly Interest[]

export type InterestId = (typeof INTERESTS)[number]['id']

export const INTEREST_IDS = INTERESTS.map(i => i.id) as InterestId[]

const LABEL_BY_ID = new Map<string, string>(INTERESTS.map(i => [i.id, i.label]))
export const interestLabel = (id: string): string => LABEL_BY_ID.get(id) ?? id

import type { Fetcher, NormalizedEvent, SourceDoc } from './types'
import { localDay } from '../lib/normalize'

const SCHEDULE_URL = 'https://www.milb.com/montgomery/schedule'
const EXCLUDED_STATES = ['Cancelled', 'Postponed']

export function mapBiscuitsGames(data: any): NormalizedEvent[] {
  const out: NormalizedEvent[] = []
  for (const day of data.dates ?? []) {
    for (const g of day.games ?? []) {
      try {
        // Biscuits-specific filter: a second statsapi source would need this home-team id
        // parameterized off source.identifier, else it silently returns zero events.
        if (g?.teams?.home?.team?.id !== 421) continue // home games only
        if (EXCLUDED_STATES.includes(g.status?.detailedState)) continue
        const awayName = g.teams?.away?.team?.name
        if (!g.gameDate || !awayName) {
          console.warn(`  SKIP malformed statsapi game: ${g?.gamePk ?? 'unknown'} (missing gameDate or away team name)`)
          continue
        }
        const venueName = g.venue?.name
        // Doubleheaders share day + opponent + venue; without a suffix, downstream fuzzy dedupe merges game 2 away.
        const gameSuffix = g.gameNumber > 1 ? ` (Game ${g.gameNumber})` : ''
        out.push({
          title: `Biscuits vs ${awayName}${gameSuffix}`,
          startDateTime: new Date(g.gameDate).toISOString(), // gameDate is already a UTC instant
          description: 'Montgomery Biscuits home game.',
          category: 'sports',
          sourceType: 'statsapi',
          sourceUrl: SCHEDULE_URL,
          // Venue name is dynamic from the API, but the street address assumes the Biscuits' home park.
          ...(venueName ? { venue: { name: venueName, address: '200 Coosa St, Montgomery, AL' } } : {}),
        })
      } catch (err) {
        console.warn(`  SKIP malformed statsapi game: ${g?.gamePk ?? 'unknown'} (${err instanceof Error ? err.message : err})`)
      }
    }
  }
  return out
}

export const statsapiFetcher: Fetcher = {
  platform: 'statsapi',
  async fetchUpcoming(source: SourceDoc, windowDays: number): Promise<NormalizedEvent[]> {
    // Montgomery-local days, not UTC slices — after ~6pm local the UTC date is already tomorrow.
    const today = localDay(new Date().toISOString())
    const end = localDay(new Date(Date.now() + windowDays * 86_400_000).toISOString())
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=12&teamId=${source.identifier}&startDate=${today}&endDate=${end}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`statsapi: HTTP ${res.status}`)
    return mapBiscuitsGames(await res.json())
  },
}

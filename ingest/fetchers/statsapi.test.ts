import { describe, it, expect, vi, afterEach } from 'vitest'
import { mapBiscuitsGames, statsapiFetcher } from './statsapi'
import fixture from './__fixtures__/statsapi-sample.json'

const allGames = (fixture as any).dates.flatMap((d: any) => d.games)
const homeGame = allGames.find((g: any) => g.teams.home.team.id === 421)
const awayGame = allGames.find((g: any) => g.teams.home.team.id !== 421)

describe('mapBiscuitsGames', () => {
  it('maps only home games, titled vs the opponent, at the home venue', () => {
    const events = mapBiscuitsGames(fixture as any)
    const homeCount = allGames.filter((g: any) => g.teams.home.team.id === 421).length
    expect(events).toHaveLength(homeCount)
    for (const ev of events) {
      expect(ev.title).toMatch(/^Biscuits vs /)
      // Live capture (2026-08-25) shows the Biscuits' home park under sponsor name "DABOS Park",
      // not the older "Riverwalk Stadium" name — reconciled with fixture reality, not fabricated.
      expect(ev.venue?.name).toBe('DABOS Park')
      expect(ev.sourceType).toBe('statsapi')
      expect(ev.startDateTime).toMatch(/Z$/)
    }
  })

  it('maps a fixture home game with exact title and UTC startDateTime', () => {
    const events = mapBiscuitsGames({ dates: [{ games: [homeGame] }] })
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Biscuits vs Pensacola Blue Wahoos')
    expect(events[0].startDateTime).toBe('2026-08-25T23:35:00.000Z')
  })

  it('excludes Cancelled and Postponed games', () => {
    const cancelled = { ...homeGame, status: { ...homeGame.status, detailedState: 'Cancelled' } }
    const postponed = { ...homeGame, status: { ...homeGame.status, detailedState: 'Postponed' } }
    const events = mapBiscuitsGames({ dates: [{ games: [cancelled, postponed] }] })
    expect(events).toHaveLength(0)
  })

  it('produces nothing for an away game', () => {
    const events = mapBiscuitsGames({ dates: [{ games: [awayGame] }] })
    expect(events).toHaveLength(0)
  })

  it('still emits a home game missing venue, with venue left undefined', () => {
    const events = mapBiscuitsGames({ dates: [{ games: [{ ...homeGame, venue: undefined }] }] })
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Biscuits vs Pensacola Blue Wahoos')
    expect(events[0].venue).toBeUndefined()
  })

  it('skips a malformed game without killing the batch', () => {
    const malformed = { teams: { home: { team: { id: 421 } } } } // missing gameDate, away team name
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const events = mapBiscuitsGames({ dates: [{ games: [malformed, homeGame] }] })
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Biscuits vs Pensacola Blue Wahoos')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('statsapiFetcher.fetchUpcoming', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('fetches the schedule and maps only home games', async () => {
    const fetchMock = vi.fn(async (_url: string) => ({ ok: true, json: async () => fixture }))
    vi.stubGlobal('fetch', fetchMock)
    const evs = await statsapiFetcher.fetchUpcoming(
      { _id: 'x', name: 'biscuits', platform: 'statsapi', identifier: '421' }, 60)
    expect(evs).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('teamId=421')
  })

  it('throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })))
    await expect(statsapiFetcher.fetchUpcoming(
      { _id: 'x', name: 'biscuits', platform: 'statsapi', identifier: '421' }, 60)).rejects.toThrow('HTTP 500')
  })
})

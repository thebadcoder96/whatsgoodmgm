import { describe, expect, it } from 'vitest'
import { writeEvents } from './writer'
import type { NormalizedEvent } from '../fetchers/types'

function stubClient(existing: unknown[] = []) {
  const calls = { created: [] as any[], patchedIds: [] as string[], appended: [] as any[] }
  const client = {
    fetch: async () => existing,
    create: async (doc: any) => { calls.created.push(doc); return { ...doc, _id: `real-${calls.created.length}` } },
    createIfNotExists: async (doc: any) => doc,
    patch: (id: string) => {
      calls.patchedIds.push(id)
      const p = { setIfMissing: () => p, append: (_k: string, v: any[]) => { calls.appended.push(v); return p }, commit: async () => ({}) }
      return p
    },
  }
  return { client: client as any, calls }
}

const ev = (over: Partial<NormalizedEvent>): NormalizedEvent => ({
  title: 'Jazz Night', startDateTime: '2026-07-10T23:00:00Z', sourceType: 'eventbrite',
  sourceUrl: 'https://eventbrite.com/e/1', venue: { name: 'The Alley' }, ...over,
})

describe('writeEvents in-batch dedup', () => {
  it('merges a same-batch duplicate into the REAL created document id', async () => {
    const { client, calls } = stubClient()
    const result = await writeEvents(client, [
      ev({}),
      ev({ title: 'Jazz Night at The Alley', sourceUrl: 'https://eventbrite.com/e/2' }),
    ], false)
    expect(result).toEqual({ created: 1, merged: 1, skipped: 0 })
    expect(calls.created).toHaveLength(1)
    expect(calls.patchedIds).toEqual(['real-1'])   // NOT 'new'
    expect(calls.appended).toEqual([['https://eventbrite.com/e/2']])
  })
  it('creates events as pending with likelyRecurring flag from approved history', async () => {
    const { client, calls } = stubClient([
      { _id: 'x1', title: 'Jazz Night', venueName: 'The Alley', startDateTime: '2026-07-03T23:00:00Z', status: 'approved' },
    ])
    await writeEvents(client, [ev({})], false)
    expect(calls.created[0].status).toBe('pending')
    expect(calls.created[0].likelyRecurring).toBe(true)
  })
  it('sanitizes non-ascii venue names into ascii document ids', async () => {
    const { client, calls } = stubClient()
    const captured: string[] = []
    ;(client as any).createIfNotExists = async (doc: any) => { captured.push(doc._id); return doc }
    await writeEvents(client, [ev({ venue: { name: 'Café Louise' } })], false)
    expect(calls.created).toHaveLength(1)
    expect(captured[0]).toBe('venue-caf-louise')
    expect(captured[0]).toMatch(/^[a-z0-9-]+$/)
  })
})

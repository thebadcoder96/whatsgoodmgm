'use server'
import { headers } from 'next/headers'
import { writeClient } from '@/lib/sanity/client'
import { allowRequest } from '@/lib/rateLimit'

export type SubmitState = { ok: boolean; message: string } | null

const SHORT_MAX = 200
const LONG_MAX = 2000

export async function submitEvent(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const short = (k: string) => (formData.get(k)?.toString().trim().slice(0, SHORT_MAX) || undefined)
  const long = (k: string) => (formData.get(k)?.toString().trim().slice(0, LONG_MAX) || undefined)
  const httpUrl = (k: string) => {
    const v = short(k)
    if (!v) return undefined
    try { return ['http:', 'https:'].includes(new URL(v).protocol) ? v : undefined } catch { return undefined }
  }

  const handle = short('handle'); const eventTitle = short('eventTitle')
  if (!handle && !eventTitle) return { ok: false, message: 'Give us at least a social handle or an event title.' }
  if (formData.get('website')?.toString()) return { ok: true, message: 'Thanks!' } // honeypot

  const h = await headers()
  const ip = (h.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  if (!allowRequest(`submit:${ip}`, 5, 60 * 60 * 1000)) {
    return { ok: false, message: 'Easy there — that\'s a lot of submissions. Try again in a bit.' }
  }

  await writeClient.create({
    _type: 'submission', status: 'new', createdAt: new Date().toISOString(),
    handle, platform: short('platform'), submitterEmail: short('submitterEmail'), note: long('note'),
    eventTitle, eventDate: short('eventDate'), eventVenueText: short('eventVenueText'),
    eventUrl: httpUrl('eventUrl'), eventDescription: long('eventDescription'),
  })
  return { ok: true, message: "Got it — we'll take a look. Thanks for making the Gump better." }
}

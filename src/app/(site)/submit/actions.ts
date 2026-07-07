'use server'
import { writeClient } from '@/lib/sanity/client'

export type SubmitState = { ok: boolean; message: string } | null

export async function submitEvent(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const get = (k: string) => (formData.get(k)?.toString().trim() || undefined)
  const handle = get('handle'); const eventTitle = get('eventTitle')
  if (!handle && !eventTitle) return { ok: false, message: 'Give us at least a social handle or an event title.' }
  if (get('website')) return { ok: true, message: 'Thanks!' } // honeypot: silently accept bots

  await writeClient.create({
    _type: 'submission', status: 'new', createdAt: new Date().toISOString(),
    handle, platform: get('platform'), submitterEmail: get('submitterEmail'), note: get('note'),
    eventTitle, eventDate: get('eventDate'), eventVenueText: get('eventVenueText'),
    eventUrl: get('eventUrl'), eventDescription: get('eventDescription'),
  })
  return { ok: true, message: "Got it — we'll take a look. Thanks for making the Gump better." }
}

'use client'
import { useActionState } from 'react'
import { submitEvent, type SubmitState } from './actions'

const field = 'w-full rounded-md border border-white/15 bg-[var(--surface)] px-3 py-2'

export default function SubmitPage() {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitEvent, null)
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-bold">Submit to WhatsGoodMGM</h1>
      <p className="mt-2 text-[var(--ink-dim)]">Tell us about an event, or give us your account to follow — Instagram, TikTok, or Facebook. A human reviews everything before it goes up.</p>
      {state && <p className={`mt-4 rounded-md p-3 ${state.ok ? 'bg-green-900/40' : 'bg-red-900/40'}`}>{state.message}</p>}
      <form action={action} className="mt-6 space-y-6">
        <fieldset className="space-y-3">
          <legend className="font-semibold">Your event (optional)</legend>
          <input name="eventTitle" placeholder="Event title" className={field} />
          <input name="eventDate" placeholder="When? e.g. Sat July 18, 7pm" className={field} />
          <input name="eventVenueText" placeholder="Where? venue or address" className={field} />
          <input name="eventUrl" type="url" placeholder="Link (tickets, FB event, flyer)" className={field} />
          <textarea name="eventDescription" placeholder="What's good about it?" rows={3} className={field} />
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="font-semibold">Your account (optional)</legend>
          <div className="flex gap-3">
            <input name="handle" placeholder="@yourhandle" className={field} />
            <select name="platform" className={field}>
              <option value="instagram">Instagram</option><option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option><option value="other">Other</option>
            </select>
          </div>
        </fieldset>
        <input name="submitterEmail" type="email" placeholder="Your email (optional, in case we have questions)" className={field} />
        <input name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button disabled={pending} className="rounded-md bg-[var(--accent)] px-4 py-2 font-medium text-[var(--accent-ink)] disabled:opacity-50">
          {pending ? 'Sending…' : 'Send it'}
        </button>
      </form>
    </div>
  )
}

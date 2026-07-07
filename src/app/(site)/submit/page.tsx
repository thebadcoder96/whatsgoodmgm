'use client'
import { useActionState } from 'react'
import { submitEvent, type SubmitState } from './actions'

const field = 'w-full rounded-md border border-white/10 bg-[var(--surface-2)] px-3 py-2 placeholder:text-[var(--ink-dim)]/70'

export default function SubmitPage() {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitEvent, null)
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">got something good?</h1>
      <p className="mt-3 leading-7 text-[var(--ink-dim)]">Tell us about an event, or give us your account to follow — Instagram, TikTok, or Facebook. A human reviews everything before it goes up.</p>
      {state && (
        <p className="mt-5 rounded-r-md border-l-2 bg-[var(--surface)] p-3 ring-1 ring-white/5"
          style={{ borderLeftColor: state.ok ? 'var(--hue-kudzu)' : 'var(--hue-brick)' }}>
          {state.message}
        </p>
      )}
      <form action={action} className="mt-8 space-y-8">
        <fieldset className="space-y-3">
          <legend className="mb-1 font-display font-semibold italic">your event (optional)</legend>
          <input name="eventTitle" placeholder="Event title" className={field} />
          <input name="eventDate" placeholder="When? e.g. Sat July 18, 7pm" className={field} />
          <input name="eventVenueText" placeholder="Where? venue or address" className={field} />
          <input name="eventUrl" type="url" placeholder="Link (tickets, FB event, flyer)" className={field} />
          <textarea name="eventDescription" placeholder="What's good about it?" rows={3} className={field} />
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="mb-1 font-display font-semibold italic">your account (optional)</legend>
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
        <button disabled={pending} className="rounded-full bg-[var(--accent)] px-5 py-2 font-medium text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent)]/90 disabled:opacity-50">
          {pending ? 'sending…' : 'send it'}
        </button>
      </form>
    </div>
  )
}

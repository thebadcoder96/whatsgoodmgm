const TZ = 'America/Chicago'

export function formatEventDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}

export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric',
  }).format(new Date(iso))
}


export function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
    .format(new Date(iso)).toLowerCase().replace(' ', '')
}

// Day keys are date-only (YYYY-MM-DD); anchor to noon UTC so the calendar
// date can't shift across timezones (same trick as formatWeekOf).
export function formatDayHeading(dayKey: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })
    .format(new Date(`${dayKey}T12:00:00Z`)).toLowerCase().replace(',', ' ·')
}

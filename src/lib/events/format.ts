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

// weekOf is a date-only string (YYYY-MM-DD) with no time component. Parsing it directly
// as `new Date(iso)` treats it as UTC midnight, which formats as the PREVIOUS day in
// America/Chicago. Anchor it to noon UTC so the calendar date can't shift across timezones.
export function formatWeekOf(dateOnly: string): string {
  return formatEventDate(`${dateOnly}T12:00:00Z`)
}

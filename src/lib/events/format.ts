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

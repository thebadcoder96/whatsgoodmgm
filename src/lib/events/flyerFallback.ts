// Fallback tile for a flyer whose source image no longer resolves (#4). The
// tile keeps the flyer's box, takes the event's category hue, and shows the
// title's first letter as the mark.
export function flyerInitial(title?: string): string {
  const first = (title ?? '').trim().charAt(0)
  return first ? first.toUpperCase() : '·'
}

export function flyerFallbackStyle(hue: string): { backgroundColor: string; color: string } {
  return {
    backgroundColor: `color-mix(in srgb, ${hue} 16%, var(--surface-2))`,
    color: hue,
  }
}

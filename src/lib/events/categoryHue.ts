// Category → hue token mapping. One place, so cards, detail pages, and map
// pins all agree. Values are CSS custom properties from globals.css — usable
// in inline styles anywhere in the document.
const HUES: Record<string, string> = {
  music: 'var(--hue-brick)',
  nightlife: 'var(--hue-brick)',
  food: 'var(--hue-kudzu)',
  family: 'var(--hue-kudzu)',
  community: 'var(--hue-kudzu)',
  arts: 'var(--hue-river)',
  education: 'var(--hue-river)',
  festival: 'var(--hue-river)',
  sports: 'var(--accent)',
  other: 'var(--accent)',
}

export function categoryHue(category?: string): string {
  return HUES[category ?? ''] ?? 'var(--accent)'
}

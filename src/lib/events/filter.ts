import type { EventDoc } from '@/lib/sanity/queries'

export type EventFilterParams = { category?: string; interest?: string; free?: boolean }

// free = free general admission, not "$8, kids free"
const FREE = /^free/i

export function matchesFilters(e: EventDoc, f: EventFilterParams): boolean {
  if (f.category && e.category !== f.category) return false
  if (f.interest && !e.interests?.includes(f.interest)) return false
  if (f.free && !FREE.test((e.priceText ?? '').trim())) return false
  return true
}

type Bucket = { times: number[] }

const buckets = new Map<string, Bucket>()

/**
 * Sliding-window in-memory limiter. Best-effort on serverless (per-instance),
 * sufficient at Montgomery scale as a first line against floods.
 */
export function allowRequest(key: string, limit: number, windowMs: number, now: number = Date.now()): boolean {
  const cutoff = now - windowMs
  let b = buckets.get(key)
  if (!b) { b = { times: [] }; buckets.set(key, b) }
  b.times = b.times.filter(t => t > cutoff)
  if (b.times.length >= limit) return false
  b.times.push(now)
  // opportunistic cleanup so the map can't grow unboundedly
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.times.every(t => t <= cutoff)) buckets.delete(k)
  }
  return true
}

import { client } from './client'

export async function sanityFetch<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  return client.fetch<T>(query, params, { next: { revalidate: 3600, tags: ['sanity'] } })
}

import { createClient } from 'next-sanity'
import { projectId, dataset, apiVersion } from '../../../sanity/env'

export const client = createClient({ projectId, dataset, apiVersion, useCdn: true })

export const writeClient = createClient({
  projectId, dataset, apiVersion, useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
})

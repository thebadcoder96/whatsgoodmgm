'use client'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { projectId, dataset } from './sanity/env'
import { schemaTypes } from './sanity/schemaTypes'
import { structure } from './sanity/structure'
import { ApproveAction } from './sanity/actions/approve'

export default defineConfig({
  name: 'whatsgoodmgm', title: 'WhatsGoodMGM',
  basePath: '/studio', projectId, dataset,
  plugins: [structureTool({ structure })],
  schema: { types: schemaTypes },
  document: {
    actions: (prev, ctx) => (ctx.schemaType === 'event' ? [ApproveAction, ...prev] : prev),
  },
})

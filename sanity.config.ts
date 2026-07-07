'use client'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { projectId, dataset, apiVersion } from './sanity/env'
import { schemaTypes } from './sanity/schemaTypes'
import { structure } from './sanity/structure'
import { ApproveAction } from './sanity/actions/approve'

export default defineConfig({
  name: 'whatsgoodmgm', title: 'WhatsGoodMGM',
  basePath: '/studio', projectId, dataset,
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],
  schema: { types: schemaTypes },
  document: {
    actions: (prev, ctx) => (ctx.schemaType === 'event' ? [ApproveAction, ...prev] : prev),
  },
})

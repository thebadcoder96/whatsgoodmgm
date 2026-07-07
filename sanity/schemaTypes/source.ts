import { defineField, defineType } from 'sanity'
export const source = defineType({
  name: 'source', title: 'Ingestion Source', type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'platform', type: 'string', validation: r => r.required(),
      options: { list: ['facebook','eventbrite','ics'] } }),
    defineField({ name: 'identifier', type: 'string', validation: r => r.required(),
      description: 'FB page id / Eventbrite organization id / ICS feed URL' }),
    defineField({ name: 'active', type: 'boolean', initialValue: true }),
    defineField({ name: 'lastPulled', type: 'datetime', readOnly: true }),
  ],
})

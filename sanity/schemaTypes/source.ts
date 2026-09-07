import { defineField, defineType } from 'sanity'
export const source = defineType({
  name: 'source', title: 'Ingestion Source', type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'platform', type: 'string', validation: r => r.required(),
      options: { list: ['facebook','eventbrite','ics','simpleview','tribe','statsapi','civicplus','reddit','website'] } }),
    defineField({ name: 'identifier', type: 'string', validation: r => r.required(),
      description: 'Base URL (simpleview/tribe), team id (statsapi), RSS URL (civicplus), FB page id, or feed URL' }),
    defineField({ name: 'homepage', type: 'url',
      description: 'Human-facing site to credit/link on the public sources list (not the API/feed URL)' }),
    defineField({ name: 'trusted', type: 'boolean', initialValue: false,
      description: 'Trusted sources auto-publish (approved); untrusted arrive pending' }),
    defineField({ name: 'active', type: 'boolean', initialValue: true }),
    defineField({ name: 'lastPulled', type: 'datetime', readOnly: true }),
  ],
})

import { defineField, defineType } from 'sanity'
import { CATEGORIES } from '@/lib/events/categories'
import { INTERESTS } from '@/lib/events/interests'

export { CATEGORIES }

export const event = defineType({
  name: 'event', title: 'Event', type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: r => r.required() }),
    defineField({
      name: 'slug', type: 'slug', validation: r => r.required(),
      options: { source: (doc: any) => `${doc.title ?? ''} ${(doc.startDateTime ?? '').slice(0, 10)}` },
    }),
    defineField({ name: 'startDateTime', type: 'datetime', validation: r => r.required() }),
    defineField({ name: 'endDateTime', type: 'datetime' }),
    defineField({ name: 'venue', type: 'reference', to: [{ type: 'venue' }] }),
    defineField({ name: 'category', type: 'string', options: { list: CATEGORIES }, initialValue: 'other' }),
    defineField({ name: 'description', type: 'text' }),
    defineField({ name: 'priceText', type: 'string', description: 'e.g. "Free", "$10", "$15-25"' }),
    defineField({ name: 'imageUrl', type: 'url', description: 'Flyer / promo image' }),
    defineField({ name: 'sourceType', type: 'string', initialValue: 'manual',
      options: { list: ['facebook','eventbrite','manual','reddit','submission','ics'] } }),
    defineField({ name: 'sourceUrl', type: 'url', description: 'Deep link back to origin — always credit the source' }),
    defineField({ name: 'additionalSourceUrls', type: 'array', of: [{ type: 'url' }] }),
    defineField({ name: 'status', type: 'string', initialValue: 'approved',
      options: { list: ['pending','approved','rejected'], layout: 'radio' },
      description: 'Studio-created events default to approved; ingested/submitted arrive pending' }),
    defineField({ name: 'featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'recurrence', type: 'object', fields: [
      defineField({ name: 'frequency', type: 'string', options: { list: ['weekly','biweekly','monthly'] } }),
      defineField({ name: 'note', type: 'string', description: 'e.g. "Every Tuesday, rain or shine"' }),
    ]}),
    defineField({ name: 'likelyRecurring', type: 'boolean', initialValue: false, readOnly: true,
      description: 'Set by ingestion when title+venue matches an already-approved event' }),
    defineField({ name: 'interests', type: 'array', of: [{ type: 'string' }],
      description: 'Cross-cutting tags: who it’s for / what you’re into. Auto-tagged best-effort; refine freely.',
      options: { list: INTERESTS.map(i => ({ title: i.label, value: i.id })), layout: 'grid' } }),
    defineField({ name: 'ageRange', type: 'string', hidden: true }),                            // p2
    defineField({ name: 'dedupeKey', type: 'string', readOnly: true }),
    defineField({ name: 'curatedBy', type: 'reference', to: [{ type: 'contributor' }] }),
  ],
  preview: {
    select: { title: 'title', date: 'startDateTime', status: 'status' },
    prepare: ({ title, date, status }) => ({
      title,
      subtitle: `${status !== 'approved' ? `${status.toUpperCase()} · ` : ''}${date?.slice(0, 16).replace('T', ' ') ?? ''}`,
    }),
  },
})

import { defineField, defineType } from 'sanity'

export const submission = defineType({
  name: 'submission', title: 'Submission', type: 'document',
  fields: [
    defineField({ name: 'handle', type: 'string', description: '@something (optional if submitting an event)' }),
    defineField({ name: 'platform', type: 'string', options: { list: ['instagram','tiktok','facebook','other'] } }),
    defineField({ name: 'submitterEmail', type: 'string' }),
    defineField({ name: 'note', type: 'text' }),
    // Structured event fields — a submission can be an account, an event, or both
    defineField({ name: 'eventTitle', type: 'string' }),
    defineField({ name: 'eventDate', type: 'string', description: 'As typed by submitter — verify before promoting' }),
    defineField({ name: 'eventVenueText', type: 'string' }),
    defineField({ name: 'eventUrl', type: 'url' }),
    defineField({ name: 'eventDescription', type: 'text' }),
    defineField({ name: 'status', type: 'string', initialValue: 'new',
      options: { list: ['new','reviewed','added','ignored'], layout: 'radio' } }),
    defineField({ name: 'createdAt', type: 'datetime' }),
  ],
  preview: { select: { title: 'eventTitle', handle: 'handle', subtitle: 'status' },
    prepare: ({ title, handle, subtitle }) => ({ title: title || handle || 'Submission', subtitle }) },
})

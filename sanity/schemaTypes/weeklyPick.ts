import { defineField, defineType } from 'sanity'

export const weeklyPick = defineType({
  name: 'weeklyPick', title: 'Weekly Pick', type: 'document',
  fields: [
    defineField({ name: 'weekOf', type: 'date', validation: r => r.required(), description: 'The Thursday it publishes' }),
    defineField({ name: 'headline', type: 'string', validation: r => r.required(),
      initialValue: "What's good this weekend, Gump?" }),
    defineField({ name: 'body', type: 'array', of: [{ type: 'block' }], description: "The curator's voice — short editorial" }),
    defineField({ name: 'featuredEvents', type: 'array', of: [{ type: 'reference', to: [{ type: 'event' }] }] }),
    defineField({ name: 'author', type: 'reference', to: [{ type: 'contributor' }] }),
    defineField({ name: 'publishedAt', type: 'datetime' }),
  ],
  preview: { select: { title: 'headline', subtitle: 'weekOf' } },
})

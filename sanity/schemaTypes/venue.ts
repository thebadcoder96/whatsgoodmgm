import { defineField, defineType } from 'sanity'

export const venue = defineType({
  name: 'venue', title: 'Venue', type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'name' } }),
    defineField({ name: 'address', type: 'string' }),
    defineField({ name: 'neighborhood', type: 'string' }),
    defineField({ name: 'lat', type: 'number' }),
    defineField({ name: 'lng', type: 'number' }),
  ],
})

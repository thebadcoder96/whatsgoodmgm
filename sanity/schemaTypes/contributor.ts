import { defineField, defineType } from 'sanity'
export const contributor = defineType({
  name: 'contributor', title: 'Contributor', type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'handle', type: 'string' }),
    defineField({ name: 'role', type: 'string', options: { list: ['curator','founder','volunteer'] } }),
    defineField({ name: 'bio', type: 'text' }),
    defineField({ name: 'avatarUrl', type: 'url' }),
  ],
})

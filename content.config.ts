import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    news: defineCollection({
      type: 'page',
      source: 'news/*.md',
      schema: z.object({
        title: z.string(),
        date: z.string(), // ISO date, e.g. "2026-08-10"
        excerpt: z.string().optional(),
        author: z.string().optional(),
      }),
    }),
  },
})

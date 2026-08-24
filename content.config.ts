import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    news: defineCollection({
      type: 'page',
      source: 'news/*.md',
      schema: z.object({
        title: z.string(),
        date: z.string(), // ISO date, e.g. "2026-08-10"
        // NOT `excerpt`: that name is reserved by @nuxt/content (it's filled
        // from the content above a <!--more--> marker) and silently overwrites
        // whatever the frontmatter sets, leaving it null.
        summary: z.string().optional(),
        author: z.string().optional(),
      }),
    }),
  },
})

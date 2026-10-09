// Runs server-side, cached, with a hard timeout: the fetch lives in
// server/utils/newsData.ts.
export type { NewsCollectionItem } from '@nuxt/content'

export default defineEventHandler(async (event) => {
  try {
    return await fetchNewsList(event)
  }
  catch {
    throw createError({ statusCode: 503, statusMessage: 'Could not load news' })
  }
})

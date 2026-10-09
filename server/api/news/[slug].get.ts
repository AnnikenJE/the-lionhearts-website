// Runs server-side, cached, with a hard timeout: the fetch lives in
// server/utils/newsData.ts.
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  let post
  try {
    post = await fetchNewsPost(event, `/news/${slug}`)
  }
  catch {
    throw createError({ statusCode: 503, statusMessage: 'Could not load this post' })
  }

  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  return post
})

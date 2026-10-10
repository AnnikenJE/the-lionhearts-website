import type { H3Event } from 'h3'
import { queryCollection } from '@nuxt/content/server'

// queryCollection() reads the @nuxt/content D1 binding in production. D1 has hung
// outright on some requests there (no response at all, not just a slow one), and this
// was previously awaited straight from the pages during SSR, so a hung query stalled
// the whole page forever. CONTENT_TIMEOUT_MS turns a hang into a fast failure instead,
// and caching the result (defineCache) means most requests never reach D1 at all.
const CONTENT_TIMEOUT_MS = 4000

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('content query timed out')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })

// The list is shared through KV (see SHARED_CACHES), which outlives a deploy, while the
// posts themselves only change with one. So it is keyed by the build: a deploy (or a
// preview build) starts its own list rather than serving the last deploy's, and within
// one build it can be kept a day, which keeps KV writes to a handful.
export const fetchNewsList = defineCache(
  (event: H3Event) =>
    withTimeout(queryCollection(event, 'news').order('date', 'DESC').all(), CONTENT_TIMEOUT_MS),
  { name: 'news-list', getKey: () => useRuntimeConfig().app.buildId, maxAge: 24 * 60 * 60 },
)

export const fetchNewsPost = defineCache(
  (event: H3Event, path: string) =>
    withTimeout(queryCollection(event, 'news').path(path).first(), CONTENT_TIMEOUT_MS),
  { name: 'news-post', getKey: (path: string) => path, maxAge: 300 },
)

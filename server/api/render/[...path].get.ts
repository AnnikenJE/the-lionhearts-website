// A character's full-body render, fetched from Blizzard's image server and passed on
// with a cache header (see routeRules in nuxt.config.ts). Blizzard's server sends none,
// so without this every visit would download the 500 KB image again. Only render paths
// are accepted, so this can never be used to fetch anything else.
import { isRenderPath, renderSource } from '../../utils/character'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') ?? ''
  if (!isRenderPath(path)) throw createError({ statusCode: 404, statusMessage: 'Render not found' })

  const response = await fetch(renderSource(path), { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) })
    .catch(() => null)
  if (!response?.ok || !response.body) {
    throw createError({
      statusCode: response?.status === 404 ? 404 : 502,
      statusMessage: 'Could not fetch the render',
    })
  }

  // Streamed through rather than read into memory first, so a Worker spends next to no
  // CPU time on an image this size.
  setResponseHeader(event, 'content-type', 'image/png')
  return response.body
})

// A character's full-body render, fetched from Blizzard's image server and passed on
// with a cache header (see routeRules in nuxt.config.ts). Blizzard's server sends none,
// so without this every visit would download the 500 KB image again. Only render paths
// are accepted, so this can never be used to fetch anything else.
import { isRenderPath, renderSource } from '../../utils/character'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') ?? ''
  if (!isRenderPath(path)) throw createError({ statusCode: 404, statusMessage: 'Render not found' })

  const image = await $fetch<ArrayBuffer>(renderSource(path), {
    responseType: 'arrayBuffer',
    timeout: UPSTREAM_TIMEOUT_MS,
  }).catch((error) => {
    throw createError({
      statusCode: (error as { statusCode?: number }).statusCode === 404 ? 404 : 502,
      statusMessage: 'Could not fetch the render',
    })
  })

  setResponseHeader(event, 'content-type', 'image/png')
  return new Uint8Array(image)
})

// Mounts the cache on memoryOverKv (server/utils/cacheDriver.ts) in production, so every
// Cloudflare instance shares one cache that also survives deploys.
export default defineNitroPlugin(async () => {
  // Dev keeps Nuxt's own file-backed cache under .nuxt/cache.
  if (import.meta.dev) return

  const storage = useStorage()
  await storage.unmount('cache', false)
  storage.mount('cache', memoryOverKv({}))
})

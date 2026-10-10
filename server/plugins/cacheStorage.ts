// Mounts the cache on memoryOverKv (server/utils/cacheDriver.ts) in production, so every
// Cloudflare instance shares the Warcraft Logs caches, and they survive deploys. Safe
// with defineCache (server/utils/cache.ts), whose background refreshes no request ever
// waits on; Nitro's own cached functions hung requests on Cloudflare once entries
// started arriving stale from KV.
export default defineNitroPlugin(async () => {
  // Dev keeps Nuxt's own file-backed cache under .nuxt/cache.
  if (import.meta.dev) return

  const storage = useStorage()
  await storage.unmount('cache', false)
  storage.mount('cache', memoryOverKv({ writes: useRuntimeConfig().cacheKvWrites }))
})

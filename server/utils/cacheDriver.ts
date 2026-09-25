// Nitro's cache lives in memory, and on Cloudflare every instance has its own memory
// that starts empty and is wiped on every deploy. Each cold instance then fetches the
// same raid tiers and characters again, which is most of the Warcraft Logs budget.
//
// memoryOverKv is memory backed by Workers KV: a read tries the instance's memory, then
// KV (shared by every instance and kept across deploys); a
// write goes to both. Without a KV binding named CACHE it is plain memory, as before,
// and a KV error only costs the shared copy, never the page.
import { defineDriver } from 'unstorage'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'
import memoryDriver from 'unstorage/drivers/memory'

/** The Cloudflare Pages binding the KV namespace is attached as. */
const BINDING = 'CACHE'

/**
 * How long KV keeps an entry. Nitro decides freshness itself (maxAge, validate); this
 * only stops entries nobody reads any more, such as those of an old deploy's cache
 * keys, from piling up. Longer than the longest maxAge, a finished tier's week.
 */
const KV_TTL_SECONDS = 8 * 24 * 60 * 60

// A KV error must never fail the request: the entry just is not shared.
const attempt = async <T>(run: () => T | Promise<T>, fallback: T): Promise<T> => {
  try {
    return await run()
  }
  catch (error) {
    console.error('[cache] KV failed', error)
    return fallback
  }
}

export const memoryOverKv = defineDriver(() => {
  const memory = memoryDriver()
  const kv = cloudflareKVBindingDriver({ binding: BINDING })
  // Cloudflare hands the bindings over per request, as globalThis.__env__.
  const hasKv = () => !!(globalThis as { __env__?: Record<string, unknown> }).__env__?.[BINDING]

  return {
    name: 'memory-over-kv',
    async hasItem(key) {
      return (await memory.hasItem(key, {})) || (hasKv() && await attempt(() => kv.hasItem(key, {}), false))
    },
    async getItem(key) {
      const local = await memory.getItem(key, {})
      if (local != null || !hasKv()) return local
      const shared = await attempt(() => kv.getItem(key, {}), null)
      if (shared != null) await memory.setItem!(key, shared as string, {})
      return shared
    },
    async setItem(key, value) {
      await memory.setItem!(key, value, {})
      if (hasKv()) await attempt(() => kv.setItem!(key, value, { ttl: KV_TTL_SECONDS }), undefined)
    },
    async removeItem(key) {
      await memory.removeItem!(key, {})
      if (hasKv()) await attempt(() => kv.removeItem!(key, {}), undefined)
    },
    getKeys: base => memory.getKeys(base, {}),
    clear: base => memory.clear!(base, {}),
  }
})


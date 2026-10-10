// Nitro's cache lives in memory, and on Cloudflare every instance has its own memory
// that starts empty and is wiped on every deploy. Each cold instance then fetches the
// same raid tiers and characters again, which is most of the Warcraft Logs budget.
//
// memoryOverKv is memory backed by Workers KV for the Warcraft Logs caches (see
// SHARED_CACHES): a read tries the instance's memory, then KV (shared by every instance and kept across deploys); a
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

/**
 * The caches worth sharing: the ones filled from Warcraft Logs, whose hourly budget is
 * what the shared cache protects. KV's free tier allows 1000 writes a day, and Raider.IO
 * data (the roster, character profiles, upgrade tracks) costs nothing to fetch again, so
 * it stays in memory and leaves the writes to these. The news list is shared too: in
 * memory alone every new instance asks D1, which has been slow enough to hold up the
 * landing page, and it is one key refreshed at most every five minutes. Single posts
 * are not: their key comes from the URL, so any made-up slug would spend a write.
 */
const SHARED_CACHES = new Set(['raids', 'raids-past', 'raid', 'character', 'news-list'])

/** Nitro's cache keys read "nitro:functions:<cache name>:<key>.json". */
export const isShared = (key: string) => SHARED_CACHES.has(key.split(':')[2] ?? '')

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

/**
 * How long an instance trusts its own copy of a shared entry before looking at KV
 * again. Without this, an instance holding an old copy would never see the fresh one
 * another instance wrote, and would refresh it itself: one Warcraft Logs load and one
 * KV write per warm instance instead of one in all. KV reads are plentiful (100,000 a
 * day on the free plan); the writes are what is scarce.
 */
export const KV_RECHECK_MS = 60 * 1000

/** When a stored entry was made: CacheEntry's mtime, as an object or as KV's JSON. */
const mtimeOf = (value: unknown): number => {
  try {
    const entry = typeof value === 'string' ? JSON.parse(value) : value
    return typeof entry?.mtime === 'number' ? entry.mtime : 0
  }
  catch {
    return 0
  }
}

export const memoryOverKv = defineDriver((options: { writes?: boolean, now?: () => number } = {}) => {
  const now = options.now ?? Date.now
  const memory = memoryDriver()
  // When each shared key was last taken from, or checked against, KV.
  const checked = new Map<string, number>()
  const kv = cloudflareKVBindingDriver({ binding: BINDING })
  // Cloudflare hands the bindings over per request, as globalThis.__env__.
  const hasKv = () => !!(globalThis as { __env__?: Record<string, unknown> }).__env__?.[BINDING]
  const useKv = (key: string) => isShared(key) && hasKv()
  // Writes only where asked for (production); elsewhere KV is read-only.
  const writeKv = (key: string) => options.writes === true && useKv(key)

  return {
    name: 'memory-over-kv',
    async hasItem(key) {
      return (await memory.hasItem(key, {})) || (useKv(key) && await attempt(() => kv.hasItem(key, {}), false))
    },
    async getItem(key) {
      const local = await memory.getItem(key, {})
      if (!useKv(key)) return local
      if (local != null && now() - (checked.get(key) ?? 0) < KV_RECHECK_MS) return local
      // Either this instance has no copy, or it has not looked at KV for a while. KV's
      // copy wins only if it is newer: in a preview, which never writes KV, or after a
      // failed write, this instance's own copy can be the newer one.
      const shared = await attempt(() => kv.getItem(key, {}), null)
      checked.set(key, now())
      if (shared == null || (local != null && mtimeOf(shared) <= mtimeOf(local))) return local
      await memory.setItem!(key, shared as string, {})
      return shared
    },
    async setItem(key, value) {
      checked.set(key, now())
      await memory.setItem!(key, value, {})
      if (writeKv(key)) await attempt(() => kv.setItem!(key, value, { ttl: KV_TTL_SECONDS }), undefined)
    },
    async removeItem(key) {
      await memory.removeItem!(key, {})
      if (writeKv(key)) await attempt(() => kv.removeItem!(key, {}), undefined)
    },
    getKeys: base => memory.getKeys(base, {}),
    clear: base => memory.clear!(base, {}),
  }
})


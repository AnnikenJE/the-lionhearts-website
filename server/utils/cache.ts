// The site's own cached function, used instead of Nitro's defineCachedFunction.
//
// Nitro's version shares one in-flight promise per key across requests and refreshes
// stale entries in the background. On Cloudflare, background work and the work of a
// cancelled request can be dropped, and then that shared promise never settles: every
// later request for the key waits on it for as long as the instance lives. With the
// cache shared through KV, entries were often stale on arrival, and pages hung.
//
// This one does the plainest thing instead: read, and if the entry is fresh return it;
// otherwise load inside the request that asked and store the result. Nothing is shared
// between requests but the stored entry, so nothing can hang. Two requests missing the
// same key at the same moment both load it, which at this site's traffic is rare.
import type { Storage } from 'unstorage'

export interface CacheEntry<T> {
  value: T
  /** When it was stored, epoch milliseconds. */
  mtime: number
  /** The code that produced it; see codeVersion. */
  version: string
}

export interface CacheOptions<T> {
  /** How long an entry is fresh, in seconds. */
  maxAge: number
  /** A further check an entry must pass to be fresh, and a new value to be stored. */
  validate?: (entry: { value: T, mtime: number }) => boolean
}

/**
 * A short hash of the loader's source. The cache outlives a deploy (KV), so an entry
 * written by older code, perhaps in an older shape, must not be served by newer code.
 */
export const codeVersion = (source: string) => {
  let hash = 5381
  for (let i = 0; i < source.length; i++) hash = (hash * 33) ^ source.charCodeAt(i)
  return (hash >>> 0).toString(36)
}

/**
 * Returns the stored value for `key` while it is fresh, otherwise loads, stores and
 * returns a new one. If loading fails and an older value is stored, that is served
 * instead: a slightly old page beats an error. Storage errors never fail the request.
 */
export const readThrough = async <T>(
  storage: Storage,
  key: string,
  load: () => Promise<T>,
  { maxAge, validate }: CacheOptions<T>,
  version: string,
  now = Date.now,
): Promise<T> => {
  const stored = await storage.getItem<CacheEntry<T>>(key).catch(() => null)
  const usable = stored && stored.version === version ? stored : null

  if (usable && now() - usable.mtime < maxAge * 1000 && (validate?.(usable) ?? true)) {
    return usable.value
  }

  let value: T
  try {
    value = await load()
  }
  catch (error) {
    if (usable) return usable.value
    throw error
  }

  const entry: CacheEntry<T> = { value, mtime: now(), version }
  if (validate?.(entry) ?? true) {
    await storage.setItem(key, entry).catch(error => console.error('[cache] write failed', key, error))
  }
  return value
}

/**
 * A cached function, stored under the "cache" mount as
 * nitro:functions:<name>:<key>.json, the same keys Nitro used (the KV driver picks what
 * to share by name).
 */
export const defineCache = <Args extends unknown[], T>(
  load: (...args: Args) => Promise<T>,
  options: CacheOptions<T> & { name: string, getKey: (...args: Args) => string },
) => {
  const version = codeVersion(load.toString())
  return (...args: Args) =>
    readThrough(
      useStorage('cache'),
      `nitro:functions:${options.name}:${options.getKey(...args)}.json`,
      () => load(...args),
      options,
      version,
    )
}

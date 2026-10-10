// The site's own cached function, used instead of Nitro's defineCachedFunction.
//
// Nitro's version shares one in-flight promise per key across requests and refreshes
// stale entries in the background. On Cloudflare, background work and the work of a
// cancelled request can be dropped, and then that shared promise never settles: every
// later request for the key waits on it for as long as the instance lives. With the
// cache shared through KV, entries were often stale on arrival, and pages hung.
//
// This one reads, and if the entry is fresh returns it. A stale entry is returned at
// once too, and refreshed after the response through event.waitUntil, so no visitor
// waits on Warcraft Logs just because an hour has passed. Only a missing entry is
// loaded inside the request. No request ever awaits another's promise: a refresh that
// is dropped only means the entry stays stale until a later request refreshes it.
import type { H3Event } from 'h3'
import type { Storage } from 'unstorage'

export interface CacheEntry<T> {
  value: T
  /** When it was stored, epoch milliseconds. */
  mtime: number
  /** The code that produced it; see cacheVersion. */
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

/** Hands a promise to the platform to finish after the response, as event.waitUntil does. */
export type Background = (task: Promise<unknown>) => void

// Keys this instance is refreshing, and since when. One refresh per key at a time, so a
// burst of visitors to a stale page costs one upstream load, not one each. Nothing ever
// waits on it, and a refresh the platform drops without a trace stops counting after
// REFRESH_TIMEOUT_MS, so the key is refreshed again after that.
const refreshing = new Map<string, number>()
const REFRESH_TIMEOUT_MS = 60 * 1000

// Cloudflare lets work handed to waitUntil run about 30 seconds past the response, then
// cancels it. A background refresh that has not finished by BACKGROUND_LIMIT_MS is
// given up on, and the next request for that key loads it inline instead, where it has
// the time it needs. Without that, a slow load would be cut off every time and the
// entry would stay stale for good while still spending upstream calls.
const BACKGROUND_LIMIT_MS = 25 * 1000
const loadInlineNext = new Set<string>()

const withinLimit = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`still running after ${ms} ms`)), ms)
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

/**
 * Returns the stored value for `key` while it is fresh, otherwise loads, stores and
 * returns a new one. With `background`, an entry that is only past its maxAge is
 * returned at once instead and the load runs in the background; one that fails
 * `validate` (an incomplete result) is still loaded inline, as is a missing one. If
 * loading fails and an older value is stored, that is served instead: a slightly old
 * page beats an error. Storage errors never fail the request.
 */
export const readThrough = async <T>(
  storage: Storage,
  key: string,
  load: () => Promise<T>,
  { maxAge, validate }: CacheOptions<T>,
  version: string,
  now = Date.now,
  background?: Background,
): Promise<T> => {
  const stored = await storage.getItem<CacheEntry<T>>(key).catch(() => null)
  const usable = stored && stored.version === version ? stored : null
  const valid = usable !== null && (validate?.(usable) ?? true)

  if (usable && valid && now() - usable.mtime < maxAge * 1000) {
    return usable.value
  }

  const refresh = async () => {
    const value = await load()
    const entry: CacheEntry<T> = { value, mtime: now(), version }
    if (validate?.(entry) ?? true) {
      await storage.setItem(key, entry).catch(error => console.error('[cache] write failed', key, error))
    }
    return value
  }

  if (usable && valid && background && !loadInlineNext.has(key)) {
    const started = refreshing.get(key)
    if (started === undefined || now() - started > REFRESH_TIMEOUT_MS) {
      refreshing.set(key, now())
      background(
        withinLimit(refresh(), BACKGROUND_LIMIT_MS)
          .catch((error) => {
            if (String(error).includes('still running after')) loadInlineNext.add(key)
            console.error('[cache] refresh failed', key, error)
          })
          .finally(() => refreshing.delete(key)),
      )
    }
    return usable.value
  }

  loadInlineNext.delete(key)
  try {
    return await refresh()
  }
  catch (error) {
    if (usable) return usable.value
    throw error
  }
}

/**
 * The version a cached function's entries are stored and checked under. `load` rarely
 * does its own work: it mostly calls named helpers (a transform, a GraphQL query
 * string) defined elsewhere, and load.toString() only captures load's own source, not
 * theirs. A fix to one of those helpers changes nothing `codeVersion` can see, so the
 * cache keeps serving entries built by the old, buggy code, this is exactly how a fix
 * to collapseFights() shipped without busting the `raid` cache that depends on it.
 * `dependsOn` closes that gap: list anything load's result shape or content actually
 * depends on, every function and query string stringifies to its own source.
 */
export const cacheVersion = (load: (...args: never[]) => unknown, dependsOn: unknown[] = []) =>
  codeVersion([load.toString(), ...dependsOn.map(String)].join('\n'))

/**
 * A cached function, stored under the "cache" mount as
 * nitro:functions:<name>:<key>.json, the same keys Nitro used (the KV driver picks what
 * to share by name). It takes the request's event first, so a stale entry can be
 * refreshed after the response, and passes it on to `load` for any cached function
 * that one calls in turn; `getKey` sees only the other arguments.
 *
 * Only the outermost call serves stale. A cached function called while `load` runs
 * (the roster inside the raid nights, the raid nights inside a character) loads a
 * stale entry inline, since whatever it returns is about to be stored as fresh: a
 * stale part there would make the whole entry an hour older than it claims to be.
 */
const insideLoad = new WeakSet<H3Event>()

export const defineCache = <Args extends unknown[], T>(
  load: (event: H3Event, ...args: Args) => Promise<T>,
  options: CacheOptions<T> & { name: string, getKey: (...args: Args) => string, dependsOn?: unknown[] },
) => {
  const version = cacheVersion(load, options.dependsOn)
  return (event: H3Event, ...args: Args) => {
    // `load` gets a stand-in for the event: everything reads through to the real one,
    // but cached functions can tell they are being called from inside a load.
    const inner = Object.create(event) as H3Event
    insideLoad.add(inner)
    return readThrough(
      useStorage('cache'),
      `nitro:functions:${options.name}:${options.getKey(...args)}.json`,
      () => load(inner, ...args),
      options,
      version,
      Date.now,
      insideLoad.has(event) ? undefined : task => (event.waitUntil ? event.waitUntil(task) : void task),
    )
  }
}

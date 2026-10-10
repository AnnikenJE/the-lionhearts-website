import { createStorage } from 'unstorage'
import type { H3Event } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cacheVersion, codeVersion, defineCache, readThrough } from '../../server/utils/cache'

const HOUR = 60 * 60 * 1000

const setup = (start = Date.UTC(2026, 8, 25, 12)) => {
  let time = start
  return {
    storage: createStorage(),
    now: () => time,
    advance: (ms: number) => (time += ms),
  }
}

describe('readThrough', () => {
  it('loads once and serves the stored value while it is fresh', async () => {
    const { storage, now, advance } = setup()
    const load = vi.fn(async () => 'nights')
    expect(await readThrough(storage, 'k', load, { maxAge: 3600 }, 'v1', now)).toBe('nights')
    advance(HOUR - 1)
    expect(await readThrough(storage, 'k', load, { maxAge: 3600 }, 'v1', now)).toBe('nights')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('loads again, inside the request, once the entry is older than maxAge', async () => {
    const { storage, now, advance } = setup()
    let n = 0
    const load = vi.fn(async () => `v${++n}`)
    await readThrough(storage, 'k', load, { maxAge: 3600 }, 'v1', now)
    advance(HOUR)
    expect(await readThrough(storage, 'k', load, { maxAge: 3600 }, 'v1', now)).toBe('v2')
  })

  it('never lets one request hang another: a load that never finishes only holds its own caller', async () => {
    const { storage, now } = setup()
    // The first request's load never settles, as a cancelled one on Cloudflare might not.
    void readThrough(storage, 'k', () => new Promise<string>(() => {}), { maxAge: 3600 }, 'v1', now)
    const second = readThrough(storage, 'k', async () => 'fresh', { maxAge: 3600 }, 'v1', now)
    await expect(second).resolves.toBe('fresh')
  })

  it('serves the stored value when loading fails, and throws only when there is none', async () => {
    const { storage, now, advance } = setup()
    await readThrough(storage, 'k', async () => 'old', { maxAge: 3600 }, 'v1', now)
    advance(2 * HOUR)
    const failing = async (): Promise<string> => {
      throw new Error('Warcraft Logs down')
    }
    expect(await readThrough(storage, 'k', failing, { maxAge: 3600 }, 'v1', now)).toBe('old')
    await expect(readThrough(storage, 'other', failing, { maxAge: 3600 }, 'v1', now)).rejects.toThrow('down')
  })

  it('ignores an entry written by other code, so a new deploy never reads an old shape', async () => {
    const { storage, now } = setup()
    await readThrough<object>(storage, 'k', async () => ({ old: true }), { maxAge: 3600 }, 'old-code', now)
    const fresh = await readThrough<object>(storage, 'k', async () => ({ fresh: true }), { maxAge: 3600 }, 'new-code', now)
    expect(fresh).toEqual({ fresh: true })
  })

  it('treats an entry that fails validate as stale, and does not store a value that fails it', async () => {
    const { storage, now } = setup()
    const validate = (entry: { value: { complete: boolean } }) => entry.value.complete
    const load = vi.fn(async () => ({ complete: false }))
    await readThrough(storage, 'k', load, { maxAge: 3600, validate }, 'v1', now)
    await readThrough(storage, 'k', load, { maxAge: 3600, validate }, 'v1', now)
    expect(load).toHaveBeenCalledTimes(2)
    expect(await storage.getItem('k')).toBeNull()
  })
})

describe('readThrough in the background', () => {
  const collect = () => {
    const tasks: Promise<unknown>[] = []
    return { tasks, background: (task: Promise<unknown>) => void tasks.push(task) }
  }

  it('serves a stale value at once and stores the refreshed one for the next request', async () => {
    const { storage, now, advance } = setup()
    const { tasks, background } = collect()
    let n = 0
    const load = async () => `v${++n}`
    await readThrough(storage, 'bg1', load, { maxAge: 3600 }, 'v1', now, background)
    advance(HOUR)
    expect(await readThrough(storage, 'bg1', load, { maxAge: 3600 }, 'v1', now, background)).toBe('v1')
    await Promise.all(tasks)
    expect(await readThrough(storage, 'bg1', load, { maxAge: 3600 }, 'v1', now, background)).toBe('v2')
  })

  it('still loads inside the request when nothing is stored', async () => {
    const { storage, now } = setup()
    const { tasks, background } = collect()
    expect(await readThrough(storage, 'bg2', async () => 'first', { maxAge: 3600 }, 'v1', now, background)).toBe('first')
    expect(tasks).toHaveLength(0)
  })

  it('refreshes a key once at a time, however many requests find it stale', async () => {
    const { storage, now, advance } = setup()
    const { tasks, background } = collect()
    await readThrough(storage, 'bg3', async () => 'old', { maxAge: 3600 }, 'v1', now)
    advance(HOUR)
    const load = vi.fn(async () => 'new')
    await Promise.all([1, 2, 3].map(() => readThrough(storage, 'bg3', load, { maxAge: 3600 }, 'v1', now, background)))
    await Promise.all(tasks)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('refreshes again after a refresh that never settles has timed out', async () => {
    const { storage, now, advance } = setup()
    const { background } = collect()
    await readThrough(storage, 'bg4', async () => 'old', { maxAge: 3600 }, 'v1', now)
    advance(HOUR)
    // Dropped by the platform: never settles, so it never clears its own mark.
    await readThrough(storage, 'bg4', () => new Promise<string>(() => {}), { maxAge: 3600 }, 'v1', now, background)
    const load = vi.fn(async () => 'new')
    await readThrough(storage, 'bg4', load, { maxAge: 3600 }, 'v1', now, background)
    expect(load).not.toHaveBeenCalled()
    advance(3 * 60 * 1000)
    await readThrough(storage, 'bg4', load, { maxAge: 3600 }, 'v1', now, background)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('keeps the stale value when the refresh fails', async () => {
    const { storage, now, advance } = setup()
    const { tasks, background } = collect()
    await readThrough(storage, 'bg5', async () => 'old', { maxAge: 3600 }, 'v1', now)
    advance(HOUR)
    const failing = async (): Promise<string> => {
      throw new Error('Warcraft Logs down')
    }
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await readThrough(storage, 'bg5', failing, { maxAge: 3600 }, 'v1', now, background)).toBe('old')
    await Promise.all(tasks)
    expect(error).toHaveBeenCalled()
    error.mockRestore()
    expect(await readThrough(storage, 'bg5', async () => 'later', { maxAge: 3600 }, 'v1', now)).toBe('later')
  })
})

describe('readThrough in the background, edge cases', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads inline, not in the background, an entry that fails validate', async () => {
    const { storage, now, advance } = setup()
    const tasks: Promise<unknown>[] = []
    const validate = (entry: { value: { complete: boolean }, mtime: number }) =>
      entry.value.complete || now() - entry.mtime < 10 * 60 * 1000
    await readThrough(storage, 'edge1', async () => ({ complete: false }), { maxAge: 3600, validate }, 'v1', now)
    advance(11 * 60 * 1000)
    const fresh = await readThrough(storage, 'edge1', async () => ({ complete: true }), { maxAge: 3600, validate }, 'v1', now, task => void tasks.push(task))
    expect(fresh).toEqual({ complete: true })
    expect(tasks).toHaveLength(0)
  })

  it('loads inline next time when a background refresh outlives the platform limit', async () => {
    vi.useFakeTimers()
    const { storage, now, advance } = setup()
    const tasks: Promise<unknown>[] = []
    const background = (task: Promise<unknown>) => void tasks.push(task)
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    await readThrough(storage, 'edge2', async () => 'old', { maxAge: 3600 }, 'v1', now)
    advance(HOUR)
    // A refresh too slow for waitUntil: still running after the 25 second limit.
    expect(await readThrough(storage, 'edge2', () => new Promise<string>(() => {}), { maxAge: 3600 }, 'v1', now, background)).toBe('old')
    await vi.advanceTimersByTimeAsync(26 * 1000)
    await Promise.all(tasks)
    error.mockRestore()
    const tasksBefore = tasks.length
    expect(await readThrough(storage, 'edge2', async () => 'new', { maxAge: 3600 }, 'v1', now, background)).toBe('new')
    expect(tasks).toHaveLength(tasksBefore)
  })
})

describe('defineCache', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('serves stale only at the outermost call: a cached function inside a load loads inline', async () => {
    const storage = createStorage()
    vi.stubGlobal('useStorage', () => storage)
    const tasks: Promise<unknown>[] = []
    const event = { waitUntil: (task: Promise<unknown>) => void tasks.push(task) } as unknown as H3Event
    let roster = 'roster v1'
    const fetchRoster = defineCache(async () => roster, { name: 'test-roster', getKey: () => 'k', maxAge: 60 })
    const fetchNights = defineCache(
      async (inner: H3Event) => `nights with ${await fetchRoster(inner)}`,
      { name: 'test-nights', getKey: () => 'k', maxAge: 60 },
    )

    expect(await fetchNights(event)).toBe('nights with roster v1')
    // Both entries go stale, and the roster changes upstream.
    const stale = Date.now() - 2 * 60 * 1000
    for (const key of ['nitro:functions:test-roster:k.json', 'nitro:functions:test-nights:k.json']) {
      const entry = await storage.getItem<{ mtime: number }>(key)
      await storage.setItem(key, { ...entry!, mtime: stale })
    }
    roster = 'roster v2'

    // The outer call serves its stale value at once...
    expect(await fetchNights(event)).toBe('nights with roster v1')
    expect(tasks).toHaveLength(1)
    await Promise.all(tasks)
    // ...and its refresh was built from a freshly loaded roster, not the stale one.
    expect(tasks).toHaveLength(1)
    expect(await fetchNights(event)).toBe('nights with roster v2')
  })
})

describe('codeVersion', () => {
  it('changes when the code changes', () => {
    expect(codeVersion('a => a + 1')).toBe(codeVersion('a => a + 1'))
    expect(codeVersion('a => a + 1')).not.toBe(codeVersion('a => a + 2'))
  })
})

describe('cacheVersion', () => {
  // A loader rarely does its own work: it mostly calls named helpers (a transform, a
  // GraphQL query string) that live elsewhere, so load.toString() alone never changes
  // when one of them does. This is exactly the gap that let #106 ship: collapseFights()
  // changed, fetchRaid's own source did not, and the cache kept serving the old shape.
  const load = async () => {}

  it('changes when a dependency function\'s source changes, even though load itself did not', () => {
    const helperA = () => 1
    const helperB = () => 2
    expect(cacheVersion(load, [helperA])).not.toBe(cacheVersion(load, [helperB]))
  })

  it('changes when a dependency string (e.g. a GraphQL query) changes', () => {
    expect(cacheVersion(load, ['query { a }'])).not.toBe(cacheVersion(load, ['query { b }']))
  })

  it('is stable for the same load and the same dependencies', () => {
    const helper = () => 1
    expect(cacheVersion(load, [helper])).toBe(cacheVersion(load, [helper]))
  })

  it('defaults to load-only, matching codeVersion(load.toString()), when no dependencies are given', () => {
    expect(cacheVersion(load)).toBe(codeVersion(load.toString()))
  })
})

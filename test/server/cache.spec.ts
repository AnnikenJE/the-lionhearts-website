import { createStorage } from 'unstorage'
import { describe, expect, it, vi } from 'vitest'
import { codeVersion, readThrough } from '../../server/utils/cache'

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

describe('codeVersion', () => {
  it('changes when the code changes', () => {
    expect(codeVersion('a => a + 1')).toBe(codeVersion('a => a + 1'))
    expect(codeVersion('a => a + 1')).not.toBe(codeVersion('a => a + 2'))
  })
})

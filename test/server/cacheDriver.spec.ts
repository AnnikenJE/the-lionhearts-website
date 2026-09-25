import { afterEach, describe, expect, it, vi } from 'vitest'
import { isShared, memoryOverKv } from '../../server/utils/cacheDriver'

// A stand-in for a Workers KV binding: what Cloudflare hands over as globalThis.__env__.CACHE.
const fakeKv = () => {
  const data = new Map<string, string>()
  return {
    data,
    get: vi.fn(async (key: string) => data.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => void data.set(key, value)),
    delete: vi.fn(async (key: string) => void data.delete(key)),
    list: vi.fn(async () => ({ keys: [...data.keys()].map(name => ({ name })), list_complete: true })),
  }
}

const withBinding = (binding: unknown) => {
  (globalThis as { __env__?: unknown }).__env__ = { CACHE: binding }
}

afterEach(() => {
  delete (globalThis as { __env__?: unknown }).__env__
})

describe('memoryOverKv', () => {
  it('works as plain memory without a KV binding', async () => {
    const driver = memoryOverKv({})
    await driver.setItem!('nitro:functions:raids:lionhearts:53.json', 'nights', {})
    expect(await driver.getItem('nitro:functions:raids:lionhearts:53.json', {})).toBe('nights')
  })

  it('writes to KV too, with an expiry, so other instances and later deploys can read it', async () => {
    const kv = fakeKv()
    withBinding(kv)
    await memoryOverKv({}).setItem!('nitro:functions:raids:lionhearts:53.json', 'nights', {})
    expect(kv.data.get('nitro:functions:raids:lionhearts:53.json')).toBe('nights')
    expect(kv.put.mock.calls[0]![2]).toMatchObject({ expirationTtl: 8 * 24 * 60 * 60 })
  })

  it('reads from KV when this instance has not seen the entry, then keeps it in memory', async () => {
    const kv = fakeKv()
    kv.data.set('nitro:functions:raid:abc.json', 'detail')
    withBinding(kv)
    const driver = memoryOverKv({})
    expect(await driver.getItem('nitro:functions:raid:abc.json', {})).toBe('detail')
    await driver.getItem('nitro:functions:raid:abc.json', {})
    expect(kv.get).toHaveBeenCalledTimes(1)
  })

  it('keeps working from memory when KV fails', async () => {
    const kv = fakeKv()
    kv.get.mockRejectedValue(new Error('KV down'))
    kv.put.mockRejectedValue(new Error('KV down'))
    withBinding(kv)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const driver = memoryOverKv({})
    await driver.setItem!('nitro:functions:raid:abc.json', 'detail', {})
    expect(await driver.getItem('nitro:functions:raid:abc.json', {})).toBe('detail')
    expect(await driver.getItem('missing', {})).toBeNull()
  })
})

describe('isShared', () => {
  it('shares the Warcraft Logs caches through KV', () => {
    expect(isShared('nitro:functions:raids:lionhearts:53.json')).toBe(true)
    expect(isShared('nitro:functions:raids-past:lionhearts:42.json')).toBe(true)
    expect(isShared('nitro:functions:raid:hnwFKLf4xYRN2mzj.json')).toBe(true)
    expect(isShared('nitro:functions:character:kilrogg:destructo:53.json')).toBe(true)
  })

  it('keeps Raider.IO and Raidbots data in memory only', () => {
    expect(isShared('nitro:functions:roster:lionhearts.json')).toBe(false)
    expect(isShared('nitro:functions:raiderio-character:kilrogg:destructo.json')).toBe(false)
    expect(isShared('nitro:functions:upgrade-tracks:live.json')).toBe(false)
  })

  it('never writes a Raider.IO entry to KV', async () => {
    const kv = fakeKv()
    withBinding(kv)
    await memoryOverKv({}).setItem!('nitro:functions:roster:lionhearts.json', 'members', {})
    expect(kv.put).not.toHaveBeenCalled()
  })
})

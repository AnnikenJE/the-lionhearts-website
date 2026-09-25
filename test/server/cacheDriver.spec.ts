import { afterEach, describe, expect, it, vi } from 'vitest'
import { memoryOverKv } from '../../server/utils/cacheDriver'

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
    await driver.setItem!('raids:53', 'nights', {})
    expect(await driver.getItem('raids:53', {})).toBe('nights')
  })

  it('writes to KV too, with an expiry, so other instances and later deploys can read it', async () => {
    const kv = fakeKv()
    withBinding(kv)
    await memoryOverKv({}).setItem!('raids:53', 'nights', {})
    expect(kv.data.get('raids:53')).toBe('nights')
    expect(kv.put.mock.calls[0]![2]).toMatchObject({ expirationTtl: 8 * 24 * 60 * 60 })
  })

  it('reads from KV when this instance has not seen the entry, then keeps it in memory', async () => {
    const kv = fakeKv()
    kv.data.set('raid:abc', 'detail')
    withBinding(kv)
    const driver = memoryOverKv({})
    expect(await driver.getItem('raid:abc', {})).toBe('detail')
    await driver.getItem('raid:abc', {})
    expect(kv.get).toHaveBeenCalledTimes(1)
  })

  it('keeps working from memory when KV fails', async () => {
    const kv = fakeKv()
    kv.get.mockRejectedValue(new Error('KV down'))
    kv.put.mockRejectedValue(new Error('KV down'))
    withBinding(kv)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const driver = memoryOverKv({})
    await driver.setItem!('roster', 'members', {})
    expect(await driver.getItem('roster', {})).toBe('members')
    expect(await driver.getItem('missing', {})).toBeNull()
  })
})

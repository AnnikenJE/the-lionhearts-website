import { describe, expect, it } from 'vitest'
import { errorCopy } from '../../app/utils/errorCopy'

describe('errorCopy', () => {
  it('gives the not-found copy for 404', () => {
    expect(errorCopy(404).title).toBe('Page not found')
  })

  it('falls back to the generic copy for every other status', () => {
    for (const code of [500, 503, undefined]) {
      expect(errorCopy(code).title).toBe('Something went wrong')
    }
  })

  it('never uses an em dash', () => {
    for (const code of [404, 500, undefined]) {
      const { title, lede } = errorCopy(code)
      expect(`${title} ${lede}`).not.toContain('\u2014')
    }
  })
})

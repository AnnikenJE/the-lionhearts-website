import { describe, expect, it } from 'vitest'
import { difficultyName, isNotConfigured } from '../../server/utils/warcraftlogs'

describe('difficultyName', () => {
  it('names the retail raid difficulties', () => {
    expect(difficultyName(3)).toBe('Normal')
    expect(difficultyName(4)).toBe('Heroic')
    expect(difficultyName(5)).toBe('Mythic')
  })

  it('returns null for an unmapped or missing value rather than inventing a name', () => {
    expect(difficultyName(99)).toBeNull()
    expect(difficultyName(null)).toBeNull()
    expect(difficultyName(undefined)).toBeNull()
  })
})

describe('isNotConfigured', () => {
  it('recognises the missing-credentials error', () => {
    expect(isNotConfigured({ statusCode: 503, statusMessage: 'Warcraft Logs is not configured' })).toBe(true)
  })

  it('does not mistake an outage at Warcraft Logs for missing credentials', () => {
    expect(isNotConfigured({ statusCode: 503, statusMessage: 'Service Unavailable' })).toBe(false)
  })
})

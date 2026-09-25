import { describe, expect, it } from 'vitest'
import { difficultyName } from '../../server/utils/warcraftlogs'

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

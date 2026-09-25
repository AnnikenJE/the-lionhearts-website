import { describe, expect, it } from 'vitest'
import { budgetAllows, difficultyName, isGuildRaidDifficulty, isNotConfigured, withRateLimitData } from '../../server/utils/warcraftlogs'

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

describe('budgetAllows', () => {
  const now = Date.UTC(2026, 8, 25, 12)
  const reading = (spent: number) => ({ spent, limit: 3600, resetsAt: now + 30 * 60 * 1000 })

  it('lets everything through before the first reading', () => {
    expect(budgetAllows(null, 'low', now)).toBe(true)
  })

  it('stops low priority work at 80% of the hourly points', () => {
    expect(budgetAllows(reading(2879), 'low', now)).toBe(true)
    expect(budgetAllows(reading(2880), 'low', now)).toBe(false)
  })

  it('keeps high priority work going until 95%', () => {
    expect(budgetAllows(reading(2880), 'high', now)).toBe(true)
    expect(budgetAllows(reading(3420), 'high', now)).toBe(false)
  })

  it('forgets a reading once the points have reset', () => {
    expect(budgetAllows({ spent: 3600, limit: 3600, resetsAt: now - 1 }, 'low', now)).toBe(true)
  })
})

describe('withRateLimitData', () => {
  it('asks for the rate limit alongside the fields the query asks for', () => {
    const query = 'query Raid($code: String!) { reportData { report(code: $code) { code } } }'
    expect(withRateLimitData(query)).toBe(
      'query Raid($code: String!) { rateLimitData { limitPerHour pointsSpentThisHour pointsResetIn } reportData { report(code: $code) { code } } }',
    )
  })
})

describe('isGuildRaidDifficulty', () => {
  it('counts Normal, Heroic and Mythic', () => {
    expect([3, 4, 5].every(isGuildRaidDifficulty)).toBe(true)
  })

  it('leaves out LFR and Mythic+ dungeons', () => {
    expect(isGuildRaidDifficulty(1)).toBe(false)
    expect(isGuildRaidDifficulty(10)).toBe(false)
    expect(isGuildRaidDifficulty(null)).toBe(false)
  })
})

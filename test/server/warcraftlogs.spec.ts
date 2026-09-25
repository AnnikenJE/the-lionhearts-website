import { describe, expect, it } from 'vitest'
import {
  difficultyName,
  isReportCacheFresh,
  LIVE_REPORT_MAX_AGE_MS,
  LIVE_REPORT_WINDOW_MS,
} from '../../server/utils/warcraftlogs'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

describe('isReportCacheFresh', () => {
  const fetchedAt = Date.UTC(2026, 8, 24, 22, 0)

  it('keeps a live report for less than ten minutes', () => {
    const reportEnd = fetchedAt - 5 * MINUTE
    expect(isReportCacheFresh(fetchedAt, reportEnd, fetchedAt + 9 * MINUTE)).toBe(true)
  })

  it('drops a live report once ten minutes have passed', () => {
    const reportEnd = fetchedAt - 5 * MINUTE
    expect(isReportCacheFresh(fetchedAt, reportEnd, fetchedAt + LIVE_REPORT_MAX_AGE_MS)).toBe(false)
  })

  it('treats a report that ended under two hours before the fetch as live', () => {
    const reportEnd = fetchedAt - (LIVE_REPORT_WINDOW_MS - MINUTE)
    expect(isReportCacheFresh(fetchedAt, reportEnd, fetchedAt + HOUR)).toBe(false)
  })

  it('keeps a finished report long after the live window', () => {
    const reportEnd = fetchedAt - LIVE_REPORT_WINDOW_MS
    expect(isReportCacheFresh(fetchedAt, reportEnd, fetchedAt + 20 * HOUR)).toBe(true)
  })
})

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

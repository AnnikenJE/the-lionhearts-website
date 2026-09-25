import { describe, expect, it } from 'vitest'
import { formatClock, formatDate, formatDuration, formatTime, formatWeekday } from '../../app/utils/date'

// The formatters use server time (Europe/Paris) whatever zone the tests run in, so the
// fixtures are fixed UTC instants: 17:30 UTC is 19:30 in summer (CEST, UTC+2).

describe('formatDate', () => {
  it('renders the en-GB long form', () => {
    expect(formatDate('2026-08-10T10:00:00Z')).toBe('10 August 2026')
  })

  it('does not pad the day', () => {
    expect(formatDate('2026-01-05T10:00:00Z')).toBe('5 January 2026')
  })

  it('uses the server date, not UTC, just after midnight server time', () => {
    // 23:30 UTC on 9 August is 01:30 on 10 August in Paris.
    expect(formatDate('2026-08-09T23:30:00Z')).toBe('10 August 2026')
  })
})

describe('formatTime', () => {
  it('renders a 24 hour wall clock in server time', () => {
    expect(formatTime('2026-08-10T17:30:00Z')).toBe('19:30')
  })

  it('pads the hour, and follows winter time', () => {
    expect(formatTime('2026-01-10T08:05:00Z')).toBe('09:05')
  })
})

describe('formatWeekday', () => {
  it('names the weekday in server time', () => {
    expect(formatWeekday('2026-09-24T16:49:53Z')).toBe('Thursday')
    expect(formatWeekday('2026-09-24T22:30:00Z')).toBe('Friday')
  })
})

describe('formatDuration', () => {
  it('drops the hour part when there is none', () => {
    expect(formatDuration(45 * 60_000)).toBe('45m')
  })

  it('pads the minutes once hours are shown, so the column lines up', () => {
    expect(formatDuration((3 * 60 + 5) * 60_000)).toBe('3h 05m')
    expect(formatDuration(2 * 60 * 60_000)).toBe('2h 00m')
  })

  it('floors to whole minutes', () => {
    expect(formatDuration(59_999)).toBe('0m')
  })

  it('treats zero and negative spans as nothing', () => {
    expect(formatDuration(0)).toBe('0m')
    expect(formatDuration(-1)).toBe('0m')
  })
})

describe('formatClock', () => {
  it('reads as minutes and seconds', () => {
    expect(formatClock(336463)).toBe('5:36')
    expect(formatClock(1158706)).toBe('19:19')
    expect(formatClock(59_000)).toBe('0:59')
  })

  it('never goes negative', () => {
    expect(formatClock(-5)).toBe('0:00')
  })
})

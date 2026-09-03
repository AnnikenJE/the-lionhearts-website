import { describe, expect, it } from 'vitest'
import { formatDate, formatDuration, formatTime } from '../../app/utils/date'

// Both formatters render in the viewer's own timezone, so the fixtures are built
// from local parts rather than a fixed UTC string. That keeps the assertions true
// wherever the tests run.
const localIso = (year: number, month: number, day: number, hour = 0, minute = 0) =>
  new Date(year, month - 1, day, hour, minute).toISOString()

describe('formatDate', () => {
  it('renders the en-GB long form', () => {
    expect(formatDate(localIso(2026, 8, 10))).toBe('10 August 2026')
  })

  it('does not pad the day', () => {
    expect(formatDate(localIso(2026, 1, 5))).toBe('5 January 2026')
  })
})

describe('formatTime', () => {
  it('renders a 24 hour wall clock', () => {
    expect(formatTime(localIso(2026, 8, 10, 19, 30))).toBe('19:30')
  })

  it('pads the hour', () => {
    expect(formatTime(localIso(2026, 8, 10, 9, 5))).toBe('09:05')
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

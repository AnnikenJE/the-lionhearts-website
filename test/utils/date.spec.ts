import { describe, expect, it } from 'vitest'
import { formatDate } from '../../app/utils/date'

// formatDate renders in the viewer's own timezone, so the fixtures are built from
// local parts rather than a fixed UTC string. That keeps the assertions true
// wherever the tests run.
const localIso = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day).toISOString()

describe('formatDate', () => {
  it('renders the en-GB long form', () => {
    expect(formatDate(localIso(2026, 8, 10))).toBe('10 August 2026')
  })

  it('does not pad the day', () => {
    expect(formatDate(localIso(2026, 1, 5))).toBe('5 January 2026')
  })
})

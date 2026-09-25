import { describe, expect, it } from 'vitest'
import { compactNumber, plural } from '../../app/utils/text'

describe('plural', () => {
  it('keeps the singular at one', () => {
    expect(plural(1, 'pull')).toBe('1 pull')
  })

  it('pluralises everything else, zero included', () => {
    expect(plural(2, 'pull')).toBe('2 pulls')
    expect(plural(0, 'pull')).toBe('0 pulls')
  })

  it('takes an irregular plural rather than guessing', () => {
    expect(plural(3, 'boss', 'bosses')).toBe('3 bosses')
    expect(plural(1, 'boss', 'bosses')).toBe('1 boss')
  })
})

describe('compactNumber', () => {
  it('shortens thousands and millions to one decimal', () => {
    expect(compactNumber(140897.03)).toBe('140.9k')
    expect(compactNumber(1525.56)).toBe('1.5k')
    expect(compactNumber(46196672)).toBe('46.2m')
    expect(compactNumber(950)).toBe('950')
  })
})

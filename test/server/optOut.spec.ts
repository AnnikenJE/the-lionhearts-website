import { describe, expect, it } from 'vitest'
import { isNameIn, isOptedOut, withoutOptedOut } from '../../server/utils/optOut'

describe('isNameIn', () => {
  it('matches regardless of case, so the list can be written normally', () => {
    expect(isNameIn(['Someguy'], 'someguy')).toBe(true)
    expect(isNameIn(['someguy'], 'SOMEGUY')).toBe(true)
  })

  it('does not match a different name', () => {
    expect(isNameIn(['Someguy'], 'Someone')).toBe(false)
  })

  it('does not match on a prefix, only on the whole name', () => {
    expect(isNameIn(['Some'], 'Someguy')).toBe(false)
  })

  it('matches nothing against an empty list', () => {
    expect(isNameIn([], 'Someguy')).toBe(false)
  })
})

describe('withoutOptedOut', () => {
  it('keeps a character nobody has opted out', () => {
    const players = [{ name: 'Aeliana' }, { name: 'Knight' }]

    expect(withoutOptedOut(players)).toEqual(players)
    expect(isOptedOut('Aeliana')).toBe(false)
  })

  it('returns an empty list rather than throwing on an empty one', () => {
    expect(withoutOptedOut([])).toEqual([])
  })
})

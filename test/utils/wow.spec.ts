import { describe, expect, it } from 'vitest'
import { classColor } from '../../app/utils/wow'

describe('classColor', () => {
  it('returns the official colour', () => {
    expect(classColor('Priest')).toBe('#ffffff')
    expect(classColor('Warrior')).toBe('#c69b6d')
  })

  it('agrees across the two sources, which spell two-word classes differently', () => {
    // Raider.IO says "Death Knight", Warcraft Logs says "DeathKnight".
    expect(classColor('Death Knight')).toBe('#c41e3a')
    expect(classColor('DeathKnight')).toBe(classColor('Death Knight'))
    expect(classColor('Demon Hunter')).toBe(classColor('DemonHunter'))
  })

  it('ignores case and hyphens', () => {
    expect(classColor('demon-hunter')).toBe('#a330c9')
    expect(classColor('MAGE')).toBe('#3fc7eb')
  })

  it('falls back to the body colour for anything it does not know', () => {
    // A class added in a later expansion must not render as an empty style.
    expect(classColor('Tinker')).toBe('var(--color-fg)')
    expect(classColor('')).toBe('var(--color-fg)')
  })
})

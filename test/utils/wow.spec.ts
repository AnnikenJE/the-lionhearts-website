import { describe, expect, it } from 'vitest'
import { characterPath, classColor, parseColor, realmSlug } from '../../app/utils/wow'

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

describe('realmSlug', () => {
  it('slugs the Raider.IO spelling', () => {
    expect(realmSlug('Defias Brotherhood')).toBe('defias-brotherhood')
    expect(realmSlug('Darkmoon Faire')).toBe('darkmoon-faire')
  })

  it('slugs the Warcraft Logs spelling, which drops the space', () => {
    expect(realmSlug('DefiasBrotherhood')).toBe('defias-brotherhood')
    expect(realmSlug('Kilrogg')).toBe('kilrogg')
  })

  it('drops apostrophes the way the APIs do', () => {
    expect(realmSlug("Kel'Thuzad")).toBe('kelthuzad')
  })
})

describe('characterPath', () => {
  it('builds the page path and encodes accented names', () => {
    expect(characterPath('Defias Brotherhood', 'Hidril')).toBe('/characters/defias-brotherhood/Hidril')
    expect(characterPath('Kilrogg', 'Lethzào')).toBe('/characters/kilrogg/Lethz%C3%A0o')
  })
})

describe('parseColor', () => {
  it('follows the usual parse brackets', () => {
    expect(parseColor(10)).toBe('#9d9d9d')
    expect(parseColor(25)).toBe('#1eff00')
    expect(parseColor(74.9)).toBe('#0070ff')
    expect(parseColor(75)).toBe('#a335ee')
    expect(parseColor(95)).toBe('#ff8000')
    expect(parseColor(99.5)).toBe('#e268a8')
    expect(parseColor(100)).toBe('#e5cc80')
  })
})

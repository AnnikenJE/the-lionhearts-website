import { describe, expect, it } from 'vitest'
import { toUpgradeTracks, upgradeTrack } from '../../server/utils/upgradeTracks'

describe('toUpgradeTracks', () => {
  it('keeps only bonus ids that name a track', () => {
    const tracks = toUpgradeTracks({
      12852: { upgrade: { name: 'Myth', fullName: 'Myth 4/6', level: 4, max: 6 } },
      12838: { upgrade: { name: 'Champion', level: 6, max: 6 } },
      13440: {},
      99: { upgrade: { level: 1, max: 1 } },
    })
    expect(tracks).toEqual({ 12852: 'Myth 4/6', 12838: 'Champion 6/6' })
  })
})

describe('upgradeTrack', () => {
  const tracks = { 12852: 'Myth 4/6' }

  it('finds the track among an item\'s bonus ids', () => {
    expect(upgradeTrack([13692, 13440, 6652, 12852], tracks)).toBe('Myth 4/6')
  })

  it('returns null for an item without a track', () => {
    expect(upgradeTrack([40, 13668], tracks)).toBeNull()
    expect(upgradeTrack(undefined, tracks)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import {
  findRaidNights,
  rankingMetric,
  toDifficultyRankings,
  toGear,
  toMythicPlusRuns,
  toRaidProgression,
  type WclZoneRankings,
} from '../../server/utils/character'

const ranking = (name: string, totalKills: number, rankPercent = 80) => ({
  encounter: { name },
  rankPercent,
  medianPercent: rankPercent - 10,
  totalKills,
  fastestKill: 300_000,
  spec: 'Arcane',
  bestAmount: 140_000,
  allStars: { serverRank: 3 },
  bestRank: { ilvl: 306 },
})

const zone = (overrides: Partial<WclZoneRankings> = {}): WclZoneRankings => ({
  difficulty: 4,
  metric: 'dps',
  bestPerformanceAverage: 84.3,
  medianPerformanceAverage: 77.6,
  allStars: [{ spec: 'Blood', points: 666, possiblePoints: 1200, rank: 6695, regionRank: 2712, serverRank: 4, rankPercent: 90 }],
  rankings: [ranking('Nek\'zali the Soulcoiler', 2), ranking('Ula\'tek', 0)],
  ...overrides,
})

describe('toDifficultyRankings', () => {
  it('names the difficulty and carries the averages and All Stars', () => {
    const result = toDifficultyRankings(zone())!
    expect(result.difficulty).toBe('Heroic')
    expect(result.bestAverage).toBe(84.3)
    expect(result.allStars?.serverRank).toBe(4)
  })

  it('keeps unkilled bosses but blanks their numbers, rather than showing a parse that is not there', () => {
    const [killed, unkilled] = toDifficultyRankings(zone())!.bosses
    expect(killed).toMatchObject({ boss: 'Nek\'zali the Soulcoiler', bestPercent: 80, kills: 2, serverRank: 3, itemLevel: 306 })
    expect(unkilled).toMatchObject({ boss: 'Ula\'tek', bestPercent: null, bestAmount: null, kills: 0, serverRank: null })
  })

  it('returns null for a difficulty with no kills at all, so the page does not offer it', () => {
    expect(toDifficultyRankings(zone({ rankings: [ranking('Ula\'tek', 0)] }))).toBeNull()
    expect(toDifficultyRankings(null)).toBeNull()
  })
})

describe('rankingMetric', () => {
  it('ranks healers on healing and everyone else on damage', () => {
    expect(rankingMetric('HEALING')).toBe('hps')
    expect(rankingMetric('DPS')).toBe('dps')
    expect(rankingMetric('TANK')).toBe('dps')
    expect(rankingMetric(null)).toBe('dps')
  })
})

describe('toGear', () => {
  it('names the slots the way the character sheet does', () => {
    const gear = toGear({
      finger1: { item_id: 1, item_level: 300, name: 'Band', icon: 'ring', item_quality: 4 },
      mainhand: { item_id: 2, item_level: 310, name: 'Staff', icon: 'staff', item_quality: 4 },
    })
    expect(gear.map(item => item.slot)).toEqual(['Ring', 'Main hand'])
    expect(gear[1]).toMatchObject({ name: 'Staff', itemId: 2, itemLevel: 310 })
  })

  it('names the upgrade track of each item from its bonus ids', () => {
    const gear = toGear(
      { head: { item_id: 1, item_level: 328, name: 'Casque', icon: 'helm', item_quality: 4, bonuses: [13692, 12852] } },
      { 12852: 'Myth 4/6' },
    )
    expect(gear[0]!.track).toBe('Myth 4/6')
  })

  it('handles a character with no gear data', () => {
    expect(toGear(undefined)).toEqual([])
  })
})

describe('toMythicPlusRuns', () => {
  it('orders runs by score, best first', () => {
    const run = (dungeon: string, score: number) => ({
      dungeon,
      short_name: dungeon.slice(0, 2),
      mythic_level: 10,
      num_keystone_upgrades: 1,
      score,
      clear_time_ms: 1,
      par_time_ms: 2,
      completed_at: '2026-09-13T13:58:08.000Z',
      url: `https://raider.io/${dungeon}`,
    })
    expect(toMythicPlusRuns([run('A', 300), run('B', 410)]).map(r => r.dungeon)).toEqual(['B', 'A'])
  })
})

describe('toRaidProgression', () => {
  const raid = (normal: number, heroic = 0) => ({
    summary: `${heroic}/8 H`,
    total_bosses: 8,
    normal_bosses_killed: normal,
    heroic_bosses_killed: heroic,
    mythic_bosses_killed: 0,
  })

  it('names raids from their slug and drops tier roll-ups and empty raids', () => {
    const result = toRaidProgression({
      'the-venomous-abyss': raid(8, 6),
      'tier-mn-1': raid(9, 5),
      'sporefall': raid(0),
    })
    expect(result).toEqual([
      { raid: 'The Venomous Abyss', summary: '6/8 H', total: 8, normal: 8, heroic: 6, mythic: 0 },
    ])
  })

  it('keeps "of" and "the" lower case inside a name', () => {
    expect(toRaidProgression({ 'liberation-of-undermine': raid(8) })[0]!.raid).toBe('Liberation of Undermine')
  })
})

describe('findRaidNights', () => {
  const night = (code: string, dps: { name: string, server: string | null }[]) => ({
    code,
    zone: 'The Venomous Abyss',
    startedAt: '2026-09-24T16:49:53.397Z',
    tanks: [],
    healers: [],
    dps: dps.map(p => ({ ...p, spec: 'Arcane' })),
  })
  const onDefias = (server: string | null) => server === 'DefiasBrotherhood'

  it('finds the nights a character was in, with their spec and role', () => {
    const raids = [night('a', [{ name: 'Hidril', server: 'DefiasBrotherhood' }]), night('b', [])]
    expect(findRaidNights(raids, 'hidril', onDefias)).toEqual([
      { code: 'a', zone: 'The Venomous Abyss', startedAt: '2026-09-24T16:49:53.397Z', spec: 'Arcane', role: 'dps' },
    ])
  })

  it('does not mix up two characters with the same name on different realms', () => {
    const raids = [night('a', [{ name: 'Hidril', server: 'Kilrogg' }])]
    expect(findRaidNights(raids, 'Hidril', onDefias)).toEqual([])
  })
})

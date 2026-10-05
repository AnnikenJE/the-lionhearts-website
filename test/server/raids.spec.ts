import { describe, expect, it } from 'vitest'
import { collapseFights, countMembers, groupRaidNights, guildRaidFights, toDifficultyProgress } from '../../server/utils/raids'

const log = (code: string, start: string, end: string) => ({
  code,
  startTime: Date.parse(`2026-09-13T${start}:00Z`),
  endTime: Date.parse(`2026-09-13T${end}:00Z`),
})

const codes = (nights: { code: string }[][]) => nights.map(night => night.map(l => l.code))

describe('groupRaidNights', () => {
  it('puts two overlapping logs of the same night together', () => {
    expect(codes(groupRaidNights([log('a', '17:02', '19:55'), log('b', '16:43', '19:56')]))).toEqual([['b', 'a']])
  })

  it('puts a night logged in parts together, gaps and all', () => {
    const parts = [log('heroic', '17:04', '18:07'), log('normal', '18:15', '19:28'), log('last', '19:32', '19:42')]
    expect(codes(groupRaidNights(parts))).toEqual([['heroic', 'normal', 'last']])
  })

  it('keeps nights apart when the break is longer than a raid night allows', () => {
    const early = log('early', '08:00', '09:00')
    const evening = log('evening', '17:00', '20:00')
    expect(codes(groupRaidNights([early, evening]))).toEqual([['evening'], ['early']])
  })

  it('returns the newest night first', () => {
    const sunday = { code: 'sun', startTime: Date.parse('2026-09-13T17:00:00Z'), endTime: Date.parse('2026-09-13T20:00:00Z') }
    const thursday = { code: 'thu', startTime: Date.parse('2026-09-10T17:00:00Z'), endTime: Date.parse('2026-09-10T20:00:00Z') }
    expect(codes(groupRaidNights([thursday, sunday]))).toEqual([['sun'], ['thu']])
  })
})

describe('countMembers', () => {
  const actors = [
    { id: 1, name: 'Anniken', server: 'DarkmoonFaire' },
    { id: 2, name: 'Destructo', server: 'Kilrogg' },
    { id: 3, name: 'Pugger', server: 'Silvermoon' },
    { id: 4, name: 'Anniken', server: 'Ravencrest' },
  ]
  const members = new Set(['darkmoonfaire:anniken', 'kilrogg:destructo'])
  const isMember = (name: string, server: string | null | undefined) =>
    members.has(`${(server ?? '').toLowerCase()}:${name.toLowerCase()}`)
  const fight = (friendlyPlayers: number[]) => ({ id: 1, name: 'Boss', kill: true, difficulty: 4, friendlyPlayers })

  it('counts the players who are members', () => {
    expect(countMembers([fight([1, 2, 3])], actors, isMember)).toBe(2)
  })

  it('counts a player once however many boss fights they were in', () => {
    expect(countMembers([fight([1, 3]), fight([1]), fight([1])], actors, isMember)).toBe(1)
  })

  it('does not count a pug with a member name on another realm', () => {
    expect(countMembers([fight([4])], actors, isMember)).toBe(0)
  })

  it('skips ids with no actor in the log', () => {
    expect(countMembers([fight([99])], actors, isMember)).toBe(0)
  })
})

describe('collapseFights', () => {
  // bossPercentage and fightPercentage default to the same value: most of these tests
  // are single-phase, where the two fields agree, so only the multi-phase test below
  // needs to set them apart.
  const pull = (id: number, name: string, difficulty: number, kill = false, bossPercentage: number | null = 50, fightPercentage = bossPercentage) =>
    ({ id, name, difficulty, kill, bossPercentage, fightPercentage })

  it('collapses wipes on one boss into a single row with the pull count and best pull', () => {
    const rows = collapseFights([pull(1, 'Sszorak', 4, false, 40), pull(2, 'Sszorak', 4, false, 12.5), pull(3, 'Sszorak', 4, false, 30)])
    expect(rows).toEqual([{ id: 1, name: 'Sszorak', kill: false, difficulty: 'Heroic', pulls: 3, bestPercent: 12.5 }])
  })

  it('picks the pull that reached the furthest phase, not the lowest raw boss percent', () => {
    // The Coiled Altar, a real guild wipe night: pull 4 died early in phase 2 at a
    // boss percent of 1.48 (phase bars reset each phase), pull 5 reached phase 3 and
    // died at 11.63, a further pull despite the higher raw number. fightPercentage
    // already accounts for phase progress (4.94 for pull 5 against 50.44 for pull 4)
    // and is what ranking must use; bossPercentage is still what gets shown.
    const rows = collapseFights([
      pull(26, 'The Coiled Altar', 4, false, 48.45, 64.53),
      pull(27, 'The Coiled Altar', 4, false, 77.84, 33.08),
      pull(28, 'The Coiled Altar', 4, false, 94.96, 78.48),
      pull(29, 'The Coiled Altar', 4, false, 1.48, 50.44),
      pull(30, 'The Coiled Altar', 4, false, 11.63, 4.94),
    ])
    expect(rows).toEqual([{ id: 26, name: 'The Coiled Altar', kill: false, difficulty: 'Heroic', pulls: 5, bestPercent: 11.63 }])
  })

  it('splits a boss killed on Normal and then on Heroic into two rows', () => {
    const rows = collapseFights([pull(1, 'Nekzali', 3, true), pull(5, 'Nekzali', 4), pull(6, 'Nekzali', 4, true)])
    expect(rows.map(row => [row.difficulty, row.pulls, row.kill])).toEqual([['Normal', 1, true], ['Heroic', 2, true]])
  })

  it('keeps the order bosses were first pulled in', () => {
    const rows = collapseFights([pull(1, 'B', 4), pull(2, 'A', 4), pull(3, 'B', 4)])
    expect(rows.map(row => row.name)).toEqual(['B', 'A'])
  })
})

describe('toDifficultyProgress', () => {
  const fight = (name: string, difficulty: number, kill: boolean) => ({ id: 1, name, kill, difficulty })

  it('counts distinct bosses pulled and killed per difficulty', () => {
    const fights = [fight('Boss A', 4, true), fight('Boss B', 4, false), fight('Boss A', 3, true)]
    expect(toDifficultyProgress(fights)).toEqual([
      { difficulty: 'Normal', bossesKilled: 1, bossesPulled: 1 },
      { difficulty: 'Heroic', bossesKilled: 1, bossesPulled: 2 },
    ])
  })

  it('counts a boss pulled many times once', () => {
    const fights = [fight('Boss A', 5, false), fight('Boss A', 5, false), fight('Boss A', 5, true)]
    expect(toDifficultyProgress(fights)).toEqual([{ difficulty: 'Mythic', bossesKilled: 1, bossesPulled: 1 }])
  })

  it('orders difficulties Normal, Heroic, Mythic regardless of input order', () => {
    const fights = [fight('Boss A', 5, true), fight('Boss B', 3, true), fight('Boss C', 4, true)]
    expect(toDifficultyProgress(fights).map(d => d.difficulty)).toEqual(['Normal', 'Heroic', 'Mythic'])
  })

  it('returns an empty list for no fights', () => {
    expect(toDifficultyProgress([])).toEqual([])
  })
})

describe('guildRaidFights', () => {
  it('keeps Normal, Heroic and Mythic, and drops LFR and Mythic+ runs', () => {
    const fights = [1, 3, 4, 5, 10].map(difficulty => ({ id: difficulty, name: 'Boss', kill: true, difficulty }))
    expect(guildRaidFights(fights).map(f => f.difficulty)).toEqual([3, 4, 5])
    expect(guildRaidFights(null)).toEqual([])
  })
})

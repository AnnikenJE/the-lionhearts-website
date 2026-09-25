import { describe, expect, it } from 'vitest'
import { countRosterPlayers, dedupeRaidNights } from '../../server/utils/raids'

const night = (
  code: string,
  start: string,
  end: string,
  bossesPulled = 8,
  bossesKilled = 8,
) => ({
  code,
  startedAt: `2026-09-13T${start}:00.000Z`,
  endedAt: `2026-09-13T${end}:00.000Z`,
  durationMs: Date.parse(`2026-09-13T${end}:00Z`) - Date.parse(`2026-09-13T${start}:00Z`),
  bossesPulled,
  bossesKilled,
})

describe('dedupeRaidNights', () => {
  it('keeps nights that do not overlap', () => {
    const raids = [night('a', '17:00', '20:00'), night('b', '12:00', '14:00')]
    expect(dedupeRaidNights(raids).map(raid => raid.code)).toEqual(['a', 'b'])
  })

  it('collapses two logs of the same night into one', () => {
    const raids = [night('a', '17:02', '19:55'), night('b', '16:43', '19:56')]
    expect(dedupeRaidNights(raids)).toHaveLength(1)
  })

  it('keeps the log with more bosses pulled', () => {
    const raids = [night('partial', '17:00', '20:00', 3, 3), night('full', '17:05', '20:00', 8, 7)]
    expect(dedupeRaidNights(raids).map(raid => raid.code)).toEqual(['full'])
  })

  it('breaks a tie on bosses with kills, then with the longer log', () => {
    const fewerKills = night('fewer', '17:00', '20:00', 8, 6)
    const moreKills = night('more', '17:10', '19:00', 8, 7)
    expect(dedupeRaidNights([fewerKills, moreKills]).map(raid => raid.code)).toEqual(['more'])

    const shorter = night('shorter', '17:10', '19:40')
    const longer = night('longer', '16:50', '20:00')
    expect(dedupeRaidNights([shorter, longer]).map(raid => raid.code)).toEqual(['longer'])
  })

  it('does not treat back-to-back logs as the same night', () => {
    const raids = [night('a', '19:00', '20:00'), night('b', '18:00', '19:00')]
    expect(dedupeRaidNights(raids)).toHaveLength(2)
  })
})

describe('countRosterPlayers', () => {
  const actors = [
    { id: 1, name: 'Anniken' },
    { id: 2, name: 'Destructo' },
    { id: 3, name: 'Pugger' },
  ]
  const roster = new Set(['anniken', 'destructo'])

  it('counts the players who are on the roster, ignoring case', () => {
    expect(countRosterPlayers([1, 2, 3], actors, roster)).toBe(2)
  })

  it('counts a player once however many boss fights they were in', () => {
    expect(countRosterPlayers([1, 1, 1, 3], actors, roster)).toBe(1)
  })

  it('skips ids with no name in the log', () => {
    expect(countRosterPlayers([99], actors, roster)).toBe(0)
  })
})

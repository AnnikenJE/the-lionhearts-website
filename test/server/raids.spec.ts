import { describe, expect, it } from 'vitest'
import { countRosterPlayers, groupRaidNights } from '../../server/utils/raids'

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

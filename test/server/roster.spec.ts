import { describe, expect, it } from 'vitest'
import type { RaiderIoMember } from '../../server/utils/roster'
import { realmKey, rosterKey, toMemberIndex, toRosterMembers } from '../../server/utils/roster'

const member = (
  rank: number,
  name: string,
  overrides: Partial<RaiderIoMember['character']> = {},
): RaiderIoMember => ({
  rank,
  character: {
    name,
    class: 'Priest',
    active_spec_name: 'Holy',
    active_spec_role: 'HEALING',
    realm: 'Darkmoon Faire',
    profile_url: `https://raider.io/characters/eu/darkmoon-faire/${name}`,
    ...overrides,
  },
})

describe('toRosterMembers', () => {
  it('flattens the character onto the member', () => {
    expect(toRosterMembers([member(2, 'Aeliana')])).toEqual([
      {
        rank: 2,
        name: 'Aeliana',
        class: 'Priest',
        spec: 'Holy',
        role: 'HEALING',
        realm: 'Darkmoon Faire',
        realmSlug: 'darkmoon-faire',
        profileUrl: 'https://raider.io/characters/eu/darkmoon-faire/Aeliana',
      },
    ])
  })

  it('drops rank 99, which is Raider.IO saying it could not resolve a rank', () => {
    const roster = toRosterMembers([member(99, 'Unmatched'), member(4, 'Knight')])

    // The sentinel must not reach the page, or the member count either.
    expect(roster).toHaveLength(1)
    expect(roster[0]?.name).toBe('Knight')
  })

  it('keeps every real rank, 0 to 9', () => {
    const ranks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const roster = toRosterMembers(ranks.map(rank => member(rank, `Rank${rank}`)))

    expect(roster.map(m => m.rank)).toEqual(ranks)
  })

  it('sorts by rank, then by name within a rank', () => {
    const roster = toRosterMembers([
      member(4, 'Ysera'),
      member(0, 'Anduin'),
      member(4, 'Alleria'),
    ])

    expect(roster.map(m => m.name)).toEqual(['Anduin', 'Alleria', 'Ysera'])
  })

  it('carries a missing spec or role through as null rather than an empty string', () => {
    const [entry] = toRosterMembers([
      member(7, 'Recruit', { active_spec_name: null, active_spec_role: null }),
    ])

    expect(entry?.spec).toBeNull()
    expect(entry?.role).toBeNull()
  })

  it('returns an empty roster rather than throwing on an empty response', () => {
    expect(toRosterMembers([])).toEqual([])
  })
})

describe('rosterKey', () => {
  it('matches however an API spells the realm, and ignores case', () => {
    const key = rosterKey('Hidril', 'Defias Brotherhood')
    expect(rosterKey('hidril', 'DefiasBrotherhood')).toBe(key)
    expect(rosterKey('HIDRIL', 'defias-brotherhood')).toBe(key)
  })

  it('tells two characters with the same name on different realms apart', () => {
    expect(rosterKey('Hidril', 'Kilrogg')).not.toBe(rosterKey('Hidril', 'Defias Brotherhood'))
  })
})

describe('realmKey', () => {
  it('reduces every spelling of a realm to the same key', () => {
    // Raider.IO names, Warcraft Logs names and URL slugs, including the three realms
    // on the roster that a derived slug got wrong.
    expect(realmKey('Chamber of Aspects')).toBe(realmKey('ChamberofAspects'))
    expect(realmKey('Kult der Verdammten')).toBe(realmKey('kult-der-verdammten'))
    expect(realmKey('Azjol-Nerub')).toBe(realmKey('azjolnerub'))
    expect(realmKey('Aggra (Português)')).toBe(realmKey('aggra-portugues'))
  })
})

describe('toMemberIndex', () => {
  const index = toMemberIndex([
    member(1, 'Destructo', { realm: 'Kilrogg', profile_url: 'https://raider.io/characters/eu/kilrogg/Destructo' }),
    member(99, 'Killshaak', { realm: 'Silvermoon', profile_url: 'https://raider.io/characters/eu/silvermoon/Killshaak' }),
    member(3, 'Nerubian', { realm: 'Azjol-Nerub', profile_url: 'https://raider.io/characters/eu/azjolnerub/Nerubian' }),
  ])

  it('holds every member, so someone outside the guild is not in it', () => {
    expect(index.has(rosterKey('Destructo', 'kilrogg'))).toBe(true)
    expect(index.has(rosterKey('Grakal', 'defias-brotherhood'))).toBe(false)
  })

  it('keeps rank 99: the rank is unknown, but the character is in the guild', () => {
    expect(index.has(rosterKey('Killshaak', 'Silvermoon'))).toBe(true)
  })

  it('gives the realm slug from Raider.IO, not one guessed from the name', () => {
    expect(index.get(rosterKey('Nerubian', 'AzjolNerub'))).toBe('azjolnerub')
  })
})

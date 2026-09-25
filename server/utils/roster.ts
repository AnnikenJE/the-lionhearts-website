// The roster transform lives here rather than in the route so it can be tested
// without a Nitro runtime: the route file's body runs defineCachedEventHandler
// the moment it is imported.

// Imported explicitly rather than left to Nitro's auto-import, for the same
// reason: this module has to load under plain Vitest too.
import { realmSlug } from '../../app/utils/wow'
import { isOptedOut } from './optOut'

/** The slice of Raider.IO's guild profile response the roster actually reads. */
export interface RaiderIoMember {
  rank: number
  character: {
    name: string
    class: string
    active_spec_name: string | null
    active_spec_role: string | null
    realm: string
    profile_url: string
  }
}

export interface RosterMember {
  rank: number
  name: string
  class: string
  spec: string | null
  role: string | null
  realm: string
  profileUrl: string
}

/** WoW guilds only have ranks 0-9. Raider.IO returns 99 when it cannot resolve one. */
const UNRANKED_SENTINEL = 99

/**
 * Drops the members Raider.IO could not place and anyone who has opted out,
 * flattens the rest, and orders them by rank then name, so the page never has
 * to sort or filter again.
 */
export const toRosterMembers = (members: RaiderIoMember[]): RosterMember[] =>
  members
    .filter(m => m.rank !== UNRANKED_SENTINEL && !isOptedOut(m.character.name))
    .map(m => ({
      rank: m.rank,
      name: m.character.name,
      class: m.character.class,
      spec: m.character.active_spec_name,
      role: m.character.active_spec_role,
      realm: m.character.realm,
      profileUrl: m.character.profile_url,
    }))
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))

/**
 * One character, as a key that matches however an API spells the realm ("Defias
 * Brotherhood", "DefiasBrotherhood", "defias-brotherhood") and whatever the name's case.
 */
export const rosterKey = (name: string, realm: string) => `${realmSlug(realm)}:${name.toLowerCase()}`

/** Every roster member as a rosterKey, to check whether a character is in the guild. */
export const rosterKeys = (members: Pick<RosterMember, 'name' | 'realm'>[]) =>
  new Set(members.map(member => rosterKey(member.name, member.realm)))

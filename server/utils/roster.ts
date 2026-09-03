// The roster transform lives here rather than in the route so it can be tested
// without a Nitro runtime: the route file's body runs defineCachedEventHandler
// the moment it is imported.

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
 * Drops the members Raider.IO could not place, flattens the rest, and orders
 * them by rank then name, so the page never has to sort or filter again.
 */
export const toRosterMembers = (members: RaiderIoMember[]): RosterMember[] =>
  members
    .filter(m => m.rank !== UNRANKED_SENTINEL)
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

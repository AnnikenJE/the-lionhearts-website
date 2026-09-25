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
  /** The realm as Raider.IO, Warcraft Logs and the Armory spell it in URLs. */
  realmSlug: string
}

/**
 * The realm's slug, read from the character's Raider.IO profile URL
 * (https://raider.io/characters/eu/<slug>/<name>). Deriving it from the name goes
 * wrong: Azjol-Nerub's slug is "azjolnerub", with no hyphen.
 */
const slugFromProfile = (member: RaiderIoMember) =>
  member.character.profile_url.split('/')[5] || realmSlug(member.character.realm)

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
      realmSlug: slugFromProfile(m),
    }))
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))

/**
 * A realm reduced to its letters and digits, lower case, accents dropped. Every API
 * spells realms differently ("Chamber of Aspects", "ChamberofAspects",
 * "chamber-of-aspects", and Azjol-Nerub's slug "azjolnerub"), but they all reduce to
 * the same thing, so this is what realms are compared on.
 */
export const realmKey = (realm: string) =>
  realm.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

/** One character, as a key that matches however an API spells the realm, in any case. */
export const rosterKey = (name: string, realm: string) => `${realmKey(realm)}:${name.toLowerCase()}`

/**
 * Every guild member as rosterKey to realm slug, to check whether a character is in the
 * guild and to link to their page. Unlike toRosterMembers it keeps rank 99: Raider.IO
 * could not place the rank, but the character is still in the guild. Opt-outs stay out.
 */
export const toMemberIndex = (members: RaiderIoMember[]) =>
  new Map(
    members
      .filter(m => !isOptedOut(m.character.name))
      .map(m => [rosterKey(m.character.name, m.character.realm), slugFromProfile(m)]),
  )

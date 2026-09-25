// The guild roster from Raider.IO. The raw member list is cached once, an hour, and
// both the roster page and the membership checks (character pages, raid nights) are
// built from it.
import type { RaiderIoMember } from './roster'

const fetchGuildMembers = defineCachedFunction(
  async () => {
    const data = await $fetch<{ members: RaiderIoMember[] }>(
      'https://raider.io/api/v1/guilds/profile',
      {
        timeout: UPSTREAM_TIMEOUT_MS,
        query: {
          region: 'eu',
          realm: GUILD.serverSlug,
          name: GUILD.name,
          fields: 'members',
        },
      },
    )
    return data.members
  },
  // Raider.IO crawls roughly daily, so an hour is polite and plenty fresh.
  { maxAge: 60 * 60, name: 'roster', getKey: () => 'lionhearts' },
)

// The cache hands back the same array until it refreshes, so each view of it is built
// once per refresh rather than on every request.
const memo = <T>(build: (members: RaiderIoMember[]) => T) => {
  const built = new WeakMap<RaiderIoMember[], T>()
  return async () => {
    const members = await fetchGuildMembers()
    if (!built.has(members)) built.set(members, build(members))
    return built.get(members)!
  }
}

/** The roster as the roster page shows it: ranked members, sorted, opt-outs removed. */
export const fetchRoster = memo(toRosterMembers)

/** Every guild member, rank 99 included, as rosterKey to realm slug. */
export const fetchMemberIndex = memo(toMemberIndex)

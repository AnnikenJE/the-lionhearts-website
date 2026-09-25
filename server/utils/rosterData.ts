// The guild roster from Raider.IO, as a cached function rather than a cached route, so
// the raid lists can also use it to tell a guild night from a pug.
import type { RaiderIoMember } from './roster'

export const fetchRoster = defineCachedFunction(
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

    return toRosterMembers(data.members)
  },
  // Raider.IO crawls roughly daily, so an hour is polite and plenty fresh.
  { maxAge: 60 * 60, name: 'roster', getKey: () => 'lionhearts' },
)

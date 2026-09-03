// Runs server-side so the browser never hits Raider.IO directly (avoids CORS)
// and the response can be cached.
import type { RaiderIoMember } from '../utils/roster'

// Re-exported so the page can keep importing the response type from the route
// that returns it, while the transform stays testable in server/utils.
export type { RosterMember } from '../utils/roster'

export default defineCachedEventHandler(
  async () => {
    const data = await $fetch<{ members: RaiderIoMember[] }>(
      'https://raider.io/api/v1/guilds/profile',
      {
        query: {
          region: 'eu',
          realm: 'darkmoon-faire',
          name: 'The Lionhearts',
          fields: 'members',
        },
      },
    )

    return toRosterMembers(data.members)
  },
  // Raider.IO crawls roughly daily, so an hour is polite and plenty fresh.
  { maxAge: 60 * 60, name: 'roster', getKey: () => 'lionhearts' },
)

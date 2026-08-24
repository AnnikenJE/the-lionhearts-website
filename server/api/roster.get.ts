// Runs server-side so the browser never hits Raider.IO directly (avoids CORS)
// and the response can be cached.

interface RaiderIoMember {
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

export default defineCachedEventHandler(
  async (): Promise<RosterMember[]> => {
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

    return data.members
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
  },
  // Raider.IO crawls roughly daily, so an hour is polite and plenty fresh.
  { maxAge: 60 * 60, name: 'roster', getKey: () => 'lionhearts' },
)

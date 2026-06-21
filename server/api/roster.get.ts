// Fetches the guild roster from the public Raider.IO API.
// Runs server-side so the browser never hits Raider.IO directly (avoids CORS)
// and the response can be cached.

interface RaiderIoMember {
  rank: number
  character: {
    name: string
    race: string
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
      .map((m) => ({
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
  // Raider.IO crawls roughly daily; cache for an hour to stay polite.
  { maxAge: 60 * 60, name: 'roster', getKey: () => 'lionhearts' },
)

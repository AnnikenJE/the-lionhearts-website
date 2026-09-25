// One character: Raider.IO's profile (gear, Mythic+, raid progression) and Warcraft
// Logs' rankings for one raid tier, plus the guild raid nights the character was in.
// Runs server-side so both APIs stay off the browser and the result can be cached.
import { realmSlug } from '../../../../app/utils/wow'
import type {
  CharacterDifficultyRankings,
  CharacterGearItem,
  CharacterMythicRun,
  CharacterRaidNight,
  CharacterRaidProgress,
  RaiderIoProfile,
  WclZoneRankings,
} from '../../../utils/character'

export type {
  CharacterBossRanking,
  CharacterDifficultyRankings,
  CharacterGearItem,
  CharacterMythicRun,
  CharacterRaidNight,
  CharacterRaidProgress,
} from '../../../utils/character'

export interface CharacterProfile {
  name: string
  realm: string
  realmSlug: string
  className: string
  spec: string | null
  role: string | null
  race: string | null
  faction: string | null
  thumbnailUrl: string | null
  guild: { name: string, realm: string } | null
  achievementPoints: number | null
  itemLevel: number | null
  gear: CharacterGearItem[]
  mythicPlus: { score: number, color: string, bestRuns: CharacterMythicRun[] } | null
  raidProgression: CharacterRaidProgress[]
  /** Null when the character has no Warcraft Logs profile, hides it, or the API is not configured. */
  logs: {
    tier: { id: number, name: string }
    tiers: { id: number, name: string }[]
    metric: 'dps' | 'hps'
    difficulties: CharacterDifficultyRankings[]
  } | null
  raidNights: CharacterRaidNight[]
  links: { raiderIo: string | null, warcraftLogs: string, armory: string }
}

// Validated before anything is forwarded upstream, like a raid code. Realm slugs are
// lower-case words joined by hyphens. Character names are 2 to 12 letters, accented
// letters included, and nothing else.
const REALM_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const NAME_PATTERN = /^\p{L}{2,12}$/u

interface WclCharacterResponse {
  characterData: {
    character: {
      name: string
      hidden: boolean
      normal: WclZoneRankings | null
      heroic: WclZoneRankings | null
      mythic: WclZoneRankings | null
    } | null
  }
}

const WCL_QUERY = `
  query Character($name: String!, $realm: String!, $region: String!, $zone: Int!, $metric: CharacterPageRankingMetricType!) {
    characterData {
      character(name: $name, serverSlug: $realm, serverRegion: $region) {
        name
        hidden
        normal: zoneRankings(zoneID: $zone, difficulty: 3, metric: $metric)
        heroic: zoneRankings(zoneID: $zone, difficulty: 4, metric: $metric)
        mythic: zoneRankings(zoneID: $zone, difficulty: 5, metric: $metric)
      }
    }
  }
`

const fetchRaiderIo = async (realm: string, name: string) => {
  try {
    return await $fetch<RaiderIoProfile>('https://raider.io/api/v1/characters/profile', {
      query: {
        region: 'eu',
        realm,
        name,
        fields: 'gear,guild,raid_progression,mythic_plus_scores_by_season:current,mythic_plus_best_runs',
      },
    })
  }
  catch (error) {
    // Raider.IO answers an unknown character with a 400, which means "not found".
    if ((error as { statusCode?: number }).statusCode === 400) return null
    throw error
  }
}

const fetchLogs = async (realm: string, name: string, zone: number, metric: 'dps' | 'hps') => {
  try {
    const data = await wclQuery<WclCharacterResponse>(WCL_QUERY, {
      name,
      realm,
      region: GUILD.serverRegion,
      zone,
      metric,
    })
    return data.characterData.character
  }
  catch (error) {
    // Not configured: the page still has Raider.IO's half, so it renders without logs.
    if ((error as { statusCode?: number }).statusCode === 503) return null
    throw error
  }
}

// Every guild raid night currently listed, in detail. Both are cached on their own,
// so this is cheap after the first character page of the hour.
const fetchAttendance = async (realm: string, name: string) => {
  const nights = await fetchRaidNights().catch(() => [])
  const details = await Promise.all(nights.map(night => fetchRaid(night.code).catch(() => null)))
  const raids = details.filter(raid => raid !== null)

  return findRaidNights(raids, name, server => realmSlug(server ?? GUILD.serverSlug) === realm)
}

const fetchCharacter = defineCachedFunction(
  async (realm: string, name: string, tierId: number): Promise<CharacterProfile | null> => {
    const tier = raidTier(tierId)
    const raiderIo = await fetchRaiderIo(realm, name)
    const metric = rankingMetric(raiderIo?.active_spec_role)

    const [wcl, raidNights] = await Promise.all([
      fetchLogs(realm, name, tier.id, metric),
      fetchAttendance(realm, name),
    ])

    if (!raiderIo && !wcl) return null

    const displayName = raiderIo?.name ?? wcl?.name ?? name
    const season = raiderIo?.mythic_plus_scores_by_season?.[0]
    const bestRuns = toMythicPlusRuns(raiderIo?.mythic_plus_best_runs)

    return {
      name: displayName,
      realm: raiderIo?.realm ?? realm,
      realmSlug: realm,
      className: raiderIo?.class ?? '',
      spec: raiderIo?.active_spec_name ?? raidNights[0]?.spec ?? null,
      role: raiderIo?.active_spec_role ?? null,
      race: raiderIo?.race ?? null,
      faction: raiderIo?.faction ?? null,
      thumbnailUrl: raiderIo?.thumbnail_url ?? null,
      guild: raiderIo?.guild ?? null,
      achievementPoints: raiderIo?.achievement_points ?? null,
      itemLevel: raiderIo?.gear?.item_level_equipped ?? null,
      gear: toGear(raiderIo?.gear?.items),
      mythicPlus: season && (season.scores.all > 0 || bestRuns.length > 0)
        ? { score: season.scores.all, color: season.segments.all.color, bestRuns }
        : null,
      raidProgression: toRaidProgression(raiderIo?.raid_progression),
      // A character can hide its logs on Warcraft Logs. That is respected here too.
      logs: wcl && !wcl.hidden
        ? {
            tier: { id: tier.id, name: tier.name },
            tiers: RAID_TIERS.map(({ id, name }) => ({ id, name })),
            metric,
            difficulties: [wcl.mythic, wcl.heroic, wcl.normal]
              .map(toDifficultyRankings)
              .filter(difficulty => difficulty !== null),
          }
        : null,
      raidNights,
      links: {
        raiderIo: raiderIo?.profile_url ?? null,
        warcraftLogs: `https://www.warcraftlogs.com/character/eu/${realm}/${encodeURIComponent(displayName)}`,
        armory: `https://worldofwarcraft.blizzard.com/en-gb/character/eu/${realm}/${encodeURIComponent(displayName.toLowerCase())}`,
      },
    }
  },
  {
    name: 'character',
    getKey: (realm: string, name: string, tierId: number) => `${realm}:${name.toLowerCase()}:${tierId}`,
    // Refreshed once an hour, like the raid pages.
    maxAge: 60 * 60,
  },
)

export default defineEventHandler(async (event): Promise<CharacterProfile> => {
  const realm = getRouterParam(event, 'realm') ?? ''
  const name = decodeURIComponent(getRouterParam(event, 'name') ?? '')

  // An opted-out character gets the same 404 as one that does not exist, so the page
  // does not even confirm it is there.
  if (!REALM_PATTERN.test(realm) || !NAME_PATTERN.test(name) || isOptedOut(name)) {
    throw createError({ statusCode: 404, statusMessage: 'Character not found' })
  }

  const character = await fetchCharacter(realm, name, raidTier(getQuery(event).tier).id)

  if (!character) {
    throw createError({ statusCode: 404, statusMessage: 'Character not found' })
  }

  return character
})

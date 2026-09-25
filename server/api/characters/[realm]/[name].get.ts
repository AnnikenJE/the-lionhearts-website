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
      timeout: UPSTREAM_TIMEOUT_MS,
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
    }, 'low')
    return data.characterData.character
  }
  catch (error) {
    // Not configured: the page still has Raider.IO's half, so it renders without logs.
    if (isNotConfigured(error)) return null
    throw error
  }
}

type Soft = <T>(promise: Promise<T>, fallback: T) => Promise<T>

// Every guild raid night in the current tier, in detail. Both are cached on their own,
// so this is cheap after the first character page of the hour.
const fetchAttendance = async (realm: string, name: string, soft: Soft) => {
  const nights = await soft(fetchRaidNights(RAID_TIERS[0].id), [])
  const details = await Promise.all(nights.map(night => soft(fetchRaid(night.code), null)))
  const raids = details.filter(raid => raid !== null)

  return findRaidNights(raids, name, server => realmSlug(server ?? GUILD.serverSlug) === realm)
}

// Raidbots' bonus id table is 1.7 MB; only the small track lookup built from it is
// cached, for a day, since tracks only change with a new season. If Raidbots is down
// the gear simply shows without tracks.
const fetchUpgradeTracks = defineCachedFunction(
  async () => toUpgradeTracks(await $fetch('https://www.raidbots.com/static/data/live/bonuses.json', { timeout: UPSTREAM_TIMEOUT_MS })),
  { name: 'upgrade-tracks', getKey: () => 'live', maxAge: 24 * 60 * 60 },
)

interface CharacterResult {
  profile: CharacterProfile | null
  /**
   * False when a part failed for a reason that passes on its own (an outage, a
   * timeout, a query refused to protect the hourly budget). The page still renders
   * without that part, but the result is only kept for INCOMPLETE_MAX_AGE_MS, so the
   * gap closes soon instead of lasting the full hour.
   */
  complete: boolean
}

const fetchCharacter = defineCachedFunction(
  async (realm: string, name: string, tierId: number): Promise<CharacterResult> => {
    let complete = true
    // Missing credentials are a setting, not a failure: nothing will change on a
    // retry, so they do not make the result incomplete.
    const soft: Soft = (promise, fallback) =>
      promise.catch((error) => {
        if (!isNotConfigured(error)) complete = false
        return fallback
      })

    const tier = raidTier(tierId)
    const raiderIo = await fetchRaiderIo(realm, name)
    const metric = rankingMetric(raiderIo?.active_spec_role)

    const [wcl, raidNights, tracks] = await Promise.all([
      soft(fetchLogs(realm, name, tier.id, metric), null),
      fetchAttendance(realm, name, soft),
      soft(fetchUpgradeTracks(), {}),
    ])

    if (!raiderIo && !wcl) return { profile: null, complete }

    const displayName = raiderIo?.name ?? wcl?.name ?? name
    const season = raiderIo?.mythic_plus_scores_by_season?.[0]
    const bestRuns = toMythicPlusRuns(raiderIo?.mythic_plus_best_runs)

    const profile: CharacterProfile = {
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
      gear: toGear(raiderIo?.gear?.items, tracks),
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

    return { profile, complete }
  },
  {
    name: 'character',
    getKey: (realm: string, name: string, tierId: number) => `${realm}:${name.toLowerCase()}:${tierId}`,
    // Refreshed once an hour, like the raid pages.
    maxAge: 60 * 60,
    validate: entry =>
      entry.value !== undefined
      && (entry.value.complete || Date.now() - (entry.mtime ?? 0) < INCOMPLETE_MAX_AGE_MS),
  },
)

export default defineEventHandler(async (event): Promise<CharacterProfile> => {
  const realm = getRouterParam(event, 'realm') ?? ''
  // decode: true would throw on a malformed percent sequence ("%E0") and turn a name
  // that cannot exist into a 500; an empty name fails the pattern below and is a 404.
  const name = (() => {
    try {
      return decodeURIComponent(getRouterParam(event, 'name') ?? '')
    }
    catch {
      return ''
    }
  })()

  // An opted-out character gets the same 404 as one that does not exist, so the page
  // does not even confirm it is there.
  if (!REALM_PATTERN.test(realm) || !NAME_PATTERN.test(name) || isOptedOut(name)) {
    throw createError({ statusCode: 404, statusMessage: 'Character not found' })
  }

  const { profile, complete } = await fetchCharacter(realm, name, raidTier(getQuery(event).tier).id)

  if (!profile) {
    // Nothing found, but only a real 404 if nothing failed along the way either.
    throw complete
      ? createError({ statusCode: 404, statusMessage: 'Character not found' })
      : createError({ statusCode: 502, statusMessage: 'Could not reach Raider.IO or Warcraft Logs' })
  }

  return profile
})

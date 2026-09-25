// One character: Raider.IO's profile (gear, Mythic+, raid progression) and Warcraft
// Logs' rankings for one raid tier, plus the guild raid nights the character was in.
// Runs server-side so both APIs stay off the browser and the result can be cached.
import type {
  CharacterDifficultyRankings,
  CharacterGearItem,
  CharacterMythicRun,
  CharacterRaidNight,
  CharacterRaidProgress,
  RaiderIoProfile,
  WclZoneRankings,
} from '../../../utils/character'
import type { RaidTier } from '../../../utils/warcraftlogs'

export type { CharacterDifficultyRankings } from '../../../utils/character'

export interface CharacterProfile {
  name: string
  realm: string
  className: string
  spec: string | null
  race: string | null
  thumbnailUrl: string | null
  guildName: string | null
  achievementPoints: number | null
  itemLevel: number | null
  gear: CharacterGearItem[]
  mythicPlus: { score: number, color: string, bestRuns: CharacterMythicRun[] } | null
  raidProgression: CharacterRaidProgress[]
  /** Null when the character has no Warcraft Logs profile, hides it, or the API is not configured. */
  logs: {
    tier: RaidTier
    tiers: readonly RaidTier[]
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

// Raider.IO's half does not depend on the tier, so it is cached per character on its
// own and a tier switch only asks Warcraft Logs. An unknown character is a 400 there,
// which means "not found".
const fetchRaiderIo = defineCachedFunction(
  (realm: string, name: string) =>
    $fetch<RaiderIoProfile>('https://raider.io/api/v1/characters/profile', {
      timeout: UPSTREAM_TIMEOUT_MS,
      query: {
        region: GUILD.serverRegion.toLowerCase(),
        realm,
        name,
        fields: 'gear,guild,raid_progression,mythic_plus_scores_by_season:current,mythic_plus_best_runs',
      },
    }).catch((error) => {
      if ((error as { statusCode?: number }).statusCode === 400) return null
      throw error
    }),
  { name: 'raiderio-character', getKey: (realm: string, name: string) => `${realm}:${name.toLowerCase()}`, maxAge: 60 * 60 },
)

const fetchLogs = async (realm: string, name: string, zone: number, metric: 'dps' | 'hps') =>
  (await wclQuery<WclCharacterResponse>(WCL_QUERY, { name, realm, region: GUILD.serverRegion, zone, metric }, 'low'))
    .characterData.character

type Soft = <T>(promise: Promise<T>, fallback: T) => Promise<T>

// Every guild raid night in the current tier, in detail. Both are cached on their own
// and shared with the raid pages; asked for at low priority, since a character page is
// extra and should yield to them when the hourly budget runs short.
const fetchAttendance = async (realm: string, name: string, soft: Soft) => {
  const nights = await soft(fetchRaidNights(RAID_TIERS[0].id), [])
  const details = await Promise.all(nights.map(night => soft(fetchRaid(night.code, 'low'), null)))
  return findRaidNights(details.filter(raid => raid !== null), name, realm)
}

// Raidbots' bonus id table is 1.7 MB; only the small track lookup built from it is
// cached, for a day, since tracks only change with a new season. If Raidbots is down
// the gear simply shows without tracks.
const fetchUpgradeTracks = defineCachedFunction(
  async () => toUpgradeTracks(await $fetch('https://www.raidbots.com/static/data/live/bonuses.json', { timeout: UPSTREAM_TIMEOUT_MS })),
  { name: 'upgrade-tracks', getKey: () => 'live', maxAge: 24 * 60 * 60 },
)

const fetchCharacter = defineCachedFunction(
  async (realm: string, name: string, zone: number) => {
    // A part that fails for a reason that passes on its own (an outage, a timeout, a
    // query refused to protect the budget) leaves the page without it and makes the
    // result incomplete, so it is kept only briefly (keepIfComplete). Missing
    // credentials are a setting, not a failure, so they do not count.
    let complete = true
    const soft: Soft = (promise, fallback) =>
      promise.catch((error) => {
        if (!isNotConfigured(error)) complete = false
        return fallback
      })

    // Nights and tracks do not depend on Raider.IO, so they start alongside it; the
    // logs wait for it only because the ranking metric follows the character's role.
    const nightsPromise = fetchAttendance(realm, name, soft)
    const tracksPromise = soft(fetchUpgradeTracks(), {})
    const raiderIo = await fetchRaiderIo(realm, name)
    const metric = rankingMetric(raiderIo?.active_spec_role)
    const [wcl, raidNights, tracks] = await Promise.all([
      soft(fetchLogs(realm, name, zone, metric), null),
      nightsPromise,
      tracksPromise,
    ])

    if (!raiderIo && !wcl) return { profile: null, complete }

    const displayName = raiderIo?.name ?? wcl?.name ?? name
    const season = raiderIo?.mythic_plus_scores_by_season?.[0]
    const bestRuns = toMythicPlusRuns(raiderIo?.mythic_plus_best_runs)

    const profile: CharacterProfile = {
      name: displayName,
      realm: raiderIo?.realm ?? realm,
      className: raiderIo?.class ?? '',
      spec: raiderIo?.active_spec_name ?? raidNights[0]?.spec ?? null,
      race: raiderIo?.race ?? null,
      thumbnailUrl: raiderIo?.thumbnail_url ?? null,
      guildName: raiderIo?.guild?.name ?? null,
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
            tier: raidTier(zone),
            tiers: RAID_TIERS,
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
    getKey: (realm: string, name: string, zone: number) => `${realm}:${name.toLowerCase()}:${zone}`,
    // Refreshed once an hour, like the raid pages.
    maxAge: 60 * 60,
    validate: keepIfComplete,
  },
)

const notFound = () => createError({ statusCode: 404, statusMessage: 'Character not found' })

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

  if (!REALM_PATTERN.test(realm) || !NAME_PATTERN.test(name)) throw notFound()

  // Only the guild's own members get a page; anyone else, a pug or a former member,
  // gets the same 404 as a name that does not exist, and so does an opted-out member
  // (the index leaves them out). The realm is looked up in the index too, so the APIs
  // get Raider.IO's own slug for it.
  const members = await fetchMemberIndex().catch(() => {
    throw createError({ statusCode: 502, statusMessage: 'Could not reach Raider.IO' })
  })
  const memberRealm = members.get(rosterKey(name, realm))
  if (!memberRealm) throw notFound()

  const { profile, complete } = await fetchCharacter(memberRealm, name, raidTier(getQuery(event).tier).id)

  // Nothing found is only a real 404 if nothing failed along the way either.
  if (!profile) {
    throw complete ? notFound() : createError({ statusCode: 502, statusMessage: 'Could not reach Raider.IO or Warcraft Logs' })
  }

  return profile
})

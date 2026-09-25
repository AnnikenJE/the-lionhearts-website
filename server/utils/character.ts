// The character page's transforms: Raider.IO's profile and Warcraft Logs' rankings in,
// the page's CharacterProfile out. Pure, and kept apart from the route so they can be
// tested without a Nitro runtime, the same split as server/utils/roster.ts.

// Imported explicitly rather than left to Nitro's auto-import, so this module also
// loads under plain Vitest.
import { difficultyName } from './warcraftlogs'

// Raider.IO ------------------------------------------------------------------------

interface RaiderIoItem {
  item_id: number
  item_level: number
  name: string
  icon: string
  item_quality: number
}

interface RaiderIoRun {
  dungeon: string
  short_name: string
  mythic_level: number
  num_keystone_upgrades: number
  score: number
  clear_time_ms: number
  par_time_ms: number
  completed_at: string
  url: string
}

interface RaiderIoRaidProgress {
  summary: string
  total_bosses: number
  normal_bosses_killed: number
  heroic_bosses_killed: number
  mythic_bosses_killed: number
}

/** The slice of Raider.IO's character profile the page reads. */
export interface RaiderIoProfile {
  name: string
  race: string
  class: string
  active_spec_name: string | null
  active_spec_role: string | null
  faction: string
  achievement_points: number
  thumbnail_url: string | null
  realm: string
  profile_url: string
  guild: { name: string, realm: string } | null
  gear?: { item_level_equipped: number, items: Record<string, RaiderIoItem> }
  mythic_plus_scores_by_season?: {
    scores: { all: number }
    segments: { all: { color: string } }
  }[]
  mythic_plus_best_runs?: RaiderIoRun[]
  raid_progression?: Record<string, RaiderIoRaidProgress>
}

// Warcraft Logs --------------------------------------------------------------------

interface WclAllStars {
  spec: string
  points: number
  possiblePoints: number
  rank: number
  regionRank: number
  serverRank: number
  rankPercent: number
}

interface WclBossRanking {
  encounter: { name: string }
  rankPercent: number | null
  medianPercent: number | null
  totalKills: number
  fastestKill: number
  spec: string | null
  bestAmount: number
  allStars: { serverRank: number } | null
  bestRank: { ilvl: number } | null
}

/** One `zoneRankings` JSON blob, for one difficulty. */
export interface WclZoneRankings {
  difficulty: number
  metric: string
  bestPerformanceAverage: number | null
  medianPerformanceAverage: number | null
  allStars: WclAllStars[] | null
  rankings: WclBossRanking[] | null
}

// The page's shape -----------------------------------------------------------------

export interface CharacterGearItem {
  slot: string
  name: string
  itemId: number
  itemLevel: number
  /** Blizzard's quality integer: 3 rare, 4 epic, 5 legendary. */
  quality: number
  icon: string
}

export interface CharacterMythicRun {
  dungeon: string
  shortName: string
  level: number
  /** Keystone upgrades: 0 is a depleted key, 1 to 3 is timed. */
  upgrades: number
  score: number
  clearTimeMs: number
  parTimeMs: number
  completedAt: string
  url: string
}

export interface CharacterRaidProgress {
  raid: string
  summary: string
  total: number
  normal: number
  heroic: number
  mythic: number
}

export interface CharacterBossRanking {
  boss: string
  /** Best parse this tier, 0-100. Null when the boss has not been killed. */
  bestPercent: number | null
  medianPercent: number | null
  kills: number
  /** Best DPS or HPS, whichever the metric is. */
  bestAmount: number | null
  fastestKillMs: number | null
  spec: string | null
  itemLevel: number | null
  serverRank: number | null
}

export interface CharacterDifficultyRankings {
  difficulty: string
  bestAverage: number | null
  medianAverage: number | null
  allStars: {
    spec: string
    points: number
    possiblePoints: number
    rank: number
    regionRank: number
    serverRank: number
    rankPercent: number
  } | null
  bosses: CharacterBossRanking[]
}

export interface CharacterRaidNight {
  code: string
  zone: string | null
  startedAt: string
  spec: string | null
  role: 'tank' | 'healer' | 'dps'
}

// Transforms -----------------------------------------------------------------------

const SLOT_NAMES: Record<string, string> = {
  head: 'Head',
  neck: 'Neck',
  shoulder: 'Shoulders',
  back: 'Back',
  chest: 'Chest',
  shirt: 'Shirt',
  tabard: 'Tabard',
  waist: 'Waist',
  wrist: 'Wrists',
  hands: 'Hands',
  legs: 'Legs',
  feet: 'Feet',
  finger1: 'Ring',
  finger2: 'Ring',
  trinket1: 'Trinket',
  trinket2: 'Trinket',
  mainhand: 'Main hand',
  offhand: 'Off hand',
}

/** Equipped items in Raider.IO's own slot order, which is the character sheet's. */
export const toGear = (items: Record<string, RaiderIoItem> | undefined): CharacterGearItem[] =>
  Object.entries(items ?? {}).map(([slot, item]) => ({
    slot: SLOT_NAMES[slot] ?? slot,
    name: item.name,
    itemId: item.item_id,
    itemLevel: item.item_level,
    quality: item.item_quality,
    icon: item.icon,
  }))

export const toMythicPlusRuns = (runs: RaiderIoRun[] | undefined): CharacterMythicRun[] =>
  (runs ?? [])
    .map(run => ({
      dungeon: run.dungeon,
      shortName: run.short_name,
      level: run.mythic_level,
      upgrades: run.num_keystone_upgrades,
      score: run.score,
      clearTimeMs: run.clear_time_ms,
      parTimeMs: run.par_time_ms,
      completedAt: run.completed_at,
      url: run.url,
    }))
    .sort((a, b) => b.score - a.score)

const titleCase = (slug: string) =>
  slug
    .split('-')
    .map((word, index) =>
      // Articles and prepositions stay lower case inside a name, as in the game.
      index > 0 && ['of', 'the'].includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')

/**
 * Raider.IO's raid progression, newest raid first. The `tier-*` entries are Raider.IO's
 * own roll-ups across a whole tier and would repeat the raids they cover, and a raid
 * with nothing killed says nothing, so both are left out.
 */
export const toRaidProgression = (
  progression: Record<string, RaiderIoRaidProgress> | undefined,
): CharacterRaidProgress[] =>
  Object.entries(progression ?? {})
    .filter(([slug, raid]) => !slug.startsWith('tier-') && raid.normal_bosses_killed + raid.heroic_bosses_killed + raid.mythic_bosses_killed > 0)
    .map(([slug, raid]) => ({
      raid: titleCase(slug),
      summary: raid.summary,
      total: raid.total_bosses,
      normal: raid.normal_bosses_killed,
      heroic: raid.heroic_bosses_killed,
      mythic: raid.mythic_bosses_killed,
    }))

/**
 * One difficulty's rankings, or null when the character has no kill on it at all, so
 * the page only offers the difficulties that have something to show.
 */
export const toDifficultyRankings = (
  zone: WclZoneRankings | null | undefined,
): CharacterDifficultyRankings | null => {
  const rankings = zone?.rankings ?? []
  if (!zone || !rankings.some(ranking => ranking.totalKills > 0)) return null

  const allStars = zone.allStars?.[0] ?? null

  return {
    difficulty: difficultyName(zone.difficulty) ?? `Difficulty ${zone.difficulty}`,
    bestAverage: zone.bestPerformanceAverage,
    medianAverage: zone.medianPerformanceAverage,
    allStars: allStars && {
      spec: allStars.spec,
      points: allStars.points,
      possiblePoints: allStars.possiblePoints,
      rank: allStars.rank,
      regionRank: allStars.regionRank,
      serverRank: allStars.serverRank,
      rankPercent: allStars.rankPercent,
    },
    bosses: rankings.map((ranking) => {
      const killed = ranking.totalKills > 0
      return {
        boss: ranking.encounter.name,
        bestPercent: killed ? ranking.rankPercent : null,
        medianPercent: killed ? ranking.medianPercent : null,
        kills: ranking.totalKills,
        bestAmount: killed ? ranking.bestAmount : null,
        fastestKillMs: killed ? ranking.fastestKill : null,
        spec: ranking.spec,
        itemLevel: ranking.bestRank?.ilvl ?? null,
        serverRank: killed ? ranking.allStars?.serverRank ?? null : null,
      }
    }),
  }
}

/** Raider.IO calls a healer's role "HEALING"; everything else is ranked on damage. */
export const rankingMetric = (role: string | null | undefined): 'dps' | 'hps' =>
  role?.toUpperCase() === 'HEALING' ? 'hps' : 'dps'

interface AttendedRaid {
  code: string
  zone: string | null
  startedAt: string
  tanks: { name: string, spec: string | null, server: string | null }[]
  healers: { name: string, spec: string | null, server: string | null }[]
  dps: { name: string, spec: string | null, server: string | null }[]
}

/**
 * The raid nights a character was in, from the raid details. A player entry is
 * matched on name (case-insensitive) and on realm, since two characters on different
 * realms can share a name. `sameRealm` decides the realm match so the slug logic stays
 * in one place; an entry with no realm is taken to be on the guild's own.
 */
export const findRaidNights = (
  raids: AttendedRaid[],
  name: string,
  sameRealm: (server: string | null) => boolean,
): CharacterRaidNight[] => {
  const wanted = name.toLowerCase()
  const nights: CharacterRaidNight[] = []

  for (const raid of raids) {
    const roles = [['tank', raid.tanks], ['healer', raid.healers], ['dps', raid.dps]] as const
    for (const [role, players] of roles) {
      const player = players.find(p => p.name.toLowerCase() === wanted && sameRealm(p.server))
      if (player) {
        nights.push({ code: raid.code, zone: raid.zone, startedAt: raid.startedAt, spec: player.spec, role })
        break
      }
    }
  }

  return nights
}

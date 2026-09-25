// The guild's raid nights in one raid tier. A cached function rather than a cached
// route, so the character pages can reuse it to find the nights a character attended.
// wclQuery, GUILD and the helpers from raids.ts are Nitro auto-imports.
import type { WclActor, WclFight } from './raids'

interface WclReport {
  code: string
  title: string
  startTime: number
  endTime: number
  zone: { name: string } | null
  fights: WclFight[] | null
  masterData: { actors: WclActor[] | null } | null
}

interface ReportsResponse {
  reportData: { reports: { data: WclReport[] } }
}

export interface RaidSummary {
  /** The log the row links to: the one that captured the most of the night. */
  code: string
  title: string
  zone: string | null
  /** ISO string, so the page can reuse formatDate and put it in <time datetime>. */
  startedAt: string
  /** The hardest difficulty pulled that night. */
  difficulty: string | null
  bossesKilled: number
  bossesPulled: number
  raiderCount: number
  /** How many logs the night was recorded in, when more than one covered it. */
  logCount: number
}

const bossNames = (fights: WclFight[], killedOnly = false) =>
  new Set(fights.filter(fight => !killedOnly || fight.kill).map(fight => fight.name))

/**
 * One raid night from the logs that recorded it. Bosses are counted across all of
 * them, so a night logged in parts shows everything that happened. The row links to
 * the log with the most bosses (then kills, then length), and the headcount is that
 * of the largest log: actor ids differ between logs, so players cannot be added up.
 * Every fight here is Normal, Heroic or Mythic and every log has one, so the hardest
 * difficulty is a plain max.
 */
const toRaidSummary = (logs: WclReport[]): RaidSummary => {
  const fights = logs.flatMap(log => log.fights ?? [])

  const main = [...logs].sort((a, b) =>
    bossNames(b.fights ?? []).size - bossNames(a.fights ?? []).size
    || bossNames(b.fights ?? [], true).size - bossNames(a.fights ?? [], true).size
    || (b.endTime - b.startTime) - (a.endTime - a.startTime),
  )[0]!

  return {
    code: main.code,
    title: main.title,
    zone: main.zone?.name ?? null,
    startedAt: new Date(Math.min(...logs.map(log => log.startTime))).toISOString(),
    difficulty: difficultyName(Math.max(...fights.map(fight => fight.difficulty!))),
    // Distinct boss names, not raw fight counts: twenty pulls on one boss is one boss
    // pulled, not twenty.
    bossesKilled: bossNames(fights, true).size,
    bossesPulled: bossNames(fights).size,
    raiderCount: Math.max(...logs.map(log => bossPlayerIds(log.fights ?? []).size)),
    logCount: logs.length,
  }
}

// The fields both queries ask for. The actors, with their realm, tell a guild night
// from a pug.
const REPORT_FIELDS = `
  data {
    code
    title
    startTime
    endTime
    zone { name }
    fights(killType: Encounters) { id name kill difficulty friendlyPlayers }
    masterData { actors(type: "Player") { id name server } }
  }
`

const REPORTS_QUERY = `
  query Raids($name: String!, $slug: String!, $region: String!, $zone: Int!, $limit: Int!) {
    reportData {
      reports(guildName: $name, guildServerSlug: $slug, guildServerRegion: $region, zoneID: $zone, limit: $limit) {
        ${REPORT_FIELDS}
      }
    }
  }
`

const LOGGER_REPORTS_QUERY = `
  query LoggerRaids($user: Int!, $zone: Int!, $limit: Int!) {
    reportData {
      reports(userID: $user, zoneID: $zone, limit: $limit) {
        ${REPORT_FIELDS}
      }
    }
  }
`

/**
 * How many guild members a log needs in its boss fights to count as a guild night.
 * Guild nights run 11 to 22, except two Castle Nathria nights from 2021 with 6 and 7,
 * since many of those raiders have left. A guild-tagged log only needs 5, enough to
 * keep out a member's pug or solo run; a logger's personal log, which is far more often
 * a pug, needs 8. Measured 2026-09-25.
 */
const GUILD_TAGGED_MIN_MEMBERS = 5
const PERSONAL_LOG_MIN_MEMBERS = 8

/** A raid group is thirty players at most; a bigger log is an event, not a raid night. */
const RAID_GROUP_MAX = 30

// The logs the guild tagged as its own. Fifty per query: no tier so far has more than
// about twenty, and a hundred logs with their fights break Warcraft Logs' query
// complexity cap.
const fetchGuildReports = async (zone: number) =>
  (await wclQuery<ReportsResponse>(REPORTS_QUERY, {
    name: GUILD.name,
    slug: GUILD.serverSlug,
    region: GUILD.serverRegion,
    zone,
    limit: 50,
  })).reportData.reports.data

// The guild's raid loggers' personal logs in the tier, unfiltered. Low priority: this
// is the expensive half of a tier and the first to yield to the budget. `complete` is
// false when any logger's logs could not be fetched.
const fetchLoggerReports = async (zone: number) => {
  let complete = true
  const perLogger = await Promise.all(
    GUILD_LOGGERS.map(logger =>
      wclQuery<ReportsResponse>(LOGGER_REPORTS_QUERY, { user: logger.id, zone, limit: 25 }, 'low')
        .then(data => data.reportData.reports.data)
        .catch(() => {
          complete = false
          return []
        }),
    ),
  )
  return { reports: perLogger.flat(), complete }
}

const loadRaidNights = async (zone: number) => {
  const [guildReports, logger, members] = await Promise.all([
    fetchGuildReports(zone),
    fetchLoggerReports(zone),
    fetchMemberIndex().catch(() => null),
  ])

  // Without the roster there is no telling a guild night from a pug: guild-tagged logs
  // are kept unchecked, the loggers' personal logs are left out, and the result counts
  // as incomplete so it is fetched again soon.
  const isMember = (name: string, server: string | null | undefined) =>
    !!members?.has(rosterKey(name, server ?? GUILD.serverSlug))
  const memberCount = (report: WclReport) => countMembers(report.fights ?? [], report.masterData?.actors ?? [], isMember)

  // Only Normal, Heroic and Mythic encounters count, so an LFR or Mythic+ log ends up
  // with no fights and drops out below with the trash and test logs.
  const withRaidFights = (report: WclReport) => ({ ...report, fights: guildRaidFights(report.fights) })

  const guildNights = guildReports
    .map(withRaidFights)
    .filter(report => !members || memberCount(report) >= GUILD_TAGGED_MIN_MEMBERS)

  const loggerNights = members
    ? logger.reports
        .map(withRaidFights)
        .filter(report =>
          bossPlayerIds(report.fights).size <= RAID_GROUP_MAX
          && memberCount(report) >= PERSONAL_LOG_MIN_MEMBERS)
    : []

  // A log tagged to the guild and uploaded by a logger comes back from both queries.
  const reports = new Map([...loggerNights, ...guildNights].map(report => [report.code, report]))
  const withBosses = [...reports.values()].filter(report => report.fights.length > 0)

  return {
    nights: groupRaidNights(withBosses).map(toRaidSummary),
    complete: logger.complete && members !== null,
  }
}

// The current tier is refreshed once an hour, so a new raid night shows up within the
// hour of its upload. A finished tier never changes, and checking the loggers' personal
// logs makes one cost about 130 points of a 3600 an hour budget, so it is refreshed
// once a week. Either way a tier missing the loggers' nights is only kept briefly.
const cachedTier = (name: string, maxAge: number) =>
  defineCache(loadRaidNights, {
    name,
    maxAge,
    validate: keepIfComplete,
    getKey: (zone: number) => `lionhearts:${zone}`,
  })

const fetchCurrentTier = cachedTier('raids', 60 * 60)
const fetchPastTier = cachedTier('raids-past', 7 * 24 * 60 * 60)

/** The guild's raid nights in one tier, newest first. An unknown tier id means the current tier. */
export const fetchRaidNights = async (tierId: number) => {
  const { id } = raidTier(tierId)
  const { nights } = id === RAID_TIERS[0].id ? await fetchCurrentTier(id) : await fetchPastTier(id)
  return nights
}

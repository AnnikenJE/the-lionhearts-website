// The guild's raid nights in one raid tier. A cached function rather than a cached
// route, so the character pages can reuse it to find the nights a character attended.
// wclQuery and GUILD come from server/utils/warcraftlogs.ts (Nitro auto-import).

interface WclFight {
  id: number
  name: string
  kill: boolean | null
  difficulty: number | null
  /** Actor ids of the players in the fight. */
  friendlyPlayers: number[] | null
}

interface WclReport {
  code: string
  title: string
  startTime: number
  endTime: number
  zone: { name: string } | null
  fights: WclFight[] | null
  /** Only asked for on a logger's personal logs, to check who was in the group. */
  masterData?: { actors: { id: number, name: string }[] | null } | null
}

interface ReportsResponse {
  reportData: {
    reports: {
      data: WclReport[]
    }
  }
}

export interface RaidSummary {
  /** The log the row links to: the one that captured the most of the night. */
  code: string
  title: string
  zone: string | null
  /** ISO strings, so the page can reuse formatDate and put them in <time datetime>. */
  startedAt: string
  endedAt: string
  durationMs: number
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

// Players who were in at least one boss pull. Every player the log ever saw would also
// count people who only joined for trash or left before the first boss, which once
// made a 20-player night read as 58 raiders.
const bossPlayerCount = (report: WclReport) =>
  new Set((report.fights ?? []).flatMap(fight => fight.friendlyPlayers ?? [])).size

/**
 * One raid night from the logs that recorded it. Bosses are counted across all of
 * them, so a night logged in parts shows everything that happened. The row links to
 * the log with the most bosses (then kills, then length), and the headcount is that
 * of the largest log: actor ids differ between logs, so players cannot be added up.
 */
const toRaidSummary = (logs: WclReport[]): RaidSummary => {
  const fights = logs.flatMap(log => log.fights ?? [])

  const main = [...logs].sort((a, b) =>
    bossNames(b.fights ?? []).size - bossNames(a.fights ?? []).size
    || bossNames(b.fights ?? [], true).size - bossNames(a.fights ?? [], true).size
    || (b.endTime - b.startTime) - (a.endTime - a.startTime),
  )[0]!

  // Higher integer means harder, and a night can span difficulties (e.g. a Heroic
  // clear followed by Mythic prog), so the summary reflects the hardest pull.
  const maxDifficulty = fights.reduce<number | null>((max, fight) => {
    if (fight.difficulty == null) return max
    return max == null ? fight.difficulty : Math.max(max, fight.difficulty)
  }, null)

  const start = Math.min(...logs.map(log => log.startTime))
  const end = Math.max(...logs.map(log => log.endTime))

  return {
    code: main.code,
    title: main.title,
    zone: main.zone?.name ?? null,
    startedAt: new Date(start).toISOString(),
    endedAt: new Date(end).toISOString(),
    durationMs: end - start,
    difficulty: difficultyName(maxDifficulty),
    // Distinct boss names, not raw fight counts: twenty pulls on one boss is one boss
    // pulled, not twenty.
    bossesKilled: bossNames(fights, true).size,
    bossesPulled: bossNames(fights).size,
    raiderCount: Math.max(...logs.map(bossPlayerCount)),
    logCount: logs.length,
  }
}

const REPORTS_QUERY = `
  query Raids($name: String!, $slug: String!, $region: String!, $zone: Int!, $limit: Int!) {
    reportData {
      reports(guildName: $name, guildServerSlug: $slug, guildServerRegion: $region, zoneID: $zone, limit: $limit) {
        data {
          code
          title
          startTime
          endTime
          zone { name }
          fights(killType: Encounters) { id name kill difficulty friendlyPlayers }
          masterData { actors(type: "Player") { id name } }
        }
      }
    }
  }
`

// One logger's personal logs in a tier, with the player list so a pug can be told
// apart from a guild night.
const LOGGER_REPORTS_QUERY = `
  query LoggerRaids($user: Int!, $zone: Int!, $limit: Int!) {
    reportData {
      reports(userID: $user, zoneID: $zone, limit: $limit) {
        data {
          code
          title
          startTime
          endTime
          zone { name }
          fights(killType: Encounters) { id name kill difficulty friendlyPlayers }
          masterData { actors(type: "Player") { id name } }
        }
      }
    }
  }
`

/**
 * How many roster members a log needs in its boss fights to count as a guild night.
 * Guild nights run 11 to 22, except two Castle Nathria nights from 2021 with 6 and 7,
 * since many of those raiders have left. A guild-tagged log only needs 5, enough to
 * keep out a member's pug or solo run; a logger's personal log, which is far more often
 * a pug, needs 8. Measured 2026-09-25.
 */
const GUILD_TAGGED_MIN_ROSTER = 5
const PERSONAL_LOG_MIN_ROSTER = 8

/** A raid group is thirty players at most; a bigger log is an event, not a raid night. */
const RAID_GROUP_MAX = 30

// The logs the guild tagged as its own. Fifty per query: no tier so far has more than
// about twenty, and a hundred logs with their fights break Warcraft Logs' query
// complexity cap.
const fetchGuildReports = async (zone: number) => {
  const data = await wclQuery<ReportsResponse>(REPORTS_QUERY, {
    name: GUILD.name,
    slug: GUILD.serverSlug,
    region: GUILD.serverRegion,
    zone,
    limit: 50,
  })
  return data.reportData.reports.data
}

// The guild's raid loggers' personal logs in the tier, unfiltered. Low priority: this
// is the expensive half of a tier and the first to yield to the budget. `complete` is
// false when any logger's logs could not be fetched.
const fetchLoggerReports = async (zone: number): Promise<{ reports: WclReport[], complete: boolean }> => {
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

/** The log with only its Normal, Heroic and Mythic encounters. */
const withGuildRaidFights = (report: WclReport): WclReport => ({
  ...report,
  fights: (report.fights ?? []).filter(fight => isGuildRaidDifficulty(fight.difficulty)),
})

const rosterPlayersIn = (report: WclReport, rosterNames: Set<string>) =>
  countRosterPlayers(
    (report.fights ?? []).flatMap(fight => fight.friendlyPlayers ?? []),
    report.masterData?.actors ?? [],
    rosterNames,
  )

interface RaidNightsResult {
  nights: RaidSummary[]
  /** False when the loggers' half could not be fetched; see INCOMPLETE_MAX_AGE_MS. */
  complete: boolean
}

const loadRaidNights = async (tierId: number): Promise<RaidNightsResult> => {
  const zone = raidTier(tierId).id
  const [guildReports, logger, roster] = await Promise.all([
    fetchGuildReports(zone),
    fetchLoggerReports(zone),
    fetchRoster().catch(() => null),
  ])

  // Without the roster there is no telling a guild night from a pug: guild-tagged logs
  // are kept unchecked, the loggers' personal logs are left out, and the result counts
  // as incomplete so it is fetched again soon.
  const rosterNames = roster && new Set(roster.map(member => member.name.toLowerCase()))

  // Only Normal, Heroic and Mythic encounters count, so an LFR or Mythic+ log ends up
  // with no fights and drops out with the trash and test logs below.
  const guildNights = guildReports
    .map(withGuildRaidFights)
    .filter(report => !rosterNames || rosterPlayersIn(report, rosterNames) >= GUILD_TAGGED_MIN_ROSTER)

  const loggerNights = rosterNames
    ? logger.reports
        .map(withGuildRaidFights)
        .filter(report =>
          bossPlayerCount(report) <= RAID_GROUP_MAX
          && rosterPlayersIn(report, rosterNames) >= PERSONAL_LOG_MIN_ROSTER)
    : []

  // A log tagged to the guild and uploaded by a logger comes back from both queries.
  const reports = new Map([...loggerNights, ...guildNights].map(report => [report.code, report]))

  // A log with no boss pulls left is not a raid night: a trash, test, LFR or Mythic+
  // log. It has nothing to show on the detail page.
  const withBosses = [...reports.values()].filter(report => (report.fights ?? []).length > 0)

  return {
    nights: groupRaidNights(withBosses).map(toRaidSummary),
    complete: logger.complete && rosterNames !== null,
  }
}

// A tier missing the loggers' nights is only kept briefly, never for the full window,
// so a busy hour cannot leave a finished tier short for a week.
const keepIfComplete = (entry: { value?: RaidNightsResult, mtime?: number }) =>
  entry.value !== undefined
  && (entry.value.complete || Date.now() - (entry.mtime ?? 0) < INCOMPLETE_MAX_AGE_MS)

// The current tier is refreshed once an hour, so a new raid night shows up within
// the hour of its upload. A finished tier never changes, and checking the loggers'
// personal logs makes one cost about 130 points against a 3600 an hour budget, so
// it is refreshed once a week.
const fetchCurrentTier = defineCachedFunction(loadRaidNights, {
  maxAge: 60 * 60,
  validate: keepIfComplete,
  name: 'raids',
  getKey: (tierId: number) => `lionhearts:${tierId}`,
})

const fetchPastTier = defineCachedFunction(loadRaidNights, {
  maxAge: 7 * 24 * 60 * 60,
  validate: keepIfComplete,
  name: 'raids-past',
  getKey: (tierId: number) => `lionhearts:${tierId}`,
})

/** The guild's raid nights in one tier, newest first. An unknown tier id means the current tier. */
export const fetchRaidNights = async (tierId: number): Promise<RaidSummary[]> => {
  const tier = raidTier(tierId)
  const result = tier.id === RAID_TIERS[0].id ? await fetchCurrentTier(tier.id) : await fetchPastTier(tier.id)
  return result.nights
}

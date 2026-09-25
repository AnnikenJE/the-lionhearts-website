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
 * A logger's personal log counts as a guild night when at least this many of the
 * players in its boss fights are on the roster. Guild nights run 15 to 22, pugs 1 to
 * 3, so eight sits well clear of both, and still holds for an old night whose raiders
 * have partly left the guild since.
 */
const GUILD_NIGHT_MIN_ROSTER = 8

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

// The guild's raid loggers' personal logs that are guild nights. If the roster cannot
// be read, there is no way to tell a guild night from a pug, so none are added.
const fetchLoggerReports = async (zone: number) => {
  const roster = await fetchRoster().catch(() => null)
  if (!roster) return []
  const rosterNames = new Set(roster.map(member => member.name.toLowerCase()))

  const perLogger = await Promise.all(
    GUILD_LOGGERS.map(logger =>
      wclQuery<ReportsResponse>(LOGGER_REPORTS_QUERY, { user: logger.id, zone, limit: 25 })
        .then(data => data.reportData.reports.data)
        .catch(() => []),
    ),
  )

  return perLogger.flat().filter((report) => {
    const players = (report.fights ?? []).flatMap(fight => fight.friendlyPlayers ?? [])
    return new Set(players).size <= RAID_GROUP_MAX
      && countRosterPlayers(players, report.masterData?.actors ?? [], rosterNames) >= GUILD_NIGHT_MIN_ROSTER
  })
}

const loadRaidNights = async (tierId: number): Promise<RaidSummary[]> => {
  const zone = raidTier(tierId).id
  const [guildReports, loggerReports] = await Promise.all([
    fetchGuildReports(zone),
    fetchLoggerReports(zone),
  ])

  // A log tagged to the guild and uploaded by a logger comes back from both queries.
  const reports = new Map([...loggerReports, ...guildReports].map(report => [report.code, report]))

  // A log with no boss pulls is not a raid night: a short trash or test log that
  // someone uploaded under the guild. It has nothing to show on the detail page.
  const withBosses = [...reports.values()].filter(report => (report.fights ?? []).length > 0)

  return groupRaidNights(withBosses).map(toRaidSummary)
}

// The current tier is refreshed once an hour, so a new raid night shows up within
// the hour of its upload. A finished tier never changes, and checking the loggers'
// personal logs makes one cost about 130 points against a 3600 an hour budget, so
// it is refreshed once a week.
const fetchCurrentTier = defineCachedFunction(loadRaidNights, {
  maxAge: 60 * 60,
  name: 'raids',
  getKey: (tierId: number) => `lionhearts:${tierId}`,
})

const fetchPastTier = defineCachedFunction(loadRaidNights, {
  maxAge: 7 * 24 * 60 * 60,
  name: 'raids-past',
  getKey: (tierId: number) => `lionhearts:${tierId}`,
})

/** The guild's raid nights in one tier, newest first. An unknown tier id means the current tier. */
export const fetchRaidNights = (tierId: number): Promise<RaidSummary[]> => {
  const tier = raidTier(tierId)
  return tier.id === RAID_TIERS[0].id ? fetchCurrentTier(tier.id) : fetchPastTier(tier.id)
}

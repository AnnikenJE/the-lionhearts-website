// The guild's recent raid nights. A cached function rather than a cached route, so the
// character pages can reuse it to find the nights a character attended.
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
}

interface ReportsResponse {
  reportData: {
    reports: {
      data: WclReport[]
    }
  }
}

export interface RaidSummary {
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
}

const REPORTS_QUERY = `
  query Raids($name: String!, $slug: String!, $region: String!, $limit: Int!) {
    reportData {
      reports(guildName: $name, guildServerSlug: $slug, guildServerRegion: $region, limit: $limit) {
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

export const fetchRaidNights = defineCachedFunction(
  async (): Promise<RaidSummary[]> => {
    const data = await wclQuery<ReportsResponse>(REPORTS_QUERY, {
      name: GUILD.name,
      slug: GUILD.serverSlug,
      region: GUILD.serverRegion,
      limit: 10,
    })

    const raids = data.reportData.reports.data
      .map((report) => {
        const fights = report.fights ?? []

        // Higher integer means harder, and a night can span difficulties (e.g. a Heroic
        // clear followed by Mythic prog), so the summary reflects the hardest pull.
        const maxDifficulty = fights.reduce<number | null>((max, fight) => {
          if (fight.difficulty == null) return max
          return max == null ? fight.difficulty : Math.max(max, fight.difficulty)
        }, null)

        // Distinct boss names, not raw fight counts: twenty pulls on one boss is one
        // boss pulled, not twenty.
        const pulledBosses = new Set(fights.map(fight => fight.name))
        const killedBosses = new Set(
          fights.filter(fight => fight.kill).map(fight => fight.name),
        )

        return {
          code: report.code,
          title: report.title,
          zone: report.zone?.name ?? null,
          startedAt: new Date(report.startTime).toISOString(),
          endedAt: new Date(report.endTime).toISOString(),
          durationMs: report.endTime - report.startTime,
          difficulty: difficultyName(maxDifficulty),
          bossesKilled: killedBosses.size,
          bossesPulled: pulledBosses.size,
          // Players who were in at least one boss pull. Every player the log ever saw
          // would also count people who only joined for trash or left before the first
          // boss, which once made a 20-player night read as 58 raiders.
          raiderCount: new Set(fights.flatMap(fight => fight.friendlyPlayers ?? [])).size,
        }
      })
      // The API already returns newest first, but sorting here is a cheap guarantee
      // rather than a fix for any known ordering bug. ISO strings sort lexicographically
      // in the same order as chronologically.
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      // A log with no boss pulls is not a raid night: a short trash or test log that
      // someone uploaded under the guild. It has nothing to show on the detail page.
      .filter(raid => raid.bossesPulled > 0)

    return dedupeRaidNights(raids)
  },
  // Refreshed once an hour: a new raid night shows up within the hour of its upload,
  // and Warcraft Logs is asked at most once an hour however many people visit.
  { maxAge: 60 * 60, name: 'raids', getKey: () => 'lionhearts' },
)

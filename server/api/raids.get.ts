// Runs server-side so the browser never talks to Warcraft Logs directly and the
// response can be cached. wclQuery and GUILD come from server/utils/warcraftlogs.ts
// (Nitro auto-import, no import statement needed).

interface WclFight {
  id: number
  name: string
  kill: boolean | null
  difficulty: number | null
}

interface WclActor {
  id: number
}

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
          fights(killType: Encounters) { id name kill difficulty }
          masterData { actors(type: "Player") { id } }
        }
      }
    }
  }
`

export default defineCachedEventHandler(
  async (): Promise<RaidSummary[]> => {
    const data = await wclQuery<ReportsResponse>(REPORTS_QUERY, {
      name: GUILD.name,
      slug: GUILD.serverSlug,
      region: GUILD.serverRegion,
      limit: 10,
    })

    return data.reportData.reports.data
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
          raiderCount: report.masterData?.actors?.length ?? 0,
        }
      })
      // The API already returns newest first, but sorting here is a cheap guarantee
      // rather than a fix for any known ordering bug. ISO strings sort lexicographically
      // in the same order as chronologically.
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  },
  // Fifteen minutes so a raid night appears shortly after the log is uploaded, while
  // staying far inside the 3600 points per hour Warcraft Logs rate limit.
  { maxAge: 15 * 60, name: 'raids', getKey: () => 'lionhearts' },
)

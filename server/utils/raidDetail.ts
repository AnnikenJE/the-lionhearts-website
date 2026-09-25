// One raid night in detail. Kept in server/utils so both the raid route and the
// character pages (which list the nights a character attended) can use it.

import type { RaidFight } from './raids'

// A report code is an opaque alphanumeric id copied from a Warcraft Logs URL, never
// user-composed. Anything that fails this shape cannot be a real code, so it is
// rejected before it is ever forwarded upstream.
export const RAID_CODE_PATTERN = /^[a-zA-Z0-9]+$/

interface WclFight {
  id: number
  name: string
  kill: boolean | null
  difficulty: number | null
  fightPercentage: number | null
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
  // Raw JSON scalar. See unwrapPlayerDetails below for why this stays unknown.
  playerDetails: unknown
}

interface WclResponse {
  reportData: {
    report: WclReport | null
  }
}

interface WclPlayerEntry {
  /** Actor id, the same ids a fight's friendlyPlayers lists. */
  id?: number
  name?: string
  type?: string
  server?: string
  specs?: { spec?: string }[]
}

export interface RaidPlayer {
  name: string
  className: string
  spec: string | null
  server: string | null
  /**
   * Whether the character is on the guild roster, set by the route after the cache.
   * Null when the roster could not be read. Only roster members get a character page.
   */
  onRoster?: boolean | null
}

export interface RaidDetail {
  code: string
  title: string
  zone: string | null
  /** ISO strings, so the page can reuse formatDate and formatTime. */
  startedAt: string
  endedAt: string
  durationMs: number
  logUrl: string
  fights: RaidFight[]
  tanks: RaidPlayer[]
  healers: RaidPlayer[]
  dps: RaidPlayer[]
}

const QUERY = `
  query Raid($code: String!) {
    reportData {
      report(code: $code) {
        code
        title
        startTime
        endTime
        zone { name }
        fights(killType: Encounters) { id name kill difficulty fightPercentage friendlyPlayers }
        playerDetails(startTime: 0, endTime: 100000000, includeCombatantInfo: false)
      }
    }
  }
`

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined

const asPlayerArray = (value: unknown): WclPlayerEntry[] =>
  Array.isArray(value) ? value as WclPlayerEntry[] : []

// playerDetails is a raw JSON scalar and the Warcraft Logs docs 403 non-browser
// clients, so the exact envelope could not be confirmed while writing this. The
// unwrap tries the documented shape first, falls back to an unnested one, and
// otherwise defaults every bucket to empty rather than trust a single guess.
const unwrapPlayerDetails = (raw: unknown) => {
  const root = asRecord(raw)
  const nested = asRecord(root?.data)
  const buckets = asRecord(nested?.playerDetails) ?? asRecord(root?.playerDetails) ?? root

  return {
    tanks: asPlayerArray(buckets?.tanks),
    healers: asPlayerArray(buckets?.healers),
    dps: asPlayerArray(buckets?.dps),
  }
}

// Warcraft Logs writes multi-word specs as one word ("BeastMastery"), the same way it
// writes class names ("DeathKnight").
const spaceWords = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2')

const toPlayer = (entry: WclPlayerEntry): RaidPlayer => ({
  name: entry.name ?? 'Unknown',
  className: entry.type ?? 'Unknown',
  spec: entry.specs?.[0]?.spec ? spaceWords(entry.specs[0].spec) : null,
  server: entry.server ?? null,
})

// The report is cached as a function rather than the whole route being a cached
// handler, so opt-outs can be applied after the cache: adding a name takes effect on
// the next request even if the cache ever outlives a deploy (see the Workers KV issue).
export const fetchRaid = defineCachedFunction(
  async (code: string): Promise<RaidDetail> => {
    const data = await wclQuery<WclResponse>(QUERY, { code })
    const report = data.reportData.report

    if (!report) {
      throw createError({ statusCode: 404, statusMessage: 'Raid not found' })
    }

    // Guild raid encounters only: an LFR run or a Mythic+ run in the same log is neither
    // a boss of this night nor a reason to list its players as raiders.
    const fights = (report.fights ?? []).filter(fight => isGuildRaidDifficulty(fight.difficulty))
    const raiders = new Set(fights.flatMap(fight => fight.friendlyPlayers ?? []))
    const inRaid = (entry: WclPlayerEntry) => raiders.size === 0 || entry.id === undefined || raiders.has(entry.id)

    const details = unwrapPlayerDetails(report.playerDetails)
    const tanks = details.tanks.filter(inRaid)
    const healers = details.healers.filter(inRaid)
    const dps = details.dps.filter(inRaid)

    return {
      code: report.code,
      title: report.title,
      zone: report.zone?.name ?? null,
      startedAt: new Date(report.startTime).toISOString(),
      endedAt: new Date(report.endTime).toISOString(),
      durationMs: report.endTime - report.startTime,
      logUrl: `https://www.warcraftlogs.com/reports/${report.code}`,
      fights: collapseFights(fights),
      tanks: tanks.map(toPlayer),
      healers: healers.map(toPlayer),
      dps: dps.map(toPlayer),
    }
  },
  {
    name: 'raid',
    getKey: (code: string) => code,
    // Refreshed once an hour, the same as the raid list.
    maxAge: 60 * 60,
  },
)

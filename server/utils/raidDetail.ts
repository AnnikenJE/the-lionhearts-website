// One raid night in detail. Kept in server/utils so both the raid route and the
// character pages (which list the nights a character attended) can use it.
import { spaceWords } from '../../app/utils/wow'
import type { RaidFight, WclFight } from './raids'

// A report code is an opaque alphanumeric id copied from a Warcraft Logs URL, never
// user-composed. Anything that fails this shape cannot be a real code, so it is
// rejected before it is ever forwarded upstream.
export const RAID_CODE_PATTERN = /^[a-zA-Z0-9]+$/

interface WclPlayerEntry {
  /** Actor id, the same ids a fight's friendlyPlayers lists. */
  id?: number
  name?: string
  type?: string
  server?: string
  specs?: { spec?: string }[]
}

type PlayerRole = 'tanks' | 'healers' | 'dps'

interface WclResponse {
  reportData: {
    report: {
      code: string
      title: string
      startTime: number
      endTime: number
      zone: { name: string } | null
      fights: WclFight[] | null
      // A raw JSON scalar, shaped { data: { playerDetails: { tanks, healers, dps } } }.
      playerDetails: { data?: { playerDetails?: Partial<Record<PlayerRole, WclPlayerEntry[]>> } } | null
    } | null
  }
}

export interface RaidPlayer {
  name: string
  className: string
  spec: string | null
  /** The realm as Warcraft Logs spells it. A player with none is on the guild's realm. */
  server: string
  /**
   * Whether the character is on the guild roster, set by the route after the cache.
   * Null when the roster could not be read. Only roster members get a character page.
   */
  onRoster?: boolean | null
  /** The member's realm slug for their character page link, set with onRoster. */
  realmSlug?: string | null
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

const toPlayer = (entry: WclPlayerEntry): RaidPlayer => ({
  name: entry.name ?? 'Unknown',
  className: entry.type ?? 'Unknown',
  spec: entry.specs?.[0]?.spec ? spaceWords(entry.specs[0].spec) : null,
  server: entry.server ?? GUILD.serverSlug,
})

const DAY_MS = 24 * 60 * 60 * 1000

// The report is cached as a function rather than the whole route being a cached
// handler, so opt-outs can be applied after the cache (see defineCache). A finished log never changes,
// so one that had ended a day before it was fetched is kept for a week; a recent one
// may still be live-logging and is fetched again after an hour. `priority` is not
// part of the key: the character pages ask at low priority for the same reports.
export const fetchRaid = defineCache(
  async (code: string, priority: QueryPriority): Promise<RaidDetail> => {
    const report = (await wclQuery<WclResponse>(QUERY, { code }, priority)).reportData.report

    if (!report) {
      throw createError({ statusCode: 404, statusMessage: 'Raid not found' })
    }

    // Guild raid encounters only: an LFR run or a Mythic+ run in the same log is neither
    // a boss of this night nor a reason to list its players as raiders.
    const fights = guildRaidFights(report.fights)
    const raiders = bossPlayerIds(fights)
    const details = report.playerDetails?.data?.playerDetails
    const players = (role: PlayerRole) =>
      (details?.[role] ?? []).filter(entry => entry.id !== undefined && raiders.has(entry.id)).map(toPlayer)

    return {
      code: report.code,
      title: report.title,
      zone: report.zone?.name ?? null,
      startedAt: new Date(report.startTime).toISOString(),
      endedAt: new Date(report.endTime).toISOString(),
      durationMs: report.endTime - report.startTime,
      logUrl: `https://www.warcraftlogs.com/reports/${report.code}`,
      fights: collapseFights(fights),
      tanks: players('tanks'),
      healers: players('healers'),
      dps: players('dps'),
    }
  },
  {
    name: 'raid',
    getKey: (code: string) => code,
    maxAge: 7 * 24 * 60 * 60,
    validate: entry =>
      entry.value !== undefined
      && (Date.parse(entry.value.endedAt) < (entry.mtime ?? 0) - DAY_MS
        || Date.now() - (entry.mtime ?? 0) < 60 * 60 * 1000),
  },
)

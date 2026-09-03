// Runs server-side so credentials stay off the browser and a finished log can be
// cached, same rationale as roster.get.ts.

// A report code is an opaque alphanumeric id copied from a Warcraft Logs URL, never
// user-composed. Anything that fails this shape cannot be a real code, so it is
// rejected before it is ever forwarded upstream.
const CODE_PATTERN = /^[a-zA-Z0-9]+$/

interface WclFight {
  id: number
  name: string
  kill: boolean | null
  difficulty: number | null
  fightPercentage: number | null
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
  name?: string
  type?: string
  server?: string
  specs?: { spec?: string }[]
}

export interface RaidFight {
  /** The id of the first pull, enough to key a list row. */
  id: number
  name: string
  kill: boolean
  difficulty: string | null
  pulls: number
  /** Health remaining on the best pull, percent. Null on a kill or when unreported. */
  bestPercent: number | null
}

export interface RaidPlayer {
  name: string
  className: string
  spec: string | null
  server: string | null
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
        fights(killType: Encounters) { id name kill difficulty fightPercentage }
        playerDetails(startTime: 0, endTime: 100000000, includeCombatantInfo: false)
      }
    }
  }
`

// Fights collapse to one row per boss: a progression night with twenty wipes on one
// boss should render as one row with pulls: 20, not twenty near-identical lines.
const collapseFights = (fights: WclFight[]): RaidFight[] => {
  const order: string[] = []
  const groups = new Map<string, WclFight[]>()

  for (const fight of fights) {
    if (!groups.has(fight.name)) {
      order.push(fight.name)
      groups.set(fight.name, [])
    }
    groups.get(fight.name)!.push(fight)
  }

  return order.map((name) => {
    const pulls = groups.get(name)!
    const kill = pulls.some(pull => pull.kill === true)

    const maxDifficulty = pulls.reduce<number | null>((max, pull) => {
      if (pull.difficulty == null) return max
      return max == null ? pull.difficulty : Math.max(max, pull.difficulty)
    }, null)

    // Lower fightPercentage means closer to a kill, so the best pull is the minimum.
    // A kill has nothing left to report, so it is null regardless of what pulls logged.
    const percentages = pulls
      .map(pull => pull.fightPercentage)
      .filter((percent): percent is number => percent != null)
    const bestPercent = kill || percentages.length === 0 ? null : Math.min(...percentages)

    return {
      id: pulls[0]!.id,
      name,
      kill,
      difficulty: difficultyName(maxDifficulty),
      pulls: pulls.length,
      bestPercent,
    }
  })
}

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

const toPlayer = (entry: WclPlayerEntry): RaidPlayer => ({
  name: entry.name ?? 'Unknown',
  className: entry.type ?? 'Unknown',
  spec: entry.specs?.[0]?.spec ?? null,
  server: entry.server ?? null,
})

export default defineCachedEventHandler(
  async (event): Promise<RaidDetail> => {
    const code = getRouterParam(event, 'code')

    if (!code || !CODE_PATTERN.test(code)) {
      throw createError({ statusCode: 404, statusMessage: 'Raid not found' })
    }

    const data = await wclQuery<WclResponse>(QUERY, { code })
    const report = data.reportData.report

    if (!report) {
      throw createError({ statusCode: 404, statusMessage: 'Raid not found' })
    }

    const { tanks, healers, dps } = unwrapPlayerDetails(report.playerDetails)

    return {
      code: report.code,
      title: report.title,
      zone: report.zone?.name ?? null,
      startedAt: new Date(report.startTime).toISOString(),
      endedAt: new Date(report.endTime).toISOString(),
      durationMs: report.endTime - report.startTime,
      logUrl: `https://www.warcraftlogs.com/reports/${report.code}`,
      fights: collapseFights(report.fights ?? []),
      // Opt-outs are applied here as well as on the roster, so a character that
      // asked to be removed is gone from the raid nights too.
      tanks: withoutOptedOut(tanks.map(toPlayer)),
      healers: withoutOptedOut(healers.map(toPlayer)),
      dps: withoutOptedOut(dps.map(toPlayer)),
    }
  },
  // A finished log never changes, so an hour is conservative and keeps repeat visits
  // off the Warcraft Logs rate limit.
  { maxAge: 60 * 60, name: 'raid', getKey: event => getRouterParam(event, 'code') ?? '' },
)

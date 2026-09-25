// The Warcraft Logs report shapes and the pure transforms both raid fetchers share
// (server/utils/raidNights.ts and raidDetail.ts). Kept free of Nitro so it can be
// tested under plain Vitest, the same split as server/utils/roster.ts.

// Imported explicitly rather than left to Nitro's auto-import, for the same reason.
import { difficultyName, isGuildRaidDifficulty } from './warcraftlogs'

export interface WclFight {
  id: number
  name: string
  kill: boolean | null
  difficulty: number | null
  /** Health left on a wipe, percent. Only the raid detail query asks for it. */
  fightPercentage?: number | null
  /** Actor ids of the players in the fight. */
  friendlyPlayers?: number[] | null
}

export interface WclActor {
  id: number
  name: string
  /** The realm as Warcraft Logs spells it, "DefiasBrotherhood". */
  server?: string | null
}

/** Only the Normal, Heroic and Mythic encounters; see isGuildRaidDifficulty. */
export const guildRaidFights = <T extends WclFight>(fights: T[] | null | undefined): T[] =>
  (fights ?? []).filter(fight => isGuildRaidDifficulty(fight.difficulty))

/**
 * Actor ids of everyone in at least one of these fights. Every player a log ever saw
 * would also count people who only joined for trash or left before the first boss,
 * which once made a 20-player night read as 58 raiders.
 */
export const bossPlayerIds = (fights: WclFight[]) =>
  new Set(fights.flatMap(fight => fight.friendlyPlayers ?? []))

/**
 * The longest break between two logs that still makes them one raid night. Long
 * enough for a night split into parts (a Heroic log, then a Normal one after a
 * break), far too short to join two separate raid days.
 */
export const SAME_NIGHT_GAP_MS = 3 * 60 * 60 * 1000

/**
 * Groups logs into raid nights. A night can be in several logs: two raiders logging
 * it at once (their logs overlap), or one night uploaded in parts (the logs follow
 * each other with a short break). Either way the list should show it once. Returns
 * the groups newest night first, each group's logs in start order.
 */
export const groupRaidNights = <T extends { startTime: number, endTime: number }>(logs: T[]): T[][] => {
  const nights: { logs: T[], end: number }[] = []

  for (const log of [...logs].sort((a, b) => a.startTime - b.startTime)) {
    const current = nights.at(-1)

    if (current && log.startTime <= current.end + SAME_NIGHT_GAP_MS) {
      current.logs.push(log)
      current.end = Math.max(current.end, log.endTime)
    }
    else {
      nights.push({ logs: [log], end: log.endTime })
    }
  }

  return nights.reverse().map(night => night.logs)
}

/**
 * How many of the fights' players are guild members. A log only counts as a guild
 * night when enough of the group are. `isMember` decides on name and realm, so a pug
 * who shares a member's name on another realm does not count.
 */
export const countMembers = (
  fights: WclFight[],
  actors: WclActor[],
  isMember: (name: string, server: string | null | undefined) => boolean,
): number => {
  const byId = new Map(actors.map(actor => [actor.id, actor]))
  let count = 0
  for (const id of bossPlayerIds(fights)) {
    const actor = byId.get(id)
    if (actor && isMember(actor.name, actor.server)) count++
  }
  return count
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

/**
 * One row per boss and difficulty, in the order they were first pulled. A progression
 * night with twenty wipes on one boss is one row with twenty pulls, and a boss killed
 * on Normal and then on Heroic the same night is two rows, each with its own pulls.
 */
export const collapseFights = (fights: WclFight[]): RaidFight[] => {
  const groups = new Map<string, WclFight[]>()

  for (const fight of fights) {
    const key = `${fight.name}|${fight.difficulty ?? ''}`
    const group = groups.get(key)
    if (group) group.push(fight)
    else groups.set(key, [fight])
  }

  return [...groups.values()].map((pulls) => {
    const first = pulls[0]!
    const kill = pulls.some(pull => pull.kill === true)

    // Lower fightPercentage means closer to a kill, so the best pull is the minimum.
    // A kill has nothing left to report, so it is null regardless of what pulls logged.
    const percentages = pulls
      .map(pull => pull.fightPercentage)
      .filter((percent): percent is number => percent != null)
    const bestPercent = kill || percentages.length === 0 ? null : Math.min(...percentages)

    return {
      id: first.id,
      name: first.name,
      kill,
      difficulty: difficultyName(first.difficulty),
      pulls: pulls.length,
      bestPercent,
    }
  })
}

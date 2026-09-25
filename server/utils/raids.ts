// Kept out of server/api/raids.get.ts so it can be tested without a Nitro runtime, the
// same split as server/utils/roster.ts.

// Imported explicitly rather than left to Nitro's auto-import, so this module also
// loads under plain Vitest.
import { difficultyName } from './warcraftlogs'

interface TimedLog {
  /** Epoch milliseconds, as Warcraft Logs reports them. */
  startTime: number
  endTime: number
}

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
export const groupRaidNights = <T extends TimedLog>(logs: T[]): T[][] => {
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
 * How many of a log's boss-fight players are on the guild roster. A logger's personal
 * log can be a pug, so it only counts as a guild night when enough of the group are
 * guild members. `players` are the actor ids seen in boss fights, `actors` maps ids
 * to names, and `roster` holds lower-cased roster names.
 */
export const countRosterPlayers = (
  players: Iterable<number>,
  actors: { id: number, name: string }[],
  roster: Set<string>,
): number => {
  const names = new Map(actors.map(actor => [actor.id, actor.name.toLowerCase()]))
  let count = 0
  for (const id of new Set(players)) {
    const name = names.get(id)
    if (name && roster.has(name)) count++
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

interface FightLike {
  id: number
  name: string
  kill: boolean | null
  difficulty: number | null
  fightPercentage: number | null
}

/**
 * One row per boss and difficulty, in the order they were first pulled. A progression
 * night with twenty wipes on one boss is one row with twenty pulls, and a boss killed
 * on Normal and then on Heroic the same night is two rows, each with its own pulls.
 */
export const collapseFights = (fights: FightLike[]): RaidFight[] => {
  const groups = new Map<string, FightLike[]>()

  for (const fight of fights) {
    const key = `${fight.name}|${fight.difficulty ?? ''}`
    groups.set(key, [...(groups.get(key) ?? []), fight])
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

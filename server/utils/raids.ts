// Kept out of server/api/raids.get.ts so it can be tested without a Nitro runtime, the
// same split as server/utils/roster.ts.

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

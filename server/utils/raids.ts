// Kept out of server/api/raids.get.ts so it can be tested without a Nitro runtime, the
// same split as server/utils/roster.ts.

interface RaidNightLike {
  /** ISO strings. */
  startedAt: string
  endedAt: string
  durationMs: number
  bossesPulled: number
  bossesKilled: number
}

const overlaps = (a: RaidNightLike, b: RaidNightLike) =>
  a.startedAt < b.endedAt && b.startedAt < a.endedAt

/** More bosses pulled wins, then more kills, then the longer log. */
const isMoreComplete = (a: RaidNightLike, b: RaidNightLike) =>
  a.bossesPulled - b.bossesPulled
  || a.bossesKilled - b.bossesKilled
  || a.durationMs - b.durationMs

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

/**
 * Collapses logs of the same raid night into one. When two raiders both log a night,
 * Warcraft Logs holds two reports whose time ranges overlap; the list should show the
 * night once, from whichever log captured the most of it. Keeps the input order.
 */
export const dedupeRaidNights = <T extends RaidNightLike>(raids: T[]): T[] => {
  const kept: T[] = []

  for (const raid of raids) {
    const index = kept.findIndex(other => overlaps(raid, other))

    if (index === -1) kept.push(raid)
    else if (isMoreComplete(raid, kept[index]!) > 0) kept[index] = raid
  }

  return kept
}

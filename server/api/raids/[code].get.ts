// Runs server-side so credentials stay off the browser; the fetch and its hourly cache
// live in server/utils/raidDetail.ts.
import type { RaidDetail, RaidPlayer } from '../../utils/raidDetail'

export type { RaidDetail, RaidPlayer } from '../../utils/raidDetail'
export type { RaidFight } from '../../utils/raids'

export default defineEventHandler(async (event): Promise<RaidDetail> => {
  const code = getRouterParam(event, 'code')

  if (!code || !RAID_CODE_PATTERN.test(code)) {
    throw createError({ statusCode: 404, statusMessage: 'Raid not found' })
  }

  const [raid, roster] = await Promise.all([fetchRaid(code), fetchRoster().catch(() => null)])

  // Only guild members get a character page, so the page needs to know who is one; a
  // pug is shown without a link. A player with no realm in the log is on the guild's.
  const members = roster && rosterKeys(roster)
  const mark = (players: RaidPlayer[]) =>
    withoutOptedOut(players).map(player => ({
      ...player,
      onRoster: members ? members.has(rosterKey(player.name, player.server ?? GUILD.serverSlug)) : null,
    }))

  // Opt-outs are applied here as well as on the roster, so a character that asked to
  // be removed is gone from the raid nights too.
  return { ...raid, tanks: mark(raid.tanks), healers: mark(raid.healers), dps: mark(raid.dps) }
})

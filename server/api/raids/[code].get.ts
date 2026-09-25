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

  const [raid, members] = await Promise.all([fetchRaid(code), fetchMemberIndex().catch(() => null)])

  // Only guild members get a character page, so the page needs to know who is one and
  // their realm's real slug to link to it. A player with no realm in the log is on the
  // guild's own realm.
  const mark = (players: RaidPlayer[]) =>
    withoutOptedOut(players).map((player) => {
      const realm = members?.get(rosterKey(player.name, player.server ?? GUILD.serverSlug)) ?? null
      return { ...player, onRoster: members ? realm !== null : null, realmSlug: realm }
    })

  // Opt-outs are applied here as well as on the roster, so a character that asked to
  // be removed is gone from the raid nights too.
  return { ...raid, tanks: mark(raid.tanks), healers: mark(raid.healers), dps: mark(raid.dps) }
})

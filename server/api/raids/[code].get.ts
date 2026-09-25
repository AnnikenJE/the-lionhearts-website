// Runs server-side so credentials stay off the browser; the fetch and its cache live in
// server/utils/raidDetail.ts.
import { realmSlug } from '../../../app/utils/wow'
import type { RaidDetail, RaidPlayer } from '../../utils/raidDetail'

export type { RaidDetail } from '../../utils/raidDetail'
export type { RaidFight } from '../../utils/raids'

export default defineEventHandler(async (event): Promise<RaidDetail> => {
  const code = getRouterParam(event, 'code')

  if (!code || !RAID_CODE_PATTERN.test(code)) {
    throw createError({ statusCode: 404, statusMessage: 'Raid not found' })
  }

  const [raid, members] = await Promise.all([fetchRaid(code, 'high'), fetchMemberIndex().catch(() => null)])

  // Only guild members get a character page, so the page needs to know who is one, and
  // their realm's real slug to link to it. Without the roster nobody is marked, and the
  // link falls back to a slug derived from the realm name.
  const mark = (players: RaidPlayer[]) =>
    withoutOptedOut(players).map((player) => {
      const memberRealm = members?.get(rosterKey(player.name, player.server))
      return {
        ...player,
        onRoster: members ? memberRealm !== undefined : null,
        realmSlug: memberRealm ?? realmSlug(player.server),
      }
    })

  // Opt-outs are applied here as well as on the roster, so a character that asked to
  // be removed is gone from the raid nights too.
  return { ...raid, tanks: mark(raid.tanks), healers: mark(raid.healers), dps: mark(raid.dps) }
})

// Runs server-side so credentials stay off the browser; the fetch and its hourly cache
// live in server/utils/raidDetail.ts.
export type { RaidDetail, RaidFight, RaidPlayer } from '../../utils/raidDetail'

export default defineEventHandler(async (event): Promise<RaidDetail> => {
  const code = getRouterParam(event, 'code')

  if (!code || !RAID_CODE_PATTERN.test(code)) {
    throw createError({ statusCode: 404, statusMessage: 'Raid not found' })
  }

  const raid = await fetchRaid(code)

  // Opt-outs are applied here as well as on the roster, so a character that asked to
  // be removed is gone from the raid nights too.
  return {
    ...raid,
    tanks: withoutOptedOut(raid.tanks),
    healers: withoutOptedOut(raid.healers),
    dps: withoutOptedOut(raid.dps),
  }
})

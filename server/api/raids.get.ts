// Runs server-side so the browser never talks to Warcraft Logs directly; the fetch and
// its cache live in server/utils/raidNights.ts.
import type { RaidSummary } from '../utils/raidNights'
import type { RaidTier } from '../utils/warcraftlogs'

export interface RaidNightsResponse {
  tier: RaidTier
  /** Every tier the guild has logs for, newest first, for the selector. */
  tiers: readonly RaidTier[]
  nights: RaidSummary[]
}

// ?tier=<zone id>; a missing or unknown tier falls back to the current one.
export default defineEventHandler(async (event): Promise<RaidNightsResponse> => {
  const tier = raidTier(getQuery(event).tier)
  return { tier, tiers: RAID_TIERS, nights: await fetchRaidNights(tier.id) }
})

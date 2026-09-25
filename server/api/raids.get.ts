// Runs server-side so the browser never talks to Warcraft Logs directly; the fetch and
// its hourly cache live in server/utils/raidNights.ts.
import type { RaidSummary } from '../utils/raidNights'

export type { RaidSummary } from '../utils/raidNights'

export interface RaidTierOption {
  id: number
  name: string
}

export interface RaidNightsResponse {
  tier: RaidTierOption
  /** Every tier the guild has logs for, newest first, for the selector. */
  tiers: RaidTierOption[]
  nights: RaidSummary[]
}

// ?tier=<zone id>; a missing or unknown tier falls back to the current one.
export default defineEventHandler(async (event): Promise<RaidNightsResponse> => {
  const tier = raidTier(getQuery(event).tier)

  return {
    tier: { id: tier.id, name: tier.name },
    tiers: RAID_TIERS.map(({ id, name }) => ({ id, name })),
    nights: await fetchRaidNights(tier.id),
  }
})

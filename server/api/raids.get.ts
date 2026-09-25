// Runs server-side so the browser never talks to Warcraft Logs directly; the fetch and
// its hourly cache live in server/utils/raidNights.ts.
export type { RaidSummary } from '../utils/raidNights'

export default defineEventHandler(() => fetchRaidNights())

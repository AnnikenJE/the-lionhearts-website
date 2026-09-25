// Runs server-side so the browser never hits Raider.IO directly (avoids CORS); the
// fetch and its hourly cache live in server/utils/rosterData.ts, the transform in
// server/utils/roster.ts.

// Re-exported so the page can keep importing the response type from the route
// that returns it, while the transform stays testable in server/utils.
export type { RosterMember } from '../utils/roster'

export default defineEventHandler(() => fetchRoster())

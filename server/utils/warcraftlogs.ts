// Warcraft Logs v2 is GraphQL only and has no anonymous access: every request carries
// a bearer token from the OAuth client_credentials flow. Runs server-side so the
// credentials never reach the browser and responses can be cached.

import { WCL_NOT_CONFIGURED } from '../../app/utils/wow'

const TOKEN_URL = 'https://www.warcraftlogs.com/oauth/token'
const API_URL = 'https://www.warcraftlogs.com/api/v2/client'

/** Tokens live about a year, so refresh a minute early rather than mid flight. */
const EXPIRY_MARGIN_MS = 60 * 1000

/** The one guild this site is about. Hardcoded, as in `roster.get.ts`. */
export const GUILD = {
  name: 'The Lionhearts',
  serverSlug: 'darkmoon-faire',
  serverRegion: 'EU',
} as const

/**
 * Warcraft Logs exposes difficulty as an integer. These are the retail raid values;
 * anything unmapped falls through to null so the UI simply omits the badge instead of
 * inventing a name.
 */
const DIFFICULTY_NAMES: Record<number, string> = {
  1: 'LFR',
  3: 'Normal',
  4: 'Heroic',
  5: 'Mythic',
}

export const difficultyName = (difficulty: number | null | undefined) =>
  difficulty == null ? null : DIFFICULTY_NAMES[difficulty] ?? null

/**
 * Whether an encounter counts towards a guild raid night: Normal, Heroic or Mythic.
 * A raid log can also hold Mythic+ runs from later that evening, which Warcraft Logs
 * lists as encounters too (difficulty 10; counting them once made a night read "12 of
 * 12 bosses" with 31 raiders), and LFR is matchmaking with strangers, never a guild run.
 */
export const isGuildRaidDifficulty = (difficulty: number | null | undefined) =>
  difficulty === 3 || difficulty === 4 || difficulty === 5

/**
 * The raid tiers the guild has logs for, newest first, as Warcraft Logs zone ids.
 * The first entry is the current tier and the default everywhere. Adding a tier is
 * one line here; Mythic+ zones are left out because they are not raids.
 */
export const RAID_TIERS = [
  { id: 53, name: 'The Venomous Abyss' },
  { id: 50, name: 'Sporefall' },
  { id: 46, name: 'VS / DR / MQD' },
  { id: 44, name: 'Manaforge Omega' },
  { id: 42, name: 'Liberation of Undermine' },
  { id: 38, name: 'Nerub-ar Palace' },
  { id: 35, name: "Amirdrassil, the Dream's Hope" },
  { id: 33, name: 'Aberrus, the Shadowed Crucible' },
  { id: 31, name: 'Vault of the Incarnates' },
  { id: 26, name: 'Castle Nathria' },
] as const

/**
 * Warcraft Logs users who log the guild's raids, by user id. Until late 2024 the
 * guild's logs were uploaded as personal logs with no guild set, so the guild query
 * misses every Dragonflight raid and Nerub-ar Palace. Their logs fill that gap.
 * Found by profiling who uploaded the old logs a long-time raider appears in; each
 * of these logged guild nights with 15 to 22 current roster members in the group.
 */
export const GUILD_LOGGERS = [
  { id: 334947, name: 'LightBladeNinja' },
  { id: 1434422, name: 'Exavu' },
  { id: 2045364, name: 'MrMcsqueezy' },
  { id: 2170668, name: 'Starcrypt' },
  { id: 206767, name: 'Molgran' },
  { id: 2219845, name: 'Lethargy' },
] as const

export type RaidTier = (typeof RAID_TIERS)[number]

/** The tier with this zone id, or the current tier when the id is missing or unknown. */
export const raidTier = (id: unknown): RaidTier =>
  RAID_TIERS.find(tier => tier.id === Number(id)) ?? RAID_TIERS[0]

interface TokenResponse {
  access_token: string
  expires_in: number
}

interface RateLimitData {
  limitPerHour: number
  pointsSpentThisHour: number
  /** Seconds until the hourly points reset. */
  pointsResetIn: number
}

interface GraphQLResponse<T> {
  data?: T & { rateLimitData?: RateLimitData }
  errors?: { message: string }[]
}

/** Every outbound call gives up after this long, so a hanging API cannot hold a page open. */
export const UPSTREAM_TIMEOUT_MS = 15_000

/**
 * How long a result that is missing a part (an outage, a timeout, a refused query)
 * may be served before it is fetched again. Long enough that a struggling API is not
 * asked again on every page view, short enough that the gap closes soon after.
 */
export const INCOMPLETE_MAX_AGE_MS = 10 * 60 * 1000

/**
 * The `validate` for a cached result that says whether it is `complete`: a complete
 * one lives its full maxAge, an incomplete one only INCOMPLETE_MAX_AGE_MS.
 */
export const keepIfComplete = (entry: { value?: { complete: boolean }, mtime?: number }) =>
  entry.value !== undefined
  && (entry.value.complete || Date.now() - (entry.mtime ?? 0) < INCOMPLETE_MAX_AGE_MS)

// Budget -----------------------------------------------------------------------------

/**
 * How urgent a query is. "high" is what a raid page needs to show anything at all;
 * "low" is extra (character parses, scanning the loggers' personal logs) and yields
 * first when the hourly points run short.
 */
export type QueryPriority = 'high' | 'low'

/** Share of the hourly points each priority may use before it is refused. */
const BUDGET_SHARE: Record<QueryPriority, number> = { low: 0.8, high: 0.95 }

export interface Budget {
  spent: number
  limit: number
  /** Epoch milliseconds when the points reset. */
  resetsAt: number
}

/**
 * Whether a query of this priority may run. Warcraft Logs reports points for the
 * whole API client, not per server, so the last reading holds across instances; once
 * the reset time passes, the old reading no longer says anything and every query may
 * run again until the next one comes back.
 */
export const budgetAllows = (budget: Budget | null, priority: QueryPriority, now: number) =>
  !budget || now >= budget.resetsAt || budget.spent < budget.limit * BUDGET_SHARE[priority]

/**
 * Adds `rateLimitData` to a query's top-level selection, as Warcraft Logs' quota docs
 * suggest, so every answer also says how many points are left. The first brace in
 * every query here opens the operation's selection set, since variables sit in
 * parentheses.
 */
export const withRateLimitData = (query: string) =>
  query.replace('{', '{ rateLimitData { limitPerHour pointsSpentThisHour pointsResetIn }')

/** The operation name of a query ("query Raid(...)" is "Raid"), for the logs. */
export const operationName = (query: string) => /query\s+(\w+)/.exec(query)?.[1] ?? 'anonymous'

// The last reading, in module scope like the token.
let budget: Budget | null = null

const BUDGET_EXHAUSTED = 'Warcraft Logs hourly budget reserved'

// Module scope, so a warm instance reuses the token instead of paying for an exchange
// per request. A cold start just fetches a new one, which is cheap and harmless.
let cached: { token: string, expiresAt: number } | null = null

// Shared with the pages, which tell "not set up" apart from an outage the same way.
export { isNotConfigured } from '../../app/utils/wow'

const readCredentials = () => {
  const { wcl: config } = useRuntimeConfig()

  // useRuntimeConfig() without an event is built once at module load and frozen. On
  // Cloudflare the secrets only reach process.env once a request arrives, so the
  // frozen copy never has them; reading process.env here, at call time, does.
  const wcl = {
    clientId: config.clientId || process.env.NUXT_WCL_CLIENT_ID || '',
    clientSecret: config.clientSecret || process.env.NUXT_WCL_CLIENT_SECRET || '',
  }

  // Empty defaults mean "not configured". A 503 lets the page say so plainly, rather
  // than surfacing an auth failure that looks like Warcraft Logs being down.
  if (!wcl.clientId || !wcl.clientSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: WCL_NOT_CONFIGURED,
    })
  }

  return wcl
}

const getAccessToken = async () => {
  if (cached && cached.expiresAt > Date.now()) return cached.token

  const { clientId, clientSecret } = readCredentials()

  const data = await $fetch<TokenResponse>(TOKEN_URL, {
    method: 'POST',
    timeout: UPSTREAM_TIMEOUT_MS,
    headers: {
      // btoa rather than Buffer, so this keeps working on a Workers runtime.
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })

  cached = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - EXPIRY_MARGIN_MS,
  }

  return cached.token
}

/**
 * Runs one GraphQL query and returns its `data`. Errors are normalised to createError
 * so a route can just let them propagate. A query the hourly budget cannot afford is
 * refused before it is sent, with a 503.
 */
export const wclQuery = async <T>(
  query: string,
  variables: Record<string, unknown> = {},
  priority: QueryPriority = 'high',
): Promise<T> => {
  const operation = operationName(query)

  if (!budgetAllows(budget, priority, Date.now())) {
    console.warn(`[wcl] refused ${operation} (${priority}): ${budget?.spent}/${budget?.limit} points this hour`)
    throw createError({ statusCode: 503, statusMessage: BUDGET_EXHAUSTED })
  }

  const send = async (token: string) =>
    $fetch<GraphQLResponse<T>>(API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { query: withRateLimitData(query), variables },
      timeout: UPSTREAM_TIMEOUT_MS,
    })

  let response: GraphQLResponse<T>

  try {
    response = await send(await getAccessToken())
  }
  catch (error) {
    // A cached token can be revoked long before it expires. Drop it and try once more
    // before giving up, otherwise every request would fail until the instance recycles.
    if ((error as { statusCode?: number }).statusCode === 401 && cached) {
      cached = null
      response = await send(await getAccessToken())
    }
    else {
      throw error
    }
  }

  const rate = response.data?.rateLimitData
  if (rate) {
    // One line per query in Cloudflare's function logs, so the hourly spend can be
    // traced to the queries and variables behind it.
    console.log(`[wcl] ${operation} (${priority}) ${JSON.stringify(variables)}: ${Math.round(rate.pointsSpentThisHour)}/${rate.limitPerHour} points this hour`)
    budget = {
      spent: rate.pointsSpentThisHour,
      limit: rate.limitPerHour,
      resetsAt: Date.now() + rate.pointsResetIn * 1000,
    }
  }

  // GraphQL reports failures inside a 200 response, so $fetch never throws for them.
  if (response.errors?.length) {
    const message = response.errors[0]!.message
    throw createError({
      // An unknown report code is a 404 for the page, not an outage.
      statusCode: /does not exist/i.test(message) ? 404 : 502,
      statusMessage: `Warcraft Logs: ${message}`,
    })
  }

  if (!response.data) {
    throw createError({ statusCode: 502, statusMessage: 'Warcraft Logs returned no data' })
  }

  return response.data
}

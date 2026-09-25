// Warcraft Logs v2 is GraphQL only and has no anonymous access: every request carries
// a bearer token from the OAuth client_credentials flow. Runs server-side so the
// credentials never reach the browser and responses can be cached.

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
  { id: 26, name: 'Castle Nathria' },
] as const

export type RaidTier = (typeof RAID_TIERS)[number]

/** The tier with this zone id, or the current tier when the id is missing or unknown. */
export const raidTier = (id: unknown): RaidTier =>
  RAID_TIERS.find(tier => tier.id === Number(id)) ?? RAID_TIERS[0]

interface TokenResponse {
  access_token: string
  expires_in: number
}

interface GraphQLResponse<T> {
  data?: T
  errors?: { message: string }[]
}

// Module scope, so a warm instance reuses the token instead of paying for an exchange
// per request. A cold start just fetches a new one, which is cheap and harmless.
let cached: { token: string, expiresAt: number } | null = null

const NOT_CONFIGURED = 'Warcraft Logs is not configured'

/**
 * True only for the missing-credentials error. Warcraft Logs itself can also answer
 * 503 during an outage, and that must not be mistaken for "not configured": one is
 * permanent until someone sets the secrets, the other passes on its own.
 */
export const isNotConfigured = (error: unknown) =>
  (error as { statusMessage?: string }).statusMessage === NOT_CONFIGURED

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
      statusMessage: NOT_CONFIGURED,
    })
  }

  return wcl
}

const fetchAccessToken = async () => {
  const { clientId, clientSecret } = readCredentials()

  const data = await $fetch<TokenResponse>(TOKEN_URL, {
    method: 'POST',
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

const getAccessToken = async () => {
  if (cached && cached.expiresAt > Date.now()) return cached.token
  return fetchAccessToken()
}

/**
 * Runs one GraphQL query and returns its `data`. Errors are normalised to createError
 * so a route can just let them propagate.
 */
export const wclQuery = async <T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> => {
  const send = async (token: string) =>
    $fetch<GraphQLResponse<T>>(API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { query, variables },
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

  // GraphQL reports failures inside a 200 response, so $fetch never throws for them.
  if (response.errors?.length) {
    throw createError({
      statusCode: 502,
      statusMessage: `Warcraft Logs: ${response.errors[0]!.message}`,
    })
  }

  if (!response.data) {
    throw createError({ statusCode: 502, statusMessage: 'Warcraft Logs returned no data' })
  }

  return response.data
}

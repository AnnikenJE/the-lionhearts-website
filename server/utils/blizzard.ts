// The Blizzard Game Data and Profile APIs. Every request carries a bearer token from the
// OAuth client_credentials flow, the same shape as the Warcraft Logs client. Runs
// server-side so the credentials never reach the browser and responses can be cached.

const TOKEN_URL = 'https://oauth.battle.net/token'

/** The guild is on an EU realm, so every call goes to the EU host, in British English. */
const API_URL = 'https://eu.api.blizzard.com'
const LOCALE = 'en_GB'

/**
 * Blizzard's namespaces: `profile` for characters and guilds, `static` for game data
 * that only changes with a patch, `dynamic` for game data that changes more often.
 * The region suffix has to match the host.
 */
export type BlizzardNamespace = 'profile-eu' | 'static-eu' | 'dynamic-eu'

/** Tokens live 24 hours, so refresh a minute early rather than mid flight. */
const EXPIRY_MARGIN_MS = 60 * 1000

export const BLIZZARD_NOT_CONFIGURED = 'Blizzard API is not configured'

/** True only for the missing-credentials error, not for an outage or a 429. */
export const isBlizzardNotConfigured = (error: unknown) =>
  (error as { statusMessage?: string } | null | undefined)?.statusMessage === BLIZZARD_NOT_CONFIGURED

interface TokenResponse {
  access_token: string
  expires_in: number
}

// Module scope, so a warm instance reuses the token instead of paying for an exchange
// per request. A cold start just fetches a new one, which is cheap and harmless.
let cached: { token: string, expiresAt: number } | null = null

const readCredentials = () => {
  const { blizzard: config } = useRuntimeConfig()

  // Read from process.env at call time too, for the same reason as the Warcraft Logs
  // client: on Cloudflare the secrets only arrive with a request.
  const blizzard = {
    clientId: config.clientId || process.env.NUXT_BLIZZARD_CLIENT_ID || '',
    clientSecret: config.clientSecret || process.env.NUXT_BLIZZARD_CLIENT_SECRET || '',
  }

  if (!blizzard.clientId || !blizzard.clientSecret) {
    throw createError({ statusCode: 503, statusMessage: BLIZZARD_NOT_CONFIGURED })
  }

  return blizzard
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
 * One GET against the Blizzard API, `path` starting with a slash. Returns null for a
 * 404: a character that does not exist, has not logged in for a long time, or is
 * hidden. Anything else that fails (an outage, a 429 over the per-second limit)
 * throws, and is not retried.
 */
export const blizzardGet = async <T>(path: string, namespace: BlizzardNamespace): Promise<T | null> => {
  // Nitro's typed $fetch resolves a bare generic to its own internal-route type, so the
  // result is cast back to T: these are external URLs, never Nitro routes.
  const send = async (token: string) =>
    $fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      query: { namespace, locale: LOCALE },
      timeout: UPSTREAM_TIMEOUT_MS,
    }) as Promise<T>

  try {
    try {
      return await send(await getAccessToken())
    }
    catch (error) {
      // A cached token can be revoked before it expires. Drop it and try once more.
      if ((error as { statusCode?: number }).statusCode === 401 && cached) {
        cached = null
        return await send(await getAccessToken())
      }
      throw error
    }
  }
  catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return null
    throw error
  }
}

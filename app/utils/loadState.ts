/**
 * What an in-page fetch error says, the same pattern on every page that fetches.
 * "Not configured" (the Warcraft Logs secrets are unset) stays until someone sets them,
 * so it is worded apart from an outage, and FetchError offers no retry for it.
 */
export function fetchErrorMessage(subject: string, notConfigured = false): string {
  return notConfigured
    ? `The Warcraft Logs connection is not set up yet, so ${subject} cannot be shown.`
    : `Could not load ${subject} right now.`
}

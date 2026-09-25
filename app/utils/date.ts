/**
 * Every date and time on the site is shown in server time, the time EU realms run on
 * and the raid schedule is written in. It also has to be one fixed zone: the page is
 * rendered on a server in UTC and then hydrated in the visitor's browser, and two
 * different zones made times jump after load ("16:49" becoming "18:49").
 */
export const SERVER_TIME_ZONE = 'Europe/Paris'

/** Dates in en-GB long form, "24 September 2026". */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: SERVER_TIME_ZONE,
  })

/** A 24 hour wall clock in server time, matching formatDate so the two never disagree. */
export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: SERVER_TIME_ZONE,
  })

/** The weekday in server time, "Thursday". */
export const formatWeekday = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', timeZone: SERVER_TIME_ZONE })

/** Raid nights run long enough that a bare minute count is hard to scan, but a leading 0h is just noise. */
export const formatDuration = (ms: number) => {
  if (ms <= 0) return '0m'

  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}m`

  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

/** A fight or a key is minutes and seconds ("5:36"), the way the game's own timers read. */
export const formatClock = (ms: number) => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

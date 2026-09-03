/** Post dates are authored as ISO strings and always shown in en-GB long form. */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

/** Wall-clock times in the viewer's own timezone, matching formatDate, so the two never disagree. */
export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

/** Raid nights run long enough that a bare minute count is hard to scan, but a leading 0h is just noise. */
export const formatDuration = (ms: number) => {
  if (ms <= 0) return '0m'

  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}m`

  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

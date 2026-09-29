export interface ErrorCopy { title: string, lede: string }

// What the error page says for a status code. Only 404 gets its own words; every other
// status shares one fallback, so nothing internal (a message, a stack) is ever needed.
export function errorCopy(statusCode: number | undefined): ErrorCopy {
  if (statusCode === 404) {
    return {
      title: 'Page not found',
      lede: 'That page does not exist, or it has moved somewhere else.',
    }
  }
  return {
    title: 'Something went wrong',
    lede: 'Something broke on our side. Please try again later.',
  }
}

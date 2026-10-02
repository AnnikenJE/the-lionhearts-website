interface LazyServerFetchOptions {
  query?: ComputedRef<Record<string, string | undefined>> | (() => Record<string, string | undefined>)
  key?: string | (() => string)
}

/**
 * Lazy and not awaited on the client, so a navigation lands on the page at once and
 * shows its skeleton instead of holding the previous page until the data arrives.
 * The server still waits, so the first render has the data. Named "Server" rather
 * than Nuxt's own `useLazyFetch` (which never awaits) to avoid colliding with it.
 */
export async function useLazyServerFetch<T>(url: string | (() => string), options: LazyServerFetchOptions = {}) {
  const request = useFetch<T>(url, { ...options, lazy: true })
  if (import.meta.server) await request
  return request
}

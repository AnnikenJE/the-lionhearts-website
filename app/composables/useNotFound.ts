import type { Ref } from 'vue'

/**
 * Sends a page to Nuxt's error page when its fetch 404s. The route answers 404 for an
 * unknown raid or character, but useFetch captures that into `error` instead of throwing.
 * On the server the fetch has finished by setup, so the 404 is thrown there; on a client
 * navigation the page fetches lazily and the 404 arrives later, so a watcher shows it.
 */
export function useNotFound(error: Readonly<Ref<{ statusCode?: number } | null | undefined>>, statusMessage: string) {
  const notFound = () => createError({ statusCode: 404, statusMessage, fatal: true })
  if (error.value?.statusCode === 404) throw notFound()
  if (import.meta.client) {
    watch(error, (value) => {
      if (value?.statusCode === 404) showError(notFound())
    })
  }
}

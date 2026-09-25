interface Tiered {
  tier: { id: number }
  tiers: readonly { id: number }[]
}

/**
 * Fetches a page's data for the raid tier in the URL (?tier=44), for the raids page and
 * the character pages. The key does not include the tier, so switching tier keeps the
 * previous tier on screen while the next one loads (a tier not cached yet can take
 * several seconds); and the last data that loaded is kept through a failed fetch, so an
 * error never takes the tier selector with it.
 */
export async function useTierFetch<T>(
  url: () => string,
  key: () => string,
  tierOf: (data: T) => Tiered | null | undefined,
) {
  const route = useRoute()
  const query = computed(() => (route.query.tier ? { tier: String(route.query.tier) } : {}))

  // A tier other than the default is not a page of its own for search engines.
  useSeoMeta({ robots: () => (route.query.tier ? 'noindex, nofollow' : undefined) })
  const { data, pending, error } = await useFetch<T>(url, { query, key })

  const shown = shallowRef(data.value)
  watch(data, (value) => {
    if (value) shown.value = value
  })

  const tiered = computed(() => (shown.value ? tierOf(shown.value as T) : null))

  // The tier the reader asked for, so the selector moves at once rather than when the
  // data arrives. The first tier is the default and has no query.
  const selectedTierId = computed(() => Number(route.query.tier) || tiered.value?.tiers[0]?.id || 0)
  const switching = computed(() => pending.value && !!tiered.value && tiered.value.tier.id !== selectedTierId.value)

  return { shown, pending, error, selectedTierId, switching }
}

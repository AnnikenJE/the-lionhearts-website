/**
 * Splits a list into pages in place, for lists that should show a few rows and let
 * the reader page on without leaving the page. Goes back to the first page whenever
 * the list itself changes (a new tier, a refetch), so it never points past the end.
 */
export function usePagination<T>(items: MaybeRefOrGetter<T[] | null | undefined>, pageSize = 5) {
  const page = ref(1)

  const all = computed(() => toValue(items) ?? [])
  const pageCount = computed(() => Math.max(1, Math.ceil(all.value.length / pageSize)))
  const pageItems = computed(() => all.value.slice((page.value - 1) * pageSize, page.value * pageSize))

  watch(all, () => (page.value = 1))

  return {
    page,
    pageCount,
    pageItems,
    hasPrevious: computed(() => page.value > 1),
    hasNext: computed(() => page.value < pageCount.value),
    previous: () => (page.value = Math.max(1, page.value - 1)),
    next: () => (page.value = Math.min(pageCount.value, page.value + 1)),
  }
}

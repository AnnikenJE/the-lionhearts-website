<script setup lang="ts">
// Previous and next for a list paged in place with usePagination. Renders nothing
// when everything fits on one page.
defineProps<{
  page: number
  pageCount: number
  hasPrevious: boolean
  hasNext: boolean
}>()

defineEmits<{ previous: [], next: [] }>()

const button
  = 'cursor-pointer rounded-lg border border-line-strong px-3 py-1.5 text-sm font-medium text-fg transition '
    + 'hover:bg-surface-hover disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent'
</script>

<template>
  <nav v-if="pageCount > 1" aria-label="Pages" class="mt-4 flex items-center justify-between gap-4">
    <button type="button" :class="button" :disabled="!hasPrevious" @click="$emit('previous')">
      <span aria-hidden="true">←</span> Previous
    </button>
    <span class="text-sm tabular-nums text-fg-subtle" aria-live="polite">Page {{ page }} of {{ pageCount }}</span>
    <button type="button" :class="button" :disabled="!hasNext" @click="$emit('next')">
      Next <span aria-hidden="true">→</span>
    </button>
  </nav>
</template>

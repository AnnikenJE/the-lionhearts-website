<script setup lang="ts">
// The in-page error for a failed fetch, worded by fetchErrorMessage() so every page says
// it the same way. An outage gets a retry; "not configured" does not, since no retry can
// fix it. role="status" lets a screen reader hear it without moving focus.
const { subject, notConfigured = false, retrying = false, note = '' } = defineProps<{
  subject: string
  notConfigured?: boolean
  retrying?: boolean
  // An extra sentence after the message, e.g. which tier is still on screen.
  note?: string
}>()

const emit = defineEmits<{ retry: [] }>()

// One string, so exactly one space separates the message from the note.
const message = computed(() => [fetchErrorMessage(subject, notConfigured), note].filter(Boolean).join(' '))
</script>

<template>
  <div
    role="status"
    class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl border border-line bg-surface px-5 py-4"
  >
    <p :class="notConfigured ? 'text-info' : 'text-fg-muted'">
      {{ message }}
    </p>
    <button
      v-if="!notConfigured"
      type="button"
      class="shrink-0 cursor-pointer rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-fg transition hover:bg-surface-hover disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent"
      :disabled="retrying"
      @click="emit('retry')"
    >
      {{ retrying ? 'Trying again…' : 'Try again' }}
    </button>
  </div>
</template>

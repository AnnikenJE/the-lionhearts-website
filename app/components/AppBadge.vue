<script setup lang="ts">
const { tone = 'accent' } = defineProps<{ tone?: 'accent' | 'neutral' }>()

const TONES = {
  accent: 'border-accent/30 bg-accent/5 text-accent',
  neutral: 'border-line bg-surface text-fg-muted',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
    :class="TONES[tone]"
  >
    <slot />
  </span>
</template>

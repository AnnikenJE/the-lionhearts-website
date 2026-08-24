<script setup lang="ts">
// Renders a link when given a destination, otherwise a plain button.
const { variant = 'primary', to = '', href = '' } = defineProps<{
  variant?: 'primary' | 'secondary'
  /** Internal route. */
  to?: string
  /** External URL. Opens in a new tab. */
  href?: string
}>()

const VARIANTS = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-bright',
  secondary: 'border border-line-strong text-fg hover:bg-surface-hover',
}

const classes = [
  'inline-block rounded-lg px-4 py-2.5 text-sm font-semibold transition',
  VARIANTS[variant],
]
</script>

<template>
  <NuxtLink
    v-if="to || href"
    :to="to ?? href"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noopener' : undefined"
    :class="classes"
  >
    <slot />
  </NuxtLink>
  <button v-else type="button" :class="[classes, 'cursor-pointer']">
    <slot />
  </button>
</template>

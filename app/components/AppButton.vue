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

// Both props default to '', so this has to be a falsy check: `to ?? href`
// would keep the empty string and render a link that goes nowhere.
const destination = to || href

const classes = [
  'inline-block rounded-lg px-4 py-2.5 text-sm font-semibold transition',
  VARIANTS[variant],
]
</script>

<template>
  <NuxtLink
    v-if="destination"
    :to="destination"
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

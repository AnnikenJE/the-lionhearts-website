<script setup lang="ts">
// A link styled as a button: `to` for an internal route, `href` for an external URL,
// which opens in a new tab.
const { variant = 'primary', to = '', href = '' } = defineProps<{
  variant?: 'primary' | 'secondary'
  to?: string
  href?: string
}>()

const VARIANTS = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-bright',
  secondary: 'border border-line-strong text-fg hover:bg-surface-hover',
}
</script>

<template>
  <NuxtLink
    :to="to || href"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noopener' : undefined"
    :class="['inline-block rounded-lg px-4 py-2.5 text-sm font-semibold transition', VARIANTS[variant]]"
  >
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
// A link styled as a button: `to` for an internal route, `href` for an external URL,
// which opens in a new tab.
const { variant = 'primary', to = '', href = '' } = defineProps<{
  variant?: 'primary' | 'secondary'
  to?: string
  href?: string
}>()

const VARIANTS = {
  primary: BUTTON_PRIMARY,
  secondary: BUTTON_SECONDARY,
}
</script>

<template>
  <NuxtLink
    :to="to || href"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noopener' : undefined"
    :class="[BUTTON_BASE, VARIANTS[variant]]"
  >
    <slot />
  </NuxtLink>
</template>

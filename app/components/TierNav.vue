<script setup lang="ts">
// The raid tier selector, shared by the raids page and the character pages. Each tier
// is a link that sets ?tier=<zone id>, so a tier can be shared and the back button
// works; the current tier (the first) gets the clean URL with no query at all.
defineProps<{
  tiers: { id: number, name: string }[]
  currentId: number
}>()

const pill = 'rounded-full border px-3 py-1 text-xs font-medium transition'
</script>

<template>
  <nav aria-label="Raid tier" class="flex flex-wrap gap-2">
    <NuxtLink
      v-for="(tier, index) in tiers"
      :key="tier.id"
      :to="{ query: index === 0 ? {} : { tier: tier.id } }"
      :class="[
        pill,
        tier.id === currentId
          ? 'border-accent/40 bg-accent/10 text-accent'
          : 'border-line text-fg-muted hover:border-line-strong hover:text-fg',
      ]"
      :aria-current="tier.id === currentId ? 'page' : undefined"
    >
      {{ tier.name }}
    </NuxtLink>
  </nav>
</template>

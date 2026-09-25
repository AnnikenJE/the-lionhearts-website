<script setup lang="ts">
// The raid tier selector, shared by the raids page and the character pages. Each tier
// is a link that sets ?tier=<zone id>, so a tier can be shared and the back button
// works; the current tier (the first) gets the clean URL with no query at all. The links
// are nofollow and a tier page is noindex (see useTierFetch): every character page has
// one per tier, thousands of URLs that each cost Warcraft Logs queries, and crawlers
// have no business walking them.
defineProps<{
  tiers: readonly { id: number, name: string }[]
  currentId: number
}>()
</script>

<template>
  <nav aria-label="Raid tier" class="flex flex-wrap gap-2">
    <NuxtLink
      v-for="(tier, index) in tiers"
      :key="tier.id"
      :to="{ query: index === 0 ? {} : { tier: tier.id } }"
      :class="[PILL, tier.id === currentId ? PILL_ON : PILL_OFF]"
      :aria-current="tier.id === currentId ? 'page' : undefined"
      rel="nofollow"
    >
      {{ tier.name }}
    </NuxtLink>
  </nav>
</template>

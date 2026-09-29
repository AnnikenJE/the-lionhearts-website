<script setup lang="ts">
// The raid tier selector, shared by the raids page and the character pages. Each tier
// is a link that sets ?tier=<zone id>, so a tier can be shared and the back button
// works; the current tier (the first) gets the clean URL with no query at all. The links
// are nofollow and a tier page is noindex (see useTierFetch): every character page has
// one per tier, thousands of URLs that each cost Warcraft Logs queries, and crawlers
// have no business walking them.
// `busy` shows that the selected tier is still loading, next to the pills, while the
// page keeps the previous tier on screen.
const { tiers, currentId, busy = false } = defineProps<{
  tiers: readonly { id: number, name: string }[]
  currentId: number
  busy?: boolean
}>()

const currentName = computed(() => tiers.find(tier => tier.id === currentId)?.name ?? 'the tier')
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
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
    <!-- Always rendered, so the live region exists before its text changes. -->
    <p role="status" class="flex items-center gap-2 text-xs text-fg-subtle">
      <template v-if="busy">
        <span
          class="size-3.5 rounded-full border-2 border-line-strong border-t-fg-muted motion-safe:animate-spin"
          aria-hidden="true"
        />
        Loading {{ currentName }}…
      </template>
    </p>
  </div>
</template>

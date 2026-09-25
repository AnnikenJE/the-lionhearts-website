<script setup lang="ts">
import type { RaidNightsResponse } from '~~/server/api/raids.get'

const route = useRoute()

// The tier lives in the URL (?tier=44) and drives the fetch, so picking a tier in
// TierNav refetches without a full page load. One fixed key for every tier keeps the
// previous tier on screen while the next loads: keyed by URL, a new tier would start
// empty, and a tier not cached yet can take several seconds.
const query = computed(() => (route.query.tier ? { tier: String(route.query.tier) } : {}))
const { data, pending, error } = await useFetch<RaidNightsResponse>('/api/raids', { query, key: 'raids' })

// The last tier that loaded. A failed fetch resets `data`, and without this the tier
// selector would vanish with it, leaving no way to try another tier.
const shown = shallowRef(data.value)
watch(data, (value) => {
  if (value) shown.value = value
})

// The tier the reader asked for, so the selector moves at once rather than when the
// data arrives. The first tier is the default with no query.
const selectedTierId = computed(() => Number(route.query.tier) || shown.value?.tiers[0]?.id || 0)
const selectedTierName = computed(() => shown.value?.tiers.find(tier => tier.id === selectedTierId.value)?.name ?? 'this tier')
const switching = computed(() => pending.value && !!shown.value && shown.value.tier.id !== selectedTierId.value)

const raids = computed(() => shown.value?.nights ?? [])

// wclQuery throws a 503 when the Warcraft Logs credentials are not configured,
// so that specific status gets its own message instead of the generic error one.
const notConfigured = computed(() => error.value?.statusCode === 503)

// Shared by every row, so the left and right halves of the list line up the
// same way regardless of which fields a given raid has.
const row = 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4 transition hover:bg-surface-hover'
usePageSeo({
  title: 'Raids',
  description:
    "The guild's raid nights, tier by tier, pulled straight from its Warcraft Logs uploads: "
    + 'bosses down, and who was there.',
})
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <header>
      <h1 class="text-display text-fg">Raids</h1>
      <p class="mt-5 text-lg text-fg-muted">
        The guild's raid nights, tier by tier, pulled straight from its Warcraft
        Logs uploads.
      </p>
    </header>

    <TierNav v-if="shown" class="mt-10" :tiers="shown.tiers" :current-id="selectedTierId" />

    <p v-if="pending && !shown" class="mt-12 text-fg-muted">Loading raids…</p>
    <p v-else-if="notConfigured" class="mt-12 text-fg-muted">
      The Warcraft Logs connection is not set up yet, so there is nothing to show here.
    </p>
    <p v-else-if="error" class="mt-8 text-fg-muted">Could not load {{ selectedTierName }} right now.</p>
    <p v-else-if="!raids.length" class="mt-8 text-fg-muted">No raid nights logged in {{ shown?.tier.name }}.</p>

    <ul
      v-else
      class="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface transition-opacity"
      :class="{ 'opacity-50': switching }"
      :aria-busy="switching"
    >
      <li v-for="raid in raids" :key="raid.code">
        <NuxtLink :to="`/raids/${raid.code}`" :class="row">
          <span class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-fg">{{ raid.zone ?? raid.title }}</span>
            <AppBadge v-if="raid.difficulty" tone="neutral">{{ raid.difficulty }}</AppBadge>
          </span>
          <span class="flex flex-wrap items-baseline gap-x-2 text-sm text-fg-subtle">
            <time :datetime="raid.startedAt">{{ formatDate(raid.startedAt) }}</time>
            <span aria-hidden="true">·</span>
            <span>{{ raid.bossesKilled }} of {{ plural(raid.bossesPulled, 'boss', 'bosses') }} down</span>
            <span aria-hidden="true">·</span>
            <span>{{ plural(raid.raiderCount, 'raider') }}</span>
            <template v-if="raid.logCount > 1">
              <span aria-hidden="true">·</span>
              <span>{{ raid.logCount }} logs</span>
            </template>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import type { RaidSummary } from '~~/server/api/raids.get'

const { data: raids, pending, error } = await useFetch<RaidSummary[]>('/api/raids')

// wclQuery throws a 503 when the Warcraft Logs credentials are not configured,
// so that specific status gets its own message instead of the generic error one.
const notConfigured = computed(() => error.value?.statusCode === 503)

// Shared by every row, so the left and right halves of the list line up the
// same way regardless of which fields a given raid has.
const row = 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4 transition hover:bg-surface-hover'
usePageSeo({
  title: 'Raids',
  description:
    "The guild's recent raid nights, pulled straight from its Warcraft Logs uploads: "
    + 'bosses down, and who was there.',
})
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <header>
      <h1 class="text-display text-fg">Raids</h1>
      <p class="mt-5 text-lg text-fg-muted">
        The guild's recent raid nights, pulled straight from its Warcraft Logs
        uploads. Click one to see who was there.
      </p>
    </header>

    <p v-if="pending" class="mt-12 text-fg-muted">Loading raids…</p>
    <p v-else-if="notConfigured" class="mt-12 text-fg-muted">
      The Warcraft Logs connection is not set up yet, so there is nothing to show here.
    </p>
    <p v-else-if="error" class="mt-12 text-fg-muted">Could not load recent raids right now.</p>
    <p v-else-if="!raids?.length" class="mt-12 text-fg-muted">No raids logged yet.</p>

    <ul v-else class="mt-10 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
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
          </span>
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>

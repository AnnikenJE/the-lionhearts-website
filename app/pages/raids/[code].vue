<script setup lang="ts">
import type { RaidDetail, RaidFight } from '~~/server/api/raids/[code].get'

const route = useRoute()
const { data: raid, pending, error } = await useFetch<RaidDetail>(`/api/raids/${route.params.code}`)

// The server route already 404s for a bad code or a report Warcraft Logs doesn't
// know, but useFetch captures that into error rather than throwing, so it has to
// be re-thrown here for Nuxt to render its error page, same as news/[slug].vue.
if (error.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Raid not found', fatal: true })
}

// wclQuery throws a 503 when the Warcraft Logs credentials are not configured,
// so that specific status gets its own message instead of the generic error one.
const notConfigured = computed(() => error.value?.statusCode === 503)

// formatDate has no weekday, so it is derived separately here rather than faked.
const weekday = computed(() =>
  raid.value ? new Date(raid.value.startedAt).toLocaleDateString('en-GB', { weekday: 'long' }) : '',
)

const killedCount = computed(() => raid.value?.fights.filter(f => f.kill).length ?? 0)
const totalCount = computed(() => raid.value?.fights.length ?? 0)

const fightStatus = (fight: RaidFight) => {
  if (fight.kill) {
    return fight.pulls > 1 ? `Killed after ${plural(fight.pulls, 'pull')}` : 'Killed'
  }
  const pulls = plural(fight.pulls, 'pull')
  return fight.bestPercent != null ? `${pulls}, best ${fight.bestPercent.toFixed(1)}%` : pulls
}

const raiderCount = computed(() => {
  if (!raid.value) return 0
  return raid.value.tanks.length + raid.value.healers.length + raid.value.dps.length
})

// Empty subgroups are dropped here rather than in the template, so an empty
// heading never has a chance to render.
const subgroups = computed(() => {
  if (!raid.value) return []
  return [
    { label: 'Tanks', members: raid.value.tanks },
    { label: 'Healers', members: raid.value.healers },
    { label: 'DPS', members: raid.value.dps },
  ].filter(group => group.members.length > 0)
})

// Shared by the Bosses and Who was there blocks, the same divider rule
// app/pages/index.vue uses between its own top-level sections.
const section = 'mt-16 border-t border-line pt-16'
// A getter rather than a plain object, so the tags follow the fetched raid
// instead of being read once while it is still empty.
usePageSeo(() => ({
  title: raid.value
    ? `${raid.value.zone ?? raid.value.title}, ${formatDate(raid.value.startedAt)}`
    : 'Raid night',
  description: raid.value
    ? `${killedCount.value} of ${totalCount.value} bosses down with `
      + `${plural(raiderCount.value, 'raider')}, ${weekday.value} ${formatDate(raid.value.startedAt)}.`
    : 'A raid night from The Lionhearts, logged on Warcraft Logs.',
}))
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <NuxtLink to="/raids" class="text-sm text-fg-muted transition hover:text-fg">
      <span aria-hidden="true">←</span> All raids
    </NuxtLink>

    <p v-if="pending" class="mt-12 text-fg-muted">Loading raid…</p>
    <p v-else-if="notConfigured" class="mt-12 text-fg-muted">
      The Warcraft Logs connection is not set up yet, so this raid can't be shown.
    </p>
    <p v-else-if="error" class="mt-12 text-fg-muted">Could not load this raid right now.</p>

    <template v-else-if="raid">
      <h1 class="mt-6 text-display text-fg">{{ raid.zone ?? raid.title }}</h1>

      <p class="mt-5 text-lg text-fg-muted">
        {{ weekday }} {{ formatDate(raid.startedAt) }}, {{ formatTime(raid.startedAt) }}
        to {{ formatTime(raid.endedAt) }} ({{ formatDuration(raid.durationMs) }})
      </p>

      <AppButton :href="raid.logUrl" class="mt-6">View on Warcraft Logs</AppButton>

      <section :class="section">
        <SectionHeading class="mb-6">
          Bosses
          <template #end>{{ killedCount }} killed of {{ totalCount }}</template>
        </SectionHeading>

        <p v-if="!raid.fights.length" class="text-fg-muted">No boss pulls in this log.</p>
        <ul v-else class="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          <li
            v-for="fight in raid.fights"
            :key="fight.id"
            class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4"
          >
            <span class="flex flex-wrap items-center gap-2">
              <span class="text-fg">{{ fight.name }}</span>
              <AppBadge v-if="fight.difficulty" tone="neutral">{{ fight.difficulty }}</AppBadge>
            </span>
            <span class="text-sm text-fg-subtle">{{ fightStatus(fight) }}</span>
          </li>
        </ul>
      </section>

      <section :class="section">
        <SectionHeading class="mb-6">
          Who was there
          <template #end>{{ plural(raiderCount, 'raider') }}</template>
        </SectionHeading>

        <div class="flex flex-col gap-6">
          <div v-for="group in subgroups" :key="group.label">
            <h3 class="text-sm font-medium text-fg-subtle">
              {{ group.label }} <span class="text-fg-subtle">({{ group.members.length }})</span>
            </h3>
            <div class="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 md:grid-cols-4">
              <p v-for="player in group.members" :key="player.name" class="truncate text-sm">
                <span :style="{ color: classColor(player.className) }">{{ player.name }}</span>
                <span v-if="player.spec" class="text-fg-subtle"> {{ player.spec }}</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

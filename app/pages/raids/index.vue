<script setup lang="ts">
import type { RaidNightsResponse } from '~~/server/api/raids.get'
import { DISCORD_URL } from '~/data/links'

// One key for every tier; see useTierFetch.
const { shown, pending, error, selectedTierId, switching, refresh } = await useTierFetch<RaidNightsResponse>(
  () => '/api/raids',
  () => 'raids',
  response => response,
)

const selectedTierName = computed(() => shown.value?.tiers.find(tier => tier.id === selectedTierId.value)?.name ?? 'this tier')
const raids = computed(() => shown.value?.nights ?? [])
const notConfigured = computed(() => isNotConfigured(error.value))

// Shared by every row, so the left and right halves of the list line up the
// same way regardless of which fields a given raid has.
const row = ROW_LINK
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
        We run casual, social raids, aiming for Ahead of the Curve every season.
        Raids are open to everyone in the guild, though progression raids have
        some requirements. If you have any questions about raiding, ask us on
        <a :href="DISCORD_URL" target="_blank" rel="noopener" class="font-medium text-accent hover:text-accent-bright">Discord</a>.
      </p>
    </header>

    <section class="mt-14">
      <SectionHeading class="mb-5">Raid schedule</SectionHeading>
      <RaidSchedule />
    </section>

    <section class="mt-14">
      <SectionHeading class="mb-5">Logged nights</SectionHeading>
      <p class="mb-5 text-fg-muted">All raid nights are taken from Warcraft Logs.</p>
      <TierNav v-if="shown" :tiers="shown.tiers" :current-id="selectedTierId" :busy="switching" />

      <!-- Before anything has loaded there is no TierNav yet, so the skeleton carries the pills. -->
      <LoadingSkeleton v-if="pending && !shown" shape="raids" label="Loading the raid nights" />
      <template v-else>
        <!-- A failed tier switch keeps the previous tier's list below the error. -->
        <FetchError
          v-if="error"
          :class="shown ? 'mt-8' : 'mt-12'"
          :subject="notConfigured ? 'the raid nights' : selectedTierName"
          :not-configured="notConfigured"
          :note="shown ? `Showing ${shown.tier.name}.` : ''"
          :retrying="pending"
          @retry="refresh()"
        />
        <template v-if="shown">
          <EmptyState v-if="!raids.length" class="mt-8" :message="`No raid nights logged in ${shown.tier.name}.`" />
          <ul
            v-else
            :class="[CARD_DIVIDED, 'mt-6 transition-opacity', { 'opacity-50': switching }]"
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
        </template>
      </template>
    </section>
  </main>
</template>

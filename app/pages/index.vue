<script setup lang="ts">
import { NEWS_ENABLED } from '~/data/news'
import type { RaidNightsResponse } from '~~/server/api/raids.get'

// Nothing is queried while news is off, so no draft titles reach the payload.
const { data: latest } = await useAsyncData('news-latest', () =>
  NEWS_ENABLED
    ? queryCollection('news').order('date', 'DESC').limit(3).all()
    : Promise.resolve([]),
)

// Current tier only, no ?tier= selector: the landing page shows what's current, not
// history. Hidden quietly (not an error) while pending, not configured, or empty, the
// same way the news block stays out of the way with nothing to show.
const { data: raidData } = await useLazyServerFetch<RaidNightsResponse>('/api/raids')
const progress = computed(() => raidData.value?.progress ?? [])

const section = SECTION
// The landing page sets no title of its own, so the tab shows the guild name
// alone rather than repeating it twice.
usePageSeo({
  description:
    'Social raiding and Mythic+ on Darkmoon Faire (EU). Two raid nights a week, '
    + 'keys all week, and a roster that makes room for new players.',
})
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <!-- The copy column comes first in the DOM so the h1 lines up with the
         title on every other page and the crest can never push it. -->
    <header class="flex flex-col-reverse items-start gap-10 sm:flex-row sm:items-center sm:gap-12">
      <div class="min-w-0 flex-1">
        <AppBadge tone="neutral">
          Darkmoon Faire <span class="mx-1.5 text-fg-subtle" aria-hidden="true">·</span> EU
        </AppBadge>

        <h1 class="mt-5 text-display text-fg">The Lionhearts</h1>

        <p class="mt-5 text-lg text-fg-muted">
          Social guild with a focus on Heroic raiding and Mythic+.
        </p>
      </div>

      <div class="w-28 shrink-0 sm:w-56">
        <GuildCrest />
      </div>
    </header>

    <section v-if="progress.length" :class="section">
      <SectionHeading class="mb-6">Raids</SectionHeading>

      <p class="text-sm tabular-nums text-fg-subtle">
        <template v-for="(d, index) in progress" :key="d.difficulty">
          <span v-if="index > 0" aria-hidden="true"> · </span>{{ d.bossesKilled }}/{{ d.bossesPulled }} {{ d.difficulty }}
        </template>
      </p>

      <AppButton to="/raids" variant="secondary" class="mt-5">View raid logs</AppButton>
    </section>

    <!-- Rendered even while news is off, so there is always a way through to
         the section from the landing page. -->
    <section :class="section">
      <SectionHeading class="mb-6">
        Latest news
        <template #end>
          <NuxtLink to="/news" class="-my-1 inline-block py-1 font-medium text-accent hover:text-accent-bright">
            All news <span aria-hidden="true">→</span>
          </NuxtLink>
        </template>
      </SectionHeading>

      <EmptyState v-if="!latest?.length" message="No posts yet, check back soon." />
      <template v-else>
        <NuxtLink :to="latest[0]!.path" :class="[CARD, ROW_LINK]">
          <span class="font-medium text-fg">{{ latest[0]!.title }}</span>
          <time class="text-sm text-fg-subtle">{{ formatDate(latest[0]!.date) }}</time>
        </NuxtLink>

        <!-- Heading only: these two are a way back to a post you already know about,
             not a second chance to sell it. -->
        <ul v-if="latest.length > 1" class="mt-3 space-y-1">
          <li v-for="post in latest.slice(1)" :key="post.path">
            <NuxtLink :to="post.path" class="-my-1 inline-block py-1 text-sm text-fg-muted transition hover:text-fg hover:underline">
              {{ post.title }}
            </NuxtLink>
          </li>
        </ul>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { Feature } from '~/components/FeatureGrid.vue'
import { NEWS_ENABLED } from '~/data/news'
import { DISCORD_URL } from '~/data/links'

// Nothing is queried while news is off, so no draft titles reach the payload.
const { data: latest } = await useAsyncData('news-latest', () =>
  NEWS_ENABLED
    ? queryCollection('news').order('date', 'DESC').limit(3).all()
    : Promise.resolve([]),
)

const HIGHLIGHTS: Feature[] = [
  {
    title: 'Social raiding',
    body: 'Two fixed nights a week. We clear content together at a pace that keeps it fun rather than a second job.',
  },
  {
    title: 'Mythic+ all week',
    body: 'Keys run outside raid nights, from casual weekly runs to pushing groups. There is almost always something going.',
  },
  {
    title: 'Beginner-friendly',
    body: 'New to raiding? You are welcome here. Ask questions, learn the fights, and take the time you need.',
  },
]

const section = 'mt-16 border-t border-line pt-16'
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
          A social raiding guild that also runs Mythic+. Beginner-friendly, with
          a mixed community, from first-time raiders to Mythic veterans.
        </p>

        <div class="mt-9 flex flex-wrap items-center gap-3">
          <AppButton :href="DISCORD_URL">Join our Discord</AppButton>
          <AppButton to="/roster" variant="secondary">See the roster</AppButton>
        </div>
      </div>

      <div class="w-28 shrink-0 sm:w-56">
        <GuildCrest />
      </div>
    </header>

    <section :class="section">
      <FeatureGrid :items="HIGHLIGHTS" :level="2" />
    </section>

    <section :class="section">
      <SectionHeading class="mb-6">Raid nights</SectionHeading>
      <RaidSchedule />
    </section>

    <section v-if="NEWS_ENABLED" :class="section">
      <SectionHeading class="mb-6">
        Latest news
        <template #end>
          <NuxtLink to="/news" class="font-medium text-accent hover:text-accent-bright">
            All news <span aria-hidden="true">→</span>
          </NuxtLink>
        </template>
      </SectionHeading>

      <p v-if="!latest?.length" class="text-fg-muted">
        No posts yet, check back soon.
      </p>
      <ul v-else class="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        <li v-for="post in latest" :key="post.path">
          <NuxtLink
            :to="post.path"
            class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4 transition hover:bg-surface-hover"
          >
            <span class="font-medium text-fg">{{ post.title }}</span>
            <time class="text-sm text-fg-subtle">{{ formatDate(post.date) }}</time>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </main>
</template>

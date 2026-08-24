<script setup lang="ts">
import { NEWS_ENABLED } from '~/data/news'
import { DISCORD_URL } from '~/data/links'

// Nothing is queried while news is off, so no draft titles reach the payload.
const { data: latest } = await useAsyncData('news-latest', () =>
  NEWS_ENABLED
    ? queryCollection('news').order('date', 'DESC').limit(3).all()
    : Promise.resolve([]),
)

// One line per page, so the landing page is a way in rather than a copy of
// what those pages already say.
const EXPLORE = [
  { to: '/about', title: 'About the guild', body: 'What we run, how we raid, and who to ask.' },
  { to: '/roster', title: 'Roster', body: 'Every member, grouped by rank and searchable.' },
  { to: '/rules', title: 'Rules', body: 'The guild and raid rules.' },
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
          Social raiding and Mythic+ on Darkmoon Faire.
        </p>

        <div class="mt-9 flex flex-wrap items-center gap-3">
          <AppButton :href="DISCORD_URL">Join our Discord</AppButton>
          <AppButton to="/about" variant="secondary">Read about the guild</AppButton>
        </div>
      </div>

      <div class="w-28 shrink-0 sm:w-56">
        <GuildCrest />
      </div>
    </header>

    <section :class="section">
      <SectionHeading class="mb-6">Raid nights</SectionHeading>
      <RaidSchedule />
    </section>

    <section :class="section">
      <SectionHeading class="mb-6">Explore</SectionHeading>
      <ul class="grid gap-4 sm:grid-cols-3">
        <li v-for="item in EXPLORE" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition hover:border-line-strong hover:bg-surface-hover"
          >
            <h3 class="font-semibold text-fg">{{ item.title }}</h3>
            <p class="mt-2 text-sm text-fg-muted">{{ item.body }}</p>
            <span class="mt-4 text-sm font-medium text-accent">
              Open <span aria-hidden="true">→</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <!-- Rendered even while news is off, so there is always a way through to
         the section from the landing page. -->
    <section :class="section">
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

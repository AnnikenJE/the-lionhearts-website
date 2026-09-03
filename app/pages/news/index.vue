<script setup lang="ts">
import { NEWS_ENABLED } from '~/data/news'

// Nothing is queried while news is off, so no draft titles reach the payload.
const { data: posts } = await useAsyncData('news-list', () =>
  NEWS_ENABLED
    ? queryCollection('news').order('date', 'DESC').all()
    : Promise.resolve([]),
)

const lead = computed(() => posts.value?.[0])
const rest = computed(() => posts.value?.slice(1) ?? [])

// Falls back to the description @nuxt/content derives from the first
// paragraph, so a post without a hand-written summary still shows a preview.
const summaryOf = (post: { summary?: string, description?: string }) =>
  post.summary || post.description

const meta = 'flex flex-wrap items-center gap-2 text-sm text-fg-subtle'
const card = 'rounded-xl border border-line bg-surface transition hover:border-line-strong hover:bg-surface-hover'
usePageSeo({
  title: 'News',
  description: 'Raid progress, roster changes and guild announcements from The Lionhearts.',
})
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <header>
      <h1 class="text-display text-fg">News</h1>
      <p class="mt-5 text-lg text-fg-muted">
        Raid progress, roster changes and guild announcements.
      </p>
    </header>

    <div
      v-if="!NEWS_ENABLED"
      class="mt-12 rounded-2xl border border-line bg-surface p-10 text-center sm:p-14"
    >
      <AppBadge>Coming soon</AppBadge>
      <h2 class="mt-5 text-2xl font-semibold text-fg">Nothing posted yet</h2>
      <p class="mx-auto mt-3 max-w-md text-fg-muted">
        We are still setting this up. Until it goes live, the Discord has
        everything.
      </p>
      <AppButton to="/" variant="secondary" class="mt-7">Back to the home page</AppButton>
    </div>

    <p v-else-if="!posts?.length" class="mt-12 text-fg-muted">
      No posts yet, check back soon.
    </p>

    <template v-else>
      <NuxtLink v-if="lead" :to="lead.path" :class="[card, 'mt-12 block rounded-2xl p-6 sm:p-8']">
        <p :class="meta">
          <span class="rounded-full border border-accent/30 bg-accent/5 px-2.5 py-0.5 text-xs font-medium text-accent">
            Latest
          </span>
          <time :datetime="lead.date">{{ formatDate(lead.date) }}</time>
          <span v-if="lead.author"><span aria-hidden="true">·</span> {{ lead.author }}</span>
        </p>
        <h2 class="mt-4 text-3xl font-bold text-fg">{{ lead.title }}</h2>
        <p v-if="summaryOf(lead)" class="mt-3 max-w-2xl text-lg text-fg-muted">
          {{ summaryOf(lead) }}
        </p>
        <span class="mt-5 inline-block text-sm font-medium text-accent">
          Read the post <span aria-hidden="true">→</span>
        </span>
      </NuxtLink>

      <template v-if="rest.length">
        <SectionHeading class="mb-5 mt-14">Earlier posts</SectionHeading>
        <ul class="grid gap-4 sm:grid-cols-2">
          <li v-for="post in rest" :key="post.path">
            <NuxtLink :to="post.path" :class="[card, 'block h-full p-5']">
              <p :class="meta">
                <time :datetime="post.date">{{ formatDate(post.date) }}</time>
                <span v-if="post.author"><span aria-hidden="true">·</span> {{ post.author }}</span>
              </p>
              <h3 class="mt-2 text-lg font-semibold text-fg">{{ post.title }}</h3>
              <p v-if="summaryOf(post)" class="mt-2 text-sm text-fg-muted">{{ summaryOf(post) }}</p>
            </NuxtLink>
          </li>
        </ul>
      </template>
    </template>
  </main>
</template>

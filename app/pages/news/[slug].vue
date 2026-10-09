<script setup lang="ts">
import { AUTHOR_AVATARS, NEWS_ENABLED } from '~/data/news'

const route = useRoute()
const notFound = () =>
  createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })

// While news is off the posts are still drafts, so no slug is reachable.
if (!NEWS_ENABLED) throw notFound()

const { data: post } = await useAsyncData(`news-${route.path}`, () =>
  queryCollection('news').path(route.path).first(),
)

if (!post.value) throw notFound()

// A getter rather than a plain object, so the tags follow the fetched post
// instead of being read once while it is still empty.
usePageSeo(() => ({
  title: post.value?.title,
  // The schema's own summary first, then the description @nuxt/content derives
  // from the opening paragraph.
  description: post.value?.summary || post.value?.description || 'A post from The Lionhearts.',
  type: 'article',
}))
</script>

<template>
  <main v-if="post" class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <NuxtLink to="/news" class="-my-2 inline-block py-2 text-sm text-fg-muted transition hover:text-fg">
      <span aria-hidden="true">←</span> All news
    </NuxtLink>

    <h1 class="mt-6 text-display text-fg">{{ post.title }}</h1>

    <!-- The body is constrained, not the page, so the h1 keeps its position. -->
    <div class="max-w-3xl">
      <p class="mt-4 flex items-center gap-1.5 border-b border-line pb-8 text-sm text-fg-subtle">
        {{ formatDate(post.date) }}
        <template v-if="post.author">
          <span aria-hidden="true">·</span>
          <span v-if="AUTHOR_AVATARS[post.author]" class="inline-block size-9 shrink-0 overflow-hidden rounded-full border border-line">
            <img :src="AUTHOR_AVATARS[post.author]" alt="" class="size-full scale-125 object-cover">
          </span>
          {{ post.author }}
        </template>
      </p>

      <article :class="[PROSE, 'mt-8 flow-root']">
        <ContentRenderer :value="post" />
      </article>
    </div>
  </main>
</template>

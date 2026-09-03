<script setup lang="ts">
import { NEWS_ENABLED } from '~/data/news'

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
// Markdown renders to plain HTML with no classes of its own, so typography
// supplies the rhythm and these variants pull it onto the site palette.
const prose = [
  'prose prose-invert prose-lg max-w-none',
  'prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-fg',
  'prose-p:text-fg-muted prose-li:text-fg-muted prose-li:marker:text-fg-subtle',
  'prose-strong:text-fg prose-code:text-fg',
  'prose-a:font-medium prose-a:text-accent prose-a:underline-offset-4',
  'prose-blockquote:border-line-strong prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-fg-subtle',
  'prose-hr:border-line prose-th:text-fg prose-thead:border-line-strong prose-tr:border-line',
].join(' ')
</script>

<template>
  <main v-if="post" class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <NuxtLink to="/news" class="text-sm font-medium text-fg-subtle transition hover:text-fg">
      <span aria-hidden="true">←</span> All news
    </NuxtLink>

    <h1 class="mt-6 text-display text-fg">{{ post.title }}</h1>

    <!-- The body is constrained, not the page, so the h1 keeps its position. -->
    <div class="max-w-3xl">
      <p class="mt-4 border-b border-line pb-8 text-sm text-fg-subtle">
        {{ formatDate(post.date) }}
        <span v-if="post.author"><span aria-hidden="true">·</span> {{ post.author }}</span>
      </p>

      <article :class="[prose, 'mt-8']">
        <ContentRenderer :value="post" />
      </article>
    </div>
  </main>
</template>

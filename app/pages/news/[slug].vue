<script setup lang="ts">
// Render a single news post matched by its route path.
const route = useRoute()

const { data: post } = await useAsyncData(`news-${route.path}`, () =>
  queryCollection('news').path(route.path).first(),
)

// Unknown slug → 404.
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
</script>

<template>
  <main v-if="post" class="post">
    <NuxtLink to="/news" class="back">← All news</NuxtLink>
    <h1>{{ post.title }}</h1>
    <p class="date">
      {{ formatDate(post.date) }}
      <span v-if="post.author">· {{ post.author }}</span>
    </p>
    <article class="body">
      <ContentRenderer :value="post" />
    </article>
  </main>
</template>

<style scoped>
.post {
  max-width: 720px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 1rem;
}

.back {
  display: inline-block;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  margin-bottom: 1.5rem;
  transition: color 0.15s ease;
}

.back:hover {
  color: var(--gold);
}

h1 {
  margin: 0 0 0.4rem;
  line-height: 1.15;
}

.date {
  color: var(--text-dim);
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding-bottom: 1.5rem;
  margin-bottom: 1.75rem;
  border-bottom: 1px solid var(--border);
}

.body {
  color: var(--text-secondary);
  font-size: 1.05rem;
}

.body :deep(p) {
  margin-bottom: 1.1rem;
  line-height: 1.8;
}

.body :deep(a) {
  color: var(--gold);
  text-underline-offset: 2px;
}

.body :deep(h2) {
  color: var(--gold);
  margin: 2rem 0 0.6rem;
}

.body :deep(ul),
.body :deep(ol) {
  margin: 0 0 1.1rem 1.25rem;
  line-height: 1.8;
}

.body :deep(blockquote) {
  border-left: 3px solid var(--gold-deep);
  padding-left: 1rem;
  margin: 0 0 1.1rem;
  color: var(--text-muted);
  font-style: italic;
}
</style>

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
  max-width: 780px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.back {
  color: #888;
  text-decoration: none;
}

.back:hover {
  color: #c8a96e;
}

h1 {
  margin: 1rem 0 0.25rem;
}

.date {
  color: #777;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.body :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.7;
}

.body :deep(a) {
  color: #c8a96e;
}

.body :deep(h2) {
  color: #c8a96e;
  margin: 1.5rem 0 0.5rem;
}
</style>

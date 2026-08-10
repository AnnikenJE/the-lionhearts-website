<script setup lang="ts">
// List all news posts, newest first, from the @nuxt/content `news` collection.
const { data: posts } = await useAsyncData('news-list', () =>
  queryCollection('news').order('date', 'DESC').all(),
)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
</script>

<template>
  <main class="news">
    <header class="page-head">
      <p class="server">The Lionhearts</p>
      <h1>News</h1>
    </header>

    <p v-if="!posts || posts.length === 0" class="empty">
      No posts yet — check back soon.
    </p>

    <ul v-else class="post-list">
      <li v-for="post in posts" :key="post.path">
        <NuxtLink :to="post.path" class="post">
          <p class="date">{{ formatDate(post.date) }}</p>
          <h2 class="title">{{ post.title }}</h2>
          <p v-if="post.excerpt" class="excerpt">{{ post.excerpt }}</p>
          <span class="read">Read more →</span>
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.news {
  max-width: 780px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 1rem;
}

.page-head {
  text-align: center;
  margin-bottom: 2.5rem;
}

.page-head .server {
  margin-bottom: 0.6rem;
}

.empty {
  text-align: center;
  color: var(--text-muted);
}

.post-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post {
  display: block;
  padding: 1.25rem 1.4rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-decoration: none;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;
}

.post:hover {
  background: var(--surface-hover);
  border-color: var(--gold-deep);
}

.date {
  color: var(--text-dim);
  font-size: 0.78rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.title {
  color: var(--gold);
  font-size: 1.35rem;
  margin: 0.3rem 0 0.5rem;
}

.excerpt {
  color: var(--text-secondary);
  line-height: 1.65;
  margin-bottom: 0.75rem;
}

.read {
  color: var(--text-muted);
  font-size: 0.85rem;
  transition: color 0.16s ease;
}

.post:hover .read {
  color: var(--gold);
}
</style>

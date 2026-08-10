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
    <h1>News</h1>

    <p v-if="!posts || posts.length === 0" class="empty">No posts yet.</p>

    <ul v-else class="post-list">
      <li v-for="post in posts" :key="post.path" class="post">
        <NuxtLink :to="post.path" class="title">{{ post.title }}</NuxtLink>
        <p class="date">{{ formatDate(post.date) }}</p>
        <p v-if="post.excerpt" class="excerpt">{{ post.excerpt }}</p>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.news {
  max-width: 780px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.empty {
  text-align: center;
  color: #777;
}

.post-list {
  list-style: none;
}

.post {
  padding: 1.25rem 0;
  border-bottom: 1px solid #222;
}

.title {
  color: #c8a96e;
  text-decoration: none;
  font-size: 1.3rem;
}

.title:hover {
  text-decoration: underline;
}

.date {
  color: #777;
  font-size: 0.8rem;
  margin: 0.2rem 0 0.4rem;
}

.excerpt {
  color: #aaa;
}
</style>

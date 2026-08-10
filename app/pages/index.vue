<script setup lang="ts">
// Landing page: guild pitch, raid schedule, latest news, links, roster CTA.
const { data: latest } = await useAsyncData('news-latest', () =>
  queryCollection('news').order('date', 'DESC').limit(3).all(),
)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
</script>

<template>
  <main class="home">
    <section class="hero">
      <h1>The Lionhearts</h1>
      <p class="server">Darkmoon Faire — EU</p>
      <!-- TODO(maintainer): replace with the real guild pitch -->
      <p class="pitch">
        A close-knit World of Warcraft guild raiding on Darkmoon Faire.
        We value good people, steady progress, and a laugh on voice.
      </p>
      <NuxtLink to="/roster" class="cta">View the roster →</NuxtLink>
    </section>

    <section class="block">
      <h2>Raid nights</h2>
      <RaidSchedule />
    </section>

    <section class="block">
      <h2>Latest news</h2>
      <p v-if="!latest || latest.length === 0" class="empty">No posts yet.</p>
      <ul v-else class="news-teasers">
        <li v-for="post in latest" :key="post.path">
          <NuxtLink :to="post.path" class="news-title">{{ post.title }}</NuxtLink>
          <span class="news-date">{{ formatDate(post.date) }}</span>
        </li>
      </ul>
      <NuxtLink to="/news" class="more">All news →</NuxtLink>
    </section>

    <section class="block">
      <h2>Links</h2>
      <LinkGrid />
    </section>
  </main>
</template>

<style scoped>
.home {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

.hero {
  text-align: center;
  padding: 2rem 0 3rem;
}

.pitch {
  max-width: 620px;
  margin: 1rem auto 1.5rem;
  color: #cfc7b6;
  line-height: 1.7;
}

.cta {
  display: inline-block;
  color: #c8a96e;
  text-decoration: none;
  letter-spacing: 0.05em;
}

.cta:hover {
  text-decoration: underline;
}

.block {
  margin-top: 2.5rem;
}

.block h2 {
  color: #c8a96e;
  border-bottom: 1px solid #222;
  padding-bottom: 0.4rem;
  margin-bottom: 1rem;
}

.news-teasers {
  list-style: none;
  margin-bottom: 0.75rem;
}

.news-teasers li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.4rem 0;
}

.news-title {
  color: #e8e0d0;
  text-decoration: none;
}

.news-title:hover {
  color: #c8a96e;
}

.news-date {
  color: #777;
  font-size: 0.8rem;
  white-space: nowrap;
}

.empty {
  color: #777;
}

.more {
  color: #888;
  text-decoration: none;
}

.more:hover {
  color: #c8a96e;
}
</style>

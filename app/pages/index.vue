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
      <p class="server">Darkmoon Faire — EU</p>
      <h1>The Lionhearts</h1>

      <div class="divider" aria-hidden="true">
        <span class="line" />
        <span class="gem">◆</span>
        <span class="line" />
      </div>

      <!-- TODO(maintainer): replace with the real guild pitch -->
      <p class="pitch">
        A close-knit World of Warcraft guild raiding on Darkmoon Faire.
        We value good people, steady progress, and a laugh on voice.
      </p>

      <NuxtLink to="/roster" class="btn">
        View the roster
        <span class="arrow" aria-hidden="true">→</span>
      </NuxtLink>
    </section>

    <section class="block">
      <h2 class="section-title">Raid nights</h2>
      <RaidSchedule />
    </section>

    <section class="block">
      <div class="section-head">
        <h2 class="section-title">Latest news</h2>
        <NuxtLink to="/news" class="more">All news →</NuxtLink>
      </div>
      <p v-if="!latest || latest.length === 0" class="empty">
        No posts yet — check back soon.
      </p>
      <ul v-else class="news-teasers">
        <li v-for="post in latest" :key="post.path" class="news-row">
          <NuxtLink :to="post.path" class="news-link">
            <span class="news-title">{{ post.title }}</span>
            <time class="news-date">{{ formatDate(post.date) }}</time>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.home {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 2rem 1.5rem 1rem;
}

/* Hero */
.hero {
  text-align: center;
  padding: 3rem 0 2.5rem;
}

.hero .server {
  margin-bottom: 1rem;
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  max-width: 320px;
  margin: 1.4rem auto;
}

.divider .line {
  height: 1px;
  flex: 1;
  background: linear-gradient(
    to var(--dir, right),
    transparent,
    var(--border-strong)
  );
}

.divider .line:first-child {
  --dir: left;
}

.divider .gem {
  color: var(--gold-deep);
  font-size: 0.7rem;
}

.pitch {
  max-width: 40rem;
  margin: 0 auto 2rem;
  color: var(--text-secondary);
  font-size: 1.08rem;
  line-height: 1.75;
}

/* Gold "button" — the primary call to action. */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.4rem;
  border: 1px solid var(--gold-deep);
  border-radius: var(--radius-sm);
  color: var(--gold);
  text-decoration: none;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.85rem;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.btn:hover {
  background: var(--gold);
  border-color: var(--gold);
  color: #191510;
}

.btn .arrow {
  transition: transform 0.18s ease;
}

.btn:hover .arrow {
  transform: translateX(3px);
}

/* Sections */
.block {
  margin-top: 3rem;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Section heading with a small heraldic gem marker + rule beneath. */
.section-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--gold);
  font-size: 1.25rem;
  letter-spacing: 0.05em;
  padding-bottom: 0.5rem;
  margin-bottom: 1.1rem;
  border-bottom: 1px solid var(--border);
}

.section-title::before {
  content: "◆";
  color: var(--gold-deep);
  font-size: 0.6rem;
}

.section-head .section-title {
  flex: 1;
}

/* News teasers */
.news-teasers {
  list-style: none;
}

.news-row + .news-row {
  border-top: 1px solid var(--border);
}

.news-link {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0.6rem;
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition: background-color 0.14s ease;
}

.news-link:hover {
  background: var(--surface);
}

.news-title {
  color: var(--text);
  transition: color 0.14s ease;
}

.news-link:hover .news-title {
  color: var(--gold);
}

.news-date {
  color: var(--text-dim);
  font-size: 0.8rem;
  white-space: nowrap;
  letter-spacing: 0.04em;
}

.empty {
  color: var(--text-muted);
  padding: 0.5rem 0;
}

.more {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.more:hover {
  color: var(--gold);
}
</style>

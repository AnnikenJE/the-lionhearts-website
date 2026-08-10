# Member Hub & Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder home page with a real landing page and add a small member hub (markdown news, raid schedule, links), all in the existing theme.

**Architecture:** Nuxt 4 + TypeScript. A shared layout provides header nav + footer. News is authored as markdown via `@nuxt/content`; raid schedule and links are typed TS data modules rendered by small components. The landing page composes these. The existing roster page and its cached Raider.IO server route are untouched.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, `@nuxt/content` (v3), existing dark/parchment CSS theme.

## Global Constraints

- Node `>=24.0.0` (per `package.json` engines; `.nvmrc` pins Node 24).
- Component-specific CSS lives in each component's `<style scoped>`; only genuinely global rules go in `app/assets/css/main.css`.
- Types are co-located with the code that owns them; export when shared.
- External APIs are called only from `server/api/` routes. News/schedule/links are local — no server route.
- No test runner is configured; do not add one. Verify with `npm run lint`, `npm run build`, and driving `npm run dev`.
- Theme values: background `#0f0f0f`, text `#e8e0d0`, accent `#c8a96e`, muted `#888`/`#555`, font `Georgia, serif`.
- Commit messages follow Conventional Commits (`feat:`, `chore:`, `docs:` …).
- Work happens on branch `feat/member-hub-and-landing`. Do not push to `main`.

---

## File Structure

- Modify `package.json` — add `@nuxt/content` dependency.
- Modify `nuxt.config.ts` — register `@nuxt/content` module.
- Create `content.config.ts` — define the `news` content collection + schema.
- Create `content/news/2026-08-10-welcome.md` — example post.
- Create `app/layouts/default.vue` — header nav + footer shell.
- Modify `app/app.vue` — wrap page in `<NuxtLayout>`.
- Create `app/data/schedule.ts` — typed raid-schedule data.
- Create `app/components/RaidSchedule.vue` — renders the schedule.
- Create `app/data/links.ts` — typed links data.
- Create `app/components/LinkGrid.vue` — renders the links.
- Create `app/pages/news/index.vue` — news list.
- Create `app/pages/news/[slug].vue` — single post.
- Rewrite `app/pages/index.vue` — landing page composing the above.
- Modify `CLAUDE.md` — document the new content/data/layout architecture.

---

### Task 1: Install and configure `@nuxt/content` with a news collection

**Files:**
- Modify: `package.json` (dependencies)
- Modify: `nuxt.config.ts`
- Create: `content.config.ts`
- Create: `content/news/2026-08-10-welcome.md`

**Interfaces:**
- Produces: a queryable `news` collection with schema `{ title: string; date: string; excerpt?: string; author?: string }`, plus rendered body. Queried elsewhere via `queryCollection('news')`. File `content/news/<slug>.md` maps to route path `/news/<slug>`.

- [ ] **Step 1: Install the module**

Run:
```bash
npm install @nuxt/content
```
Expected: `@nuxt/content` added under `dependencies` in `package.json`.

- [ ] **Step 2: Register the module**

Modify `nuxt.config.ts` so `modules` includes content:
```ts
export default defineNuxtConfig({
  compatibilityDate: '2026-06-14',
  modules: ['@nuxt/eslint', '@nuxt/content'],
  css: ['~/assets/css/main.css'],
})
```

- [ ] **Step 3: Define the collection schema**

Create `content.config.ts`:
```ts
import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    news: defineCollection({
      type: 'page',
      source: 'news/*.md',
      schema: z.object({
        title: z.string(),
        date: z.string(), // ISO date, e.g. "2026-08-10"
        excerpt: z.string().optional(),
        author: z.string().optional(),
      }),
    }),
  },
})
```

- [ ] **Step 4: Add an example post**

Create `content/news/2026-08-10-welcome.md`:
```md
---
title: Welcome to the new site
date: 2026-08-10
excerpt: The Lionhearts have a real website now — news, schedule, and links all live here.
author: Officers
---

Welcome, Lionhearts! This is where we'll post raid news, roster changes, and
guild announcements from now on.

Replace this post with your own once you're happy with how it looks.
```

- [ ] **Step 5: Verify build**

Run:
```bash
npm run build
```
Expected: build succeeds; no schema/module errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json nuxt.config.ts content.config.ts content/news/2026-08-10-welcome.md
git commit -m "feat: add @nuxt/content with a news collection"
```

---

### Task 2: Shared layout with header nav and footer

**Files:**
- Create: `app/layouts/default.vue`
- Modify: `app/app.vue`

**Interfaces:**
- Produces: a default layout wrapping every page with a header (`Home · Roster · News`) and a footer. Pages render inside `<slot />`. The footer will later host `<LinkGrid>` (Task 4); for now it holds a static copyright line, updated in Task 4.

- [ ] **Step 1: Create the layout**

Create `app/layouts/default.vue`:
```vue
<template>
  <div class="site">
    <header class="site-header">
      <NuxtLink to="/" class="brand">The Lionhearts</NuxtLink>
      <nav class="nav">
        <NuxtLink to="/">Home</NuxtLink>
        <NuxtLink to="/roster">Roster</NuxtLink>
        <NuxtLink to="/news">News</NuxtLink>
      </nav>
    </header>

    <slot />

    <footer class="site-footer">
      <p>The Lionhearts — Darkmoon Faire (EU)</p>
    </footer>
  </div>
</template>

<style scoped>
.site {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #222;
  flex-wrap: wrap;
}

.brand {
  color: #c8a96e;
  text-decoration: none;
  letter-spacing: 0.08em;
  font-size: 1.1rem;
}

.nav {
  display: flex;
  gap: 1.25rem;
}

.nav a {
  color: #888;
  text-decoration: none;
  letter-spacing: 0.05em;
}

.nav a:hover,
.nav a.router-link-active {
  color: #c8a96e;
}

.site > :slotted(*) {
  flex: 1;
}

.site-footer {
  border-top: 1px solid #222;
  padding: 1.5rem;
  text-align: center;
  color: #555;
  font-size: 0.85rem;
}
</style>
```

- [ ] **Step 2: Wrap pages in the layout**

Replace `app/app.vue` contents with:
```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- [ ] **Step 3: Adjust the home hero for the layout**

The landing hero previously used `min-height: 100vh` centering on `<main>`. With a header/footer now present, full-viewport centering would overflow. This is resolved when `index.vue` is rewritten in Task 7 — no change needed here, but be aware the current `index.vue` will look slightly tall until Task 7.

- [ ] **Step 4: Verify nav in dev**

Run:
```bash
npm run dev
```
Observe: every page (`/`, `/roster`) shows the header with Home/Roster/News links and a footer; the active link is accented; clicking Roster/Home navigates. `/news` will 404 until Task 5 — that's expected.

- [ ] **Step 5: Lint**

Run:
```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/layouts/default.vue app/app.vue
git commit -m "feat: add shared layout with header nav and footer"
```

---

### Task 3: Raid schedule data + component

**Files:**
- Create: `app/data/schedule.ts`
- Create: `app/components/RaidSchedule.vue`

**Interfaces:**
- Produces: `RAID_SCHEDULE: RaidNight[]` where `RaidNight = { day: string; start: string; end: string; timezone: string; note?: string }`, exported from `app/data/schedule.ts`. `<RaidSchedule />` (auto-imported) renders it and takes no props.

- [ ] **Step 1: Create the data module**

Create `app/data/schedule.ts`:
```ts
// Raid nights. Edit these to match the guild's actual schedule.
export interface RaidNight {
  day: string
  start: string
  end: string
  timezone: string
  note?: string
}

export const RAID_SCHEDULE: RaidNight[] = [
  { day: 'Wednesday', start: '20:00', end: '23:00', timezone: 'ST' },
  { day: 'Sunday', start: '20:00', end: '23:00', timezone: 'ST', note: 'Progression' },
]
```

- [ ] **Step 2: Create the component**

Create `app/components/RaidSchedule.vue`:
```vue
<script setup lang="ts">
import { RAID_SCHEDULE } from '~/data/schedule'
</script>

<template>
  <ul class="schedule">
    <li v-for="night in RAID_SCHEDULE" :key="night.day" class="night">
      <span class="day">{{ night.day }}</span>
      <span class="time">{{ night.start }}–{{ night.end }} {{ night.timezone }}</span>
      <span v-if="night.note" class="note">{{ night.note }}</span>
    </li>
  </ul>
</template>

<style scoped>
.schedule {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.night {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 1rem;
  border: 1px solid #222;
  border-radius: 8px;
  min-width: 160px;
}

.day {
  color: #c8a96e;
  letter-spacing: 0.05em;
}

.time {
  color: #e8e0d0;
}

.note {
  color: #777;
  font-size: 0.8rem;
  margin-top: 0.2rem;
}
</style>
```

- [ ] **Step 3: Lint**

Run:
```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/data/schedule.ts app/components/RaidSchedule.vue
git commit -m "feat: add raid schedule data and component"
```

---

### Task 4: Links data + LinkGrid component, wired into the footer

**Files:**
- Create: `app/data/links.ts`
- Create: `app/components/LinkGrid.vue`
- Modify: `app/layouts/default.vue` (footer uses `<LinkGrid>`)

**Interfaces:**
- Produces: `GUILD_LINKS: GuildLink[]` where `GuildLink = { label: string; url: string; description?: string }`, exported from `app/data/links.ts`. `<LinkGrid />` (auto-imported) renders it and takes no props.

- [ ] **Step 1: Create the data module**

Create `app/data/links.ts`:
```ts
// Useful links for members. Edit these — the URLs below are placeholders.
export interface GuildLink {
  label: string
  url: string
  description?: string
}

export const GUILD_LINKS: GuildLink[] = [
  { label: 'Discord', url: 'https://discord.gg/REPLACE_ME', description: 'Guild chat & voice' },
  { label: 'Raider.IO', url: 'https://raider.io/guilds/eu/darkmoon-faire/The%20Lionhearts', description: 'Progression & M+' },
  { label: 'Warcraft Logs', url: 'https://www.warcraftlogs.com/', description: 'Raid parses' },
]
```

- [ ] **Step 2: Create the component**

Create `app/components/LinkGrid.vue`:
```vue
<script setup lang="ts">
import { GUILD_LINKS } from '~/data/links'
</script>

<template>
  <ul class="links">
    <li v-for="link in GUILD_LINKS" :key="link.url">
      <a :href="link.url" target="_blank" rel="noopener" class="link">
        <span class="label">{{ link.label }}</span>
        <span v-if="link.description" class="desc">{{ link.description }}</span>
      </a>
    </li>
  </ul>
</template>

<style scoped>
.links {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  padding: 0.6rem 1rem;
  border: 1px solid #222;
  border-radius: 8px;
}

.label {
  color: #c8a96e;
  letter-spacing: 0.05em;
}

.desc {
  color: #777;
  font-size: 0.8rem;
}

.link:hover {
  border-color: #c8a96e;
}
</style>
```

- [ ] **Step 3: Use LinkGrid in the footer**

In `app/layouts/default.vue`, replace the footer block:
```vue
    <footer class="site-footer">
      <p>The Lionhearts — Darkmoon Faire (EU)</p>
    </footer>
```
with:
```vue
    <footer class="site-footer">
      <LinkGrid />
      <p class="colophon">The Lionhearts — Darkmoon Faire (EU)</p>
    </footer>
```
And add to the layout's `<style scoped>`:
```css
.colophon {
  margin-top: 1.25rem;
}
```

- [ ] **Step 4: Verify in dev + lint**

Run:
```bash
npm run dev
```
Observe: the footer on every page shows the three link cards; each opens in a new tab.
Run:
```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/data/links.ts app/components/LinkGrid.vue app/layouts/default.vue
git commit -m "feat: add links data, LinkGrid component, and footer links"
```

---

### Task 5: News list page (`/news`)

**Files:**
- Create: `app/pages/news/index.vue`

**Interfaces:**
- Consumes: the `news` collection from Task 1 via `queryCollection('news')`.
- Produces: route `/news` listing posts newest-first. Each item links to `/news/<slug>` (the post's `path`).

- [ ] **Step 1: Create the list page**

Create `app/pages/news/index.vue`:
```vue
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
```

- [ ] **Step 2: Verify in dev**

Run:
```bash
npm run dev
```
Observe: `/news` shows the "Welcome to the new site" post with its date and excerpt; the title links to `/news/2026-08-10-welcome` (target page arrives in Task 6).

- [ ] **Step 3: Lint**

Run:
```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/pages/news/index.vue
git commit -m "feat: add news list page"
```

---

### Task 6: Single news post page (`/news/[slug]`)

**Files:**
- Create: `app/pages/news/[slug].vue`

**Interfaces:**
- Consumes: the `news` collection via `queryCollection('news').path(route.path).first()`, and `<ContentRenderer>` (auto-provided by `@nuxt/content`).
- Produces: route `/news/<slug>` rendering one post; unknown slug triggers a 404.

- [ ] **Step 1: Create the post page**

Create `app/pages/news/[slug].vue`:
```vue
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
```

- [ ] **Step 2: Verify in dev**

Run:
```bash
npm run dev
```
Observe: clicking the post on `/news` opens `/news/2026-08-10-welcome` with the title, date, author, and rendered body. Visiting a made-up URL like `/news/does-not-exist` shows a 404.

- [ ] **Step 3: Lint**

Run:
```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/pages/news/[slug].vue
git commit -m "feat: add single news post page"
```

---

### Task 7: Rewrite the landing page

**Files:**
- Modify: `app/pages/index.vue`

**Interfaces:**
- Consumes: `<RaidSchedule>` (Task 3), `<LinkGrid>` (Task 4), the `news` collection (Task 1). All auto-imported.
- Produces: the composed landing page at `/`.

- [ ] **Step 1: Rewrite the page**

Replace `app/pages/index.vue` contents with:
```vue
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
```

- [ ] **Step 2: Remove now-unused global hero rules**

The old full-viewport hero centering is gone. In `app/assets/css/main.css`, the `.roster-link` rule (used only by the old home page) is now unused — remove it. Leave `.server` and `.status` (still used by roster/other pages). Confirm with a search before deleting:
```bash
grep -rn "roster-link" app/
```
If the only match is the CSS rule, delete the `.roster-link` and `.roster-link:hover` blocks from `main.css`.

- [ ] **Step 3: Verify in dev**

Run:
```bash
npm run dev
```
Observe on `/`: hero with pitch + roster CTA; raid nights render; latest-news teasers link through; links grid renders; header/footer present; no vertical overflow.

- [ ] **Step 4: Build + lint**

Run:
```bash
npm run build
npm run lint
```
Expected: both succeed, no errors.

- [ ] **Step 5: Commit**

```bash
git add app/pages/index.vue app/assets/css/main.css
git commit -m "feat: rebuild landing page as guild hub"
```

---

### Task 8: Update project docs

**Files:**
- Modify: `CLAUDE.md`

**Interfaces:** none (documentation only).

- [ ] **Step 1: Document the new architecture**

In `CLAUDE.md`, under the Architecture section's file list, add entries for the new pieces and a short note on the content/data split. Add these lines to the bullet list (keep the existing entries):
```md
- `app/layouts/default.vue` — shared shell: header nav (Home · Roster · News) + footer links
- `app/pages/news/index.vue`, `app/pages/news/[slug].vue` — markdown-backed news list + post
- `content/news/*.md` — news posts (authored as markdown, rendered by @nuxt/content)
- `content.config.ts` — @nuxt/content collection schema for news
- `app/data/schedule.ts`, `app/data/links.ts` — typed static data (raid schedule, links)
- `app/components/RaidSchedule.vue`, `app/components/LinkGrid.vue` — render the static data
```
And add a sentence to the "Conventions" or "Data flow" area:
```md
- **Local content vs external APIs:** news (markdown via @nuxt/content), the raid schedule, and the links hub are local content edited in the repo — no server route. Only external APIs (e.g. Raider.IO for the roster) go through `server/api/`.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document news, data modules, and shared layout"
```

---

## Self-Review

**Spec coverage:**
- Shared layout/nav → Task 2. ✓
- Landing page (hero, schedule strip, latest news, quick links, roster CTA) → Task 7 (consumes Tasks 1/3/4). ✓
- News via @nuxt/content (list, post, 404, empty state) → Tasks 1, 5, 6. ✓
- Raid schedule data file + component → Task 3. ✓
- Links hub data file + component → Task 4. ✓
- Non-goals (progress display, recruitment, CMS, test framework) → none added. ✓
- Placeholder content (pitch, times, links, example post) → scaffolded in Tasks 1/3/4/7 with TODO/placeholder markers. ✓
- Verification via lint/build/dev → every task. ✓
- Docs → Task 8. ✓

**Placeholder scan:** The only "TODO" is the intentional maintainer-facing pitch marker in Task 7; all code steps contain real content. No "implement later"/"similar to Task N" placeholders.

**Type consistency:** `RaidNight`/`RAID_SCHEDULE`, `GuildLink`/`GUILD_LINKS` are defined and consumed with identical names. `queryCollection('news')` and post fields (`title`, `date`, `excerpt`, `author`, `path`) match the schema in Task 1 across Tasks 5, 6, 7. `formatDate` is defined independently in each page that uses it (no shared import assumed).

> **Note on @nuxt/content API:** steps use the v3 API (`defineContentConfig`, `queryCollection`, `<ContentRenderer>`). If `npm install` pulls a different major, verify method names against the installed version's docs before implementing Task 1 — this is the one external-API surface in the plan.

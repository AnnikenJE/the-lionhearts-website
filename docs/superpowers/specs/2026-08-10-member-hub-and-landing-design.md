# The Lionhearts — Member Hub & Real Landing Page

**Date:** 2026-08-10
**Status:** Approved design, ready for implementation planning

## Goal

Turn the site from a placeholder into (1) a polished public face for the guild
and (2) a small hub for current members. Content is edited by the maintainer
directly in the repo (markdown/data files) and shipped via `git push` — no CMS,
no auth, no backend.

## Scope

Four deliverables plus a shared site shell:

1. Shared layout with header nav and footer.
2. Real landing page (`/`) replacing "under construction".
3. News/announcements via `@nuxt/content` (markdown files).
4. Raid schedule from a typed data file.
5. Useful-links hub from a typed data file.

The existing roster page (`/roster`) and its cached `/api/roster` route are kept
as-is.

## Non-goals (deliberately deferred)

- Live raid-progression display (Raider.IO progress / Warcraft Logs parses).
- Recruitment / apply flow.
- Any CMS, admin UI, authentication, or database.
- A dedicated test framework (none is configured today; see Verification).

These are easy to add later on top of this structure.

## Architecture

Nuxt 4 + TypeScript, existing dark/parchment theme (Georgia serif, `#0f0f0f`
background, `#c8a96e` accent). One new dependency: `@nuxt/content` (first-party
Nuxt module) for markdown news.

### 1. Site shell & navigation

- `app/layouts/default.vue` — slim header (**Home · Roster · News**) and a footer
  that reuses the links hub. All pages render inside it.
- `app/app.vue` — reduced to `<NuxtLayout><NuxtPage /></NuxtLayout>`.
- Shared header/footer styles live in the layout's scoped block; only genuinely
  app-wide rules stay in `main.css`.

### 2. Landing page (`/`)

Replaces the "under construction" hero. Composed of:

- **Hero** — guild name, "Darkmoon Faire — EU", a one/two-sentence guild pitch.
- **Raid schedule strip** — rendered from `RaidSchedule.vue` (section 4).
- **Latest news** — the 3 most recent posts (title, date, excerpt), linking to
  `/news`. Queried from `@nuxt/content`.
- **Quick links** — rendered from `LinkGrid.vue` (section 5).
- **Roster CTA** — keeps the existing link to `/roster`.

### 3. News — `@nuxt/content`

- Posts: `content/news/*.md`, frontmatter `title` (string), `date` (ISO string),
  optional `excerpt` (string) and `author` (string).
- `app/pages/news/index.vue` — lists all posts, newest-first, showing title,
  date, excerpt.
- `app/pages/news/[slug].vue` — renders a single post body. Unknown slug → 404.
- Empty `content/news/` → friendly "No posts yet" message on the list page.
- Register `@nuxt/content` in `nuxt.config.ts` `modules`; add to `package.json`.

### 4. Raid schedule

- `app/data/schedule.ts` — exported typed array, each entry
  `{ day: string; start: string; end: string; timezone: string; note?: string }`.
  A handful of records; a TS array type-checks them for free (no markdown).
- `app/components/RaidSchedule.vue` — renders the array; used on the landing page.

### 5. Links hub

- `app/data/links.ts` — exported typed array,
  `{ label: string; url: string; description?: string }`.
- `app/components/LinkGrid.vue` — renders the array; used on the landing page and
  in the layout footer.

## Data flow

- News: local markdown → `@nuxt/content` query in the page components (SSR). No
  server route needed (content is local, not an external API).
- Schedule & links: static typed modules imported directly by components.
- Roster: unchanged — still fetched from Raider.IO via the cached server route.

The existing convention ("external APIs are called from server routes only")
still holds: news/schedule/links are local, so they need no server route.

## Error & empty handling

- News list empty → "No posts yet" message.
- News post not found → Nuxt 404.
- Schedule & links are static and always present.
- Roster keeps its existing loading/error states.

## Placeholder content to fill in during implementation

Scaffolded with obvious placeholders for the maintainer to replace:

- Guild pitch text (hero).
- Actual raid nights/times/timezone (`schedule.ts`).
- Initial links (`links.ts`) — e.g. Discord, Raider.IO, Warcraft Logs.
- One or two example news posts.

## Conventions

- Component-specific CSS in each component's `<style scoped>`; only shared theme
  in `main.css`.
- Types co-located with the code that owns them; export when shared.
- Keep files focused and small.

## Verification

No test runner is configured. Verify via:

- `npm run lint`
- `npm run build`
- Driving the pages in `npm run dev`: landing renders all sections, `/news` lists
  posts, a post renders, an unknown slug 404s, nav/footer work, roster still loads.

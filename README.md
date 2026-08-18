# The Lionhearts — Guild Website

Personal project: the website for **The Lionhearts**, a World of Warcraft guild on **Darkmoon Faire (EU)**. Built while exploring AI-assisted development with Claude Code.

> **Work in progress** — early stage, more features planned.

Live at **https://thelionhearts.eu/**.

## Stack

- [Nuxt 4](https://nuxt.com) (Vue 3 + Vite)
- TypeScript
- Nitro server routes for cached data fetching

## Features

- **Landing page** — guild intro hero.
- **Roster** — full guild roster pulled live from the Raider.IO API, grouped by in-game rank with collapsible sections, member counts, and official WoW class colours. Members link to their Raider.IO profiles.

## Scripts

```bash
npm run dev       # start dev server (opens browser automatically)
npm run build     # production build
npm run preview   # preview the production build locally
npm run generate  # static site generation
npm run lint      # run ESLint
```

## Project structure

```
app/
  app.vue              # root layout
  pages/
    index.vue          # landing page
    roster.vue         # guild roster
  assets/css/
    main.css           # global styles (reset + theme)
server/
  api/
    roster.get.ts      # cached Raider.IO roster endpoint
public/                # static assets
nuxt.config.ts         # Nuxt config (global CSS registered here)
```

The roster is fetched server-side and cached, so visitor traffic does not hammer the Raider.IO API. Rank names and class colours are configured in `app/pages/roster.vue`.

## Useful links

- [Raider.IO](https://raider.io) — guild progression, mythic+ rankings (public API)
- [Warcraft Logs](https://www.warcraftlogs.com) — raid log analysis (public GraphQL API)
- [WoWProgress](https://www.wowprogress.com) — progression tracking
- [WoW Armory](https://worldofwarcraft.blizzard.com/en-gb/) — official character/guild lookup
- [WoW Head](https://www.wowhead.com) — item database, guides

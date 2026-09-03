# The Lionhearts Guild Website

Personal project: the website for **The Lionhearts**, a World of Warcraft guild on **Darkmoon Faire (EU)**. Built while exploring AI-assisted development with Claude Code.

> **Work in progress.** Early stage, more features planned.

Live at **https://thelionhearts.eu/**.

## Stack

- [Nuxt 4](https://nuxt.com) (Vue 3 + Vite)
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) via the Vite plugin, with the palette declared as `@theme` tokens
- [Headless UI](https://headlessui.com) for the roster filter menus
- [@nuxt/content](https://content.nuxt.com) for news posts, styled with `@tailwindcss/typography`
- Nitro server routes for cached data fetching

## Pages

- **Landing page.** Hero, raid nights, links into the other pages, and the latest news.
- **About.** What the guild runs, the raid schedule, and who to contact.
- **Roster.** Pulled live from the Raider.IO API and grouped by in-game rank, with collapsible sections, search across name, class and spec, class and role filters, and official WoW class colours. Members link to their Raider.IO profiles.
- **Rules.** Guild and raid rules.
- **News.** Markdown posts from `content/news/`, currently switched off behind a flag (see below).

## Scripts

```bash
npm run dev       # start dev server (opens browser automatically)
npm run build     # production build
npm run preview   # preview the production build locally
npm run generate  # static site generation
npm run lint      # run ESLint
npm run test      # run the test suite once
npm run test:watch # re-run tests on change
```

## Project structure

```
app/
  app.vue                  # root component
  layouts/default.vue      # header nav + footer
  pages/
    index.vue              # landing page
    about.vue              # about the guild
    roster.vue             # guild roster
    rules.vue              # guild and raid rules
    news/index.vue         # news list
    news/[slug].vue        # a single post
  components/              # AppButton, AppBadge, SelectMenu, RaidSchedule, ...
  data/                    # raid schedule, links, the news flag
  utils/                   # shared helpers and control classes
  assets/css/main.css      # the whole theme: Tailwind import + @theme tokens
content/news/*.md          # news posts
server/api/roster.get.ts   # cached Raider.IO roster endpoint
server/utils/roster.ts     # the roster transform, kept testable
public/                    # static assets
nuxt.config.ts             # Nuxt config
```

## Notes

**Styling.** Everything is Tailwind utility classes. There are no `<style>` blocks anywhere in `app/`. Colours come from the tokens in `main.css`, so adding one means adding a token rather than writing a hex value into a component.

**Roster data.** Fetched server-side and cached for an hour, so visitor traffic does not hammer the Raider.IO API. Rank names and class colours are configured at the top of `app/pages/roster.vue`. Raider.IO returns rank `99` for characters it cannot match to a guild rank; those are filtered out in the server route.

**News.** `NEWS_ENABLED` in `app/data/news.ts` gates the whole section. While it is false the list page shows a coming-soon notice, post routes return 404, and nothing is queried, so unpublished drafts never reach the page payload. Flipping it to true is the whole launch.

**Crawlers.** `public/robots.txt` currently disallows everything while the site is still being built.

## Useful links

- [Raider.IO](https://raider.io): guild progression, mythic+ rankings (public API)
- [Warcraft Logs](https://www.warcraftlogs.com): raid log analysis (public GraphQL API)
- [WoWProgress](https://www.wowprogress.com): progression tracking
- [WoW Armory](https://worldofwarcraft.blizzard.com/en-gb/): official character/guild lookup
- [WoW Head](https://www.wowhead.com): item database, guides

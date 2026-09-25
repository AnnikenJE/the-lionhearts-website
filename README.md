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
- **Raids.** Recent raid nights from the Warcraft Logs API: bosses down and headcount per night, and a detail page per log with the boss list and who attended. Needs API credentials, see below.
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

**Raid data.** Fetched server-side from the Warcraft Logs v2 GraphQL API. The raid list and each log are cached and refreshed once an hour, so Warcraft Logs is asked at most once an hour per page however many people visit. A night being logged live therefore shows up to an hour behind. Two logs of the same night (two raiders logging) are shown as one, and logs with no boss pulls are left out.

**Crawlers.** `public/robots.txt` currently disallows everything while the site is still being built.

## Warcraft Logs setup

The raids pages need a Warcraft Logs API client. Without one, `/api/raids` and `/api/raids/<code>` return a 503 and the pages say the raids feed is not configured. Nothing else breaks, and CI builds without the credentials.

### 1. Create the client

1. Log in to Warcraft Logs and open the [client management page](https://www.warcraftlogs.com/api/clients/). Click **Create Client**.
2. **Name:** make it descriptive, for example `The Lionhearts guild website (thelionhearts.eu)`. The API terms let Warcraft Logs cancel a client whose owner or purpose cannot be determined.
3. **Redirect URL:** `https://thelionhearts.eu/`. The form requires one, but this site uses the client credentials flow, which never redirects, so the value is never used.
4. **Public Client:** leave it **unchecked**. A public client gets no secret and can only use the PKCE flow, which cannot reach `/api/v2/client`.
5. Copy the **Client ID** and **Client Secret**.

### 2. Local development

```bash
cp .env.example .env
```

Fill in `NUXT_WCL_CLIENT_ID` and `NUXT_WCL_CLIENT_SECRET` in `.env`, then restart `npm run dev`. `.env` is gitignored.

### 3. Production (Cloudflare)

In the Cloudflare dashboard, open the `thelionhearts` project, go to **Settings > Variables and Secrets**, and add both variables to the **Production** environment as type **Secret**. Variable changes take effect on the next deployment, so redeploy (or push) afterwards.

Set them **before** the raids pages reach `main`: a push to `main` deploys straight to production.

### Terms to keep in mind

The [RPGLogs API terms](https://www.archon.gg/wow/articles/help/rpg-logs-api-terms-of-service) apply to everything fetched from Warcraft Logs. The ones that matter for this site:

- **Credentials stay secret.** This repository is public, and the terms forbid embedding credentials in open source projects. Real values live only in `.env` and in Cloudflare.
- **Non-commercial.** Ads, subscriptions or selling data would need prior approval from RPGLogs (and are ruled out by the Blizzard terms anyway).
- **Only public reports.** The site uses `/api/v2/client`, which only sees public logs.
- **Attribution.** Every raid page links back to its log on Warcraft Logs, and the footer names Warcraft Logs as a data source. Do not present the site as partnered with or endorsed by RPGLogs.
- **Caching.** Keep cached copies within what the API allows. An hour is well inside what the quota docs recommend, see *Raid data* above.
- **Privacy.** The terms require a privacy policy that describes what the site collects. `/privacy` covers the Warcraft Logs data, so update it whenever a page starts showing something new from the API.

## Useful links

- [Raider.IO](https://raider.io): guild progression, mythic+ rankings (public API)
- [Warcraft Logs](https://www.warcraftlogs.com): raid log analysis (public GraphQL API)
- [WoWProgress](https://www.wowprogress.com): progression tracking
- [WoW Armory](https://worldofwarcraft.blizzard.com/en-gb/): official character/guild lookup
- [WoW Head](https://www.wowhead.com): item database, guides

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

Website for **The Lionhearts**, a World of Warcraft guild on **Darkmoon Faire (EU)**.

Relevant external services:
- [Blizzard API](https://develop.battle.net/): the official game data everything else is built from (OAuth, used for character renders so far)
- [Raider.IO](https://raider.io): guild progression and M+ rankings (has a public API)
- [Warcraft Logs](https://www.warcraftlogs.com): raid log analysis (has a public GraphQL API)
- [WoWProgress](https://www.wowprogress.com): progression tracking
- [WoW Armory](https://worldofwarcraft.blizzard.com/en-gb/): official Blizzard character/guild data
- [WoW Head](https://www.wowhead.com): item and spell database

## Deployment

**Pushes to `main` deploy directly to production at https://thelionhearts.eu/**. Do not push untested or broken changes.

## Branch workflow

One issue, one branch. Never commit to `main`: a push there deploys to production.

Starting work on an issue means creating its branch first, before any edit:

```bash
gh issue develop 7 --checkout    # branches off main and links the branch to issue 7
```

`gh issue develop` names the branch after the issue (`7-feat-seo-generate-sitemap-xml`) and
links the two, so the issue itself shows the branch and later the pull request. A branch made by
hand should follow the same shape, `<issue-number>-<short-slug>`.

Finishing:

```bash
gh pr create --fill              # the body must say Closes #<issue-number>
gh pr merge --squash             # GitHub deletes the remote branch on merge
```

`Closes #<number>` in the pull request body is what closes the issue on merge. Without it the
issue stays open after the work has shipped.

The repository has "Automatically delete head branches" enabled, so the remote branch is removed
when the pull request merges. The local branch is not, so clean it up afterwards:

```bash
git switch main && git pull && git branch -d <branch>
```

`remote.origin.prune` is set in this clone, so `git fetch` and `git pull` drop the stale
remote-tracking ref at the same time.

## Commands

```bash
npm run dev       # start dev server (opens browser automatically)
npm run build     # production build
npm run preview   # preview the production build locally
npm run generate  # static site generation
npm run lint      # run ESLint
npm run typecheck # run vue-tsc over the whole project
npm run test      # run the Vitest suite once
npm run test:watch # re-run tests on change
```

Every pull request, and every push to `main`, runs `.github/workflows/ci.yml`: lint, typecheck, tests, then build, in that order in one job. The build needs no Warcraft Logs or Blizzard credentials, since the routes return a clean 503 (or skip the Blizzard part) when they are missing.

A second CI job, `no env files or secrets`, guards against leaked credentials, since the repository is public and GitHub's push protection does not recognise a Warcraft Logs secret. It fails when git tracks a `.env` or `.env.*` file other than `.env.example` (`scripts/check-env-files.ts`), and runs gitleaks, pinned and checksum-verified, over the whole history. The same checks run locally as a pre-commit hook in `.githooks/pre-commit`; `npm install` points `core.hooksPath` there through the `prepare` script (`scripts/install-hooks.ts`). Locally gitleaks runs only if it is installed. Never bypass the hook with `--no-verify` to get a commit through: fix what it found.

Dependabot (`.github/dependabot.yml`) opens the dependency updates once a month: one pull request for npm and one for GitHub Actions, each with every update in it, majors included. A release must be seven days old before it is proposed. The monthly update only raises what `package.json` lists, so "Dependabot security updates" is on too, grouped: a new advisory brings one pull request with every security fix for that ecosystem, at once rather than monthly. `vue` is listed in `package.json` for the same reason, so the monthly update keeps it current instead of an old copy lingering beside Nuxt's. CI checks each pull request like any other, and the user merges them.

`npm run typecheck` and `npm run build` regenerate `.nuxt/`. A dev server running at the same time loses its worker and answers every request with `worker entry not found in ".nuxt/dev/index.mjs"`; restart it.

`npm run typecheck` is `nuxt typecheck`, which runs `vue-tsc`. It prints a "Resolve plugin path failed: vue-router/volar/sfc-route-blocks" stack trace on every run: vue-tsc 3 still looks for a Volar plugin that vue-router 5 no longer ships. It is noise, not a failure. Trust the exit code.

Tests run on Vitest, configured in `vitest.config.ts` through `defineVitestConfig` from `@nuxt/test-utils`. Specs live in `test/` and default to the plain `node` environment, because everything covered so far is a pure module. A test that needs a Nuxt runtime opts in per file with `// @vitest-environment nuxt`.

## Architecture

Nuxt 4 + TypeScript (Vue 3 + Vite under the hood), using the Nuxt 4 `app/` source directory. Each half has its own CLAUDE.md, which loads when you work in that folder:

- `app/CLAUDE.md`: pages, components, composables, styles, the page shell
- `server/CLAUDE.md`: API routes, the Blizzard, Raider.IO and Warcraft Logs clients, caching, environment variables

The rest of the root:

- `nuxt.config.ts`: Nuxt config, the server-only `runtimeConfig` secrets, global CSS, and `routeRules` (API cache headers, the `/rules` redirect)
- `content/news/*.md`: news posts (authored as markdown, rendered by @nuxt/content); `content.config.ts` holds the collection schema
- `test/`: Vitest specs, mirroring `app/` and `server/`
- `public/`: static assets served as-is

TypeScript config is generated by Nuxt into `.nuxt/tsconfig.json`; the root `tsconfig.json` just extends it.

## Conventions

- **Copy:** never use an em dash. Not in page text, not in comments, not in commit messages. Use a colon, a comma, parentheses, or a full stop. En dashes in numeric ranges (`19:00-22:00` uses a true en dash) are fine.
- **Types:** co-locate types with the code that owns them and export when shared. `RosterMember` is declared in `server/utils/roster.ts` and re-exported from `roster.get.ts`, so a page still imports the response type from the route that returns it. Only promote a type to a shared file once it's used across several unrelated modules.
- **Local content vs external APIs:** news (markdown via @nuxt/content), the raid schedule, and the links hub are local content edited in the repo, with no server route. Only external APIs go through `server/api/`.
- **WoW domain data:** class colours live in `app/utils/wow.ts` and follow the official WoW palette. Every API spells realms and classes differently; `realmSlug()`, `classColor()` and `rosterKey()` absorb that, so compare and look up through them.

## Blizzard API terms

The Blizzard Developer API Terms of Use apply to everything the site shows, since Raider.IO and Warcraft Logs build their data from Blizzard's too. The ones that bear on this repository:

- **Attribution:** the footer names and links the Blizzard API, Raider.IO and Warcraft Logs as sources and says the site is not affiliated with or endorsed by Blizzard. Keep both when reworking the layout. No Blizzard trademark in the site's name or URL.
- **30 days at most:** `RETENTION_LIMIT_MS` in `server/utils/cache.ts` enforces it for every cache. Anything that stores data outside `defineCache` must enforce it too.
- **Removal on request, at once:** every route that names a character applies `server/utils/optOut.ts`. The terms also want every copy deleted, and a deploy only empties each instance's memory, so after deploying an opt-out the keys in the `CACHE` KV namespace are deleted by hand in the Cloudflare dashboard. They refill on the next visits. The same goes for all cached data if Blizzard ends access or the site stops using the API.
- **Credentials and leaks:** the keys never leave the server, `.env` and Cloudflare. A leaked key gets a new secret and Blizzard is told; leaked data is reported to Blizzard within 24 hours.
- **Privacy policy:** `/privacy` says what comes from where, that it is shown as is, and how long it is kept. Update it when a page shows something new.
- **No money, no ads, no reselling**, and no passing the data to third parties.
- **Rate limits:** 36,000 calls an hour and 100 a second, made by our own server with our own key. Using other services to make extra calls for us is not allowed.

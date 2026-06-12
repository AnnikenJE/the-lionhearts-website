# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

Website for **The Lionhearts**, a World of Warcraft guild on **Darkmoon Faire (EU)**.

Relevant external services:
- [Raider.IO](https://raider.io) — guild progression and M+ rankings (has a public API)
- [Warcraft Logs](https://www.warcraftlogs.com) — raid log analysis (has a public GraphQL API)
- [WoWProgress](https://www.wowprogress.com) — progression tracking
- [WoW Armory](https://worldofwarcraft.blizzard.com/en-gb/) — official Blizzard character/guild data
- [WoW Head](https://www.wowhead.com) — item and spell database

## Deployment

**Pushes to `main` deploy directly to production at https://dev.thelionhearts.eu/** — do not push untested or broken changes.

## Commands

```bash
npm run dev       # start dev server (opens browser automatically)
npm run build     # type-check + production build
npm run preview   # preview the production build locally
npm run lint      # run ESLint
```

No test runner is configured yet.

## Architecture

Early-stage React 19 + TypeScript + Vite project.

- `src/main.tsx` — entry point, mounts `<App />` into `#root`
- `src/App.tsx` — root component, currently a shell
- `src/main.css` — global styles, imported in `main.tsx`

TypeScript is configured in strict mode with `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` enabled — the compiler will reject unused variables and unerasable TS syntax.



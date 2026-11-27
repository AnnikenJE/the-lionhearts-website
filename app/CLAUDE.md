# app/: the Nuxt front end

Pages, components, composables and styles. Every page gets its data from a route in `server/api/` (see `server/CLAUDE.md`), never from an external API directly.

## Files

- `app/app.vue`: root layout, renders `<NuxtPage />`, plus `<NuxtLoadingIndicator>` in the accent so every navigation shows progress (pages land at once and show their skeleton, so the bar is brief)
- `app/layouts/default.vue` holds the shared shell: header nav (Home, News, Raids, Roster, About) plus the footer links and the data-source attribution, which names and links the Blizzard API, Raider.IO and Warcraft Logs
- `app/pages/index.vue`: home page / landing hero (file-based routing)
- `app/pages/about.vue`: who the guild is and what it plays, with a short section pointing to `/contact`, plus the guild and raid rules as regular sections further down the page (`/rules` redirects here, see `nuxt.config.ts`)
- `app/pages/roster.vue`: guild roster page; groups members by rank, each rank collapsible
- `app/pages/contact.vue`: how to get in touch about anything (email, Discord), and how to ask to be taken off the site. Shows the site's email address (`CONTACT_EMAIL` in `app/data/links.ts`, the one place `/contact`, `/privacy` and About read it from). Linked from the footer next to Privacy. No contact form: it would need a backend and bring in new personal data
- `app/pages/privacy.vue`: what the site shows about a character, which external source each field comes from, how long it is kept (30 days at most), that it is shown as is, and how to be taken off. Blizzard's Developer API Terms of Use require the policy, the "as is" wording and immediate removal on request. Update it, and `LAST_UPDATED`, whenever a page starts showing something new from an API
- `app/pages/news/index.vue`, `app/pages/news/[slug].vue`: markdown-backed news list + post
- `app/pages/raids/index.vue`, `app/pages/raids/[code].vue`: raid nights from Warcraft Logs; the list page opens with a group picture of the guild (`public/raids-banner-*`, WebP at 800 and 1623 wide, cropped to a low strip around the line of characters; it shows character names, so an opt-out means blurring the name there too, see `server/utils/optOut.ts`), then the weekly raid schedule (`RaidSchedule`, shared with About), then shows one raid tier at a time (`?tier=<zone id>`, picked with `TierNav`, current tier by default) with bosses down and headcount, the detail page shows the boss list (pulls collapsed to one row per boss) and who was there, grouped tank / healer / dps
- `app/pages/characters/[realm]/[name].vue`: a page for every character on the guild roster. The header puts the portrait, name, spec line and links beside a card with the character's full-body render from Blizzard (`renderUrl`, served through `/api/render`): the render is drawn larger than the card and cropped to the figure (`w-auto` keeps its proportions), over a glow in the class colour. A character without a render gets no card. Below: stats, raid parses per tier, Mythic+, gear, raid progression and the guild raid nights they were in
- `app/data/schedule.ts`, `app/data/links.ts`: typed static data (raid schedule, links, the contact email)
- `app/data/news.ts`: `NEWS_ENABLED`, the off switch for news, true since launch. Set to false, the section goes everywhere at once (list page shows coming soon, post routes 404, the landing page shows no posts) and nothing is queried. Also `AUTHOR_AVATARS`, the byline pictures
- `app/components/RaidSchedule.vue` renders the raid schedule, on About and the raids page; the guild links are rendered straight into the footer
- `app/components/TierNav.vue`: the raid tier selector shared by the raids page and the character pages. Each tier is a link that sets `?tier=`, the current tier gets the bare URL. `busy` shows a spinner and "Loading <tier>…" in a live region beside the pills while the previous tier stays on screen
- `app/components/SectionHeading.vue` is the recurring section header: a heading with an optional muted note (a count, a link) pinned to the far end
- `app/components/LoadingSkeleton.vue`: the one loading placeholder, `shape` = `roster` | `raids` | `raid` | `character`, each mirroring its page's margins and cards (the character shape includes the render card) so nothing jumps when the data lands. Change it together with the page it mirrors. `role="status"` with the `label` prop as its screen-reader text; the bones pulse only under `motion-safe:`
- `app/components/FetchError.vue`: the in-page fetch error, worded by `fetchErrorMessage()` (`app/utils/loadState.ts`) so every page says it the same way, with a "Try again" button that calls the page's `refresh()`. Not configured (Warcraft Logs secrets unset) gets its own wording and no retry. Fatal errors and 404s are `app/error.vue`'s job
- `app/composables/useTierFetch.ts`: the fetch behind the raids page and the character pages. Reads `?tier=`, keeps the previous tier on screen while the next loads and through a failed fetch, and reports which tier is selected. Also returns `refresh` for an error's retry. Fetches lazily and awaits only on the server, so a client navigation lands at once on the skeleton
- `app/composables/useNotFound.ts`: sends a page to the error page when its fetch 404s, at setup on the server and through a watcher after a client navigation
- `app/utils/wow.ts`: `classColor()`, the official WoW class colours. Returns a CSS colour, so call sites bind it with `:style`, not `:class`. Normalises the key because Raider.IO says "Death Knight" and Warcraft Logs says "DeathKnight". Also `realmSlug()` (every API spells realms differently: "Defias Brotherhood", "DefiasBrotherhood"), `characterPath()`, which every character link goes through, `parseColor()` (the usual grey-to-gold parse brackets), `itemQualityColor()` and the Wowhead icon and item URLs
- `app/error.vue`: the themed error page, wrapped in `<NuxtLayout>` so the header, footer and Blizzard attribution stay. Shows only the numeric status code and the copy from `errorCopy()` in `app/utils/errorCopy.ts` (404 has its own words, every other status shares one fallback), never the error's message or stack. The home button is a real `<button>` calling `clearError({ redirect: '/' })`, styled like `AppButton`'s primary variant. Noindex
- `app/assets/css/main.css` holds the whole theme: Tailwind import, `@theme` tokens, and the handful of base rules that cannot be utilities

## Styles

Tailwind v4 utility classes by default, wired up through the `@tailwindcss/vite` plugin in `nuxt.config.ts`. Tailwind is the default because it keeps styling quick, not a hard rule: a component may use a `<style>` block or any other CSS when that is the better tool for the job (e.g. something Tailwind utilities can't express cleanly).

- **Palette:** warm near-black surfaces, parchment text, and the guild's gold as the accent. It lives in the `@theme` block in `main.css`, so each token is also a Tailwind scale entry: `--color-accent` gives `text-accent`/`bg-accent`, `--color-surface` gives `bg-surface`, `--color-fg-muted` gives `text-fg-muted`. Text has three steps: `fg` (primary), `fg-muted` (body), `fg-subtle` (labels and meta). Add a colour by adding a token, not by writing a hex value into a component.
- **Keep the accent rare.** Links, primary buttons, the active nav item, the odd badge. Everything structural (borders, cards, headings, body copy) is parchment on the dark surfaces. A page that turns gold has lost the plot.
- **Use Tailwind's own scales for everything else.** Radii are `rounded-lg`/`rounded-xl`/`rounded-2xl`, widths are `max-w-5xl` (site) and `max-w-3xl` (reading), breakpoints are plain `sm:`/`md:`, mobile-first. Only the palette and `--text-display` (the page-title size, which carries its own weight, leading and tracking) are project-specific.
- `main.css` also carries Preflight and the few genuinely global rules: `body`, `::selection`, the focus ring, the shared heading tracking, and the reduced-motion override (deliberately unlayered so it outranks every animation utility). Nothing page-specific belongs there.
- When a utility string is repeated across several elements in one file, hoist it to a `const` in `<script setup>` (see `roster.vue`'s `fieldSearch` or `about.vue`'s `marker`) rather than copy-pasting it. When it's repeated across files, make it a component.
- **Type:** Nunito Sans throughout, headings included, self-hosted as a variable font from `@fontsource-variable/nunito-sans` (imported at the top of `main.css`), never from Google Fonts, so no visitor's browser is sent to Google. Preflight strips heading sizes and weights, so every heading sets its own with utilities.
- Markdown from @nuxt/content has no classes of its own, so `news/[slug].vue` styles it with `@tailwindcss/typography` (`prose prose-invert`) plus `prose-*` variants that pull it onto the site palette.
- **Colour tokens (`@theme` in `main.css`):**

  | Token | Use |
  |---|---|
  | `bg` / `surface` / `surface-hover` | page background, cards, hovered rows |
  | `line` / `line-strong` | thin dividers / input and button borders. `line-strong` also appears as a hover background (the roster Clear button) |
  | `fg` / `fg-muted` / `fg-subtle` | primary text / body text / labels and meta |
  | `accent` / `accent-bright` / `accent-ink` | the only interactive colour: links, primary buttons, the active nav/tab state |
  | `success` / `warning` / `danger` / `info` | a kill / an in-progress pull / a wipe or error / "not configured" |

  Every text/accent pair above is checked against WCAG AA in `test/utils/contrast.spec.ts`; add a case there before adding a colour that text will sit on.
- **Shared pieces, and when to reach for them, instead of writing new markup:**

  | Need | Use |
  |---|---|
  | A bordered panel or list wrapper | `CARD` / `CARD_DIVIDED` (`app/utils/ui.ts`) |
  | A page's top-level section divider | `SECTION` (`app/utils/ui.ts`) |
  | A list row, label left and meta right | `ROW` / `ROW_LINK` (`app/utils/ui.ts`) |
  | A small status or filter chip | `AppBadge.vue` for a display chip; the `PILL`/`PILL_ON`/`PILL_OFF` tokens for an interactive one (a tab, a toggle) |
  | A table of rows and columns | `DataTable.vue` |
  | A "nothing here yet" message | `EmptyState.vue` |
  | A failed fetch, with or without retry | `FetchError.vue` |

## Page shell

Every page uses the same root container so headings never shift position between pages: `<main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">`, with a left-aligned `<h1 class="text-display text-fg">` and a lede `<p class="mt-5 text-lg text-fg-muted">`. Nothing at page level is centred. Where a narrower measure helps readability (rules articles, a news post body, About prose), constrain that block with an inner `max-w-3xl`, never the page container.

## Roster ranks

Raider.IO exposes ranks as numeric indices only (0 = Guild Master); the human-readable rank names are mapped in `roster.vue` and must be kept in sync with the in-game ranks.

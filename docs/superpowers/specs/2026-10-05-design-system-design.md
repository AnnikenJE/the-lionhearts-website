# Design system and colour palette (#54)

## Context

The site has had a theme since early on (warm near-black surfaces, parchment text, gold
accent) but no design system: the rules around it lived partly in code comments and partly
in `CLAUDE.md`, there were no semantic colours (success/warning/danger/info), and several
pages re-decided spacing, cards and tables per file instead of sharing a token or component.

Issue #54 asks to choose the palette on purpose, add semantic colours, check every text/accent
pair against WCAG AA, and build the shared pieces (tokens, components, a reference) that stop
new pages from re-deciding the same things.

This spec also folds in a mid-brainstorm decision: `CLAUDE.md`'s "Tailwind only, no `<style>`
blocks" rule has been relaxed (see the "Styles" convention, edited 2026-10-05). Tailwind stays
the default for speed, but a component may use a `<style>` block or any other CSS when that is
the better tool. Nothing in this spec currently needs that escape hatch, but the components
below are free to use it if implementation turns up a case where Tailwind utilities can't
express something cleanly.

## Decision: keep the current palette's structure, deepen it, and use the crest's own red

### Why not a different palette entirely

The current tokens were measured before any change was proposed (see table below): every
text/accent pair already passes WCAG AA, including `fg-subtle` on `surface` (4.94:1, the pair
the issue specifically flagged as at risk). The thing that actually fails is `line-strong`
against `surface`/`bg` (~1.4-1.5:1), far under the 3:1 WCAG 1.4.11 needs for a UI component
boundary (the search input's border, the secondary button's border). So the palette doesn't
need replacing, it needs the neutral ramp given more room and the borders strengthened.

### Why the crest's red

`public/lionhearts-crest.png` (the guild crest, rendered by `GuildCrest.vue`) is a black lion
with a gold crown/face/heart and a deep crimson mane. The current palette already uses the
crest's black (as the warm near-black background) and gold (as the accent), but never the red.
Three palette directions were compared live in a browser mockup during brainstorming (candidates
A/B/C: current-palette-with-fixed-borders, deeper-contrast, cooler-neutral); the human partner
picked the deeper-contrast direction (B) as the base, then asked for the red to be used more
than just as a semantic colour, landing on "full heraldic, deep colours" (candidate D): B's
depth, plus the crest's red used structurally (page-section dividers, the roster's rank-group
headers), not only as the `danger` semantic token.

Gold stays the only *interactive* accent (links, buttons, the active nav/tab state), unchanged
from the existing "keep the accent rare" rule. The crest red is a second, rarer accent used
only decoratively, never for anything clickable.

### Final tokens

All contrast ratios below are computed (WCAG relative luminance formula), not estimated.

| Token | Value | Replaces | Use |
|---|---|---|---|
| `--color-bg` | `#0a0a0a` | `#0f0f0f` | page background |
| `--color-surface` | `#121110` | `#151412` | cards, panels |
| `--color-surface-hover` | `#1c1a17` | `#1b1915` | hovered rows |
| `--color-line` | `#2e2a24` | `#262320` | thin dividers |
| `--color-line-strong` | `#6b6153` | `#35302a` | input/button borders |
| `--color-fg` | `#f0e8d8` | `#e8e0d0` | primary text |
| `--color-fg-muted` | `#c2b9a8` | `#b8b0a0` | body text |
| `--color-fg-subtle` | `#938c7c` | `#8a8474` | labels, meta |
| `--color-accent` | `#d4b67a` | `#c8a96e` | links, primary buttons, active state |
| `--color-accent-bright` | `#f0ce98` | `#e6c98d` | hover state for accent |
| `--color-accent-ink` | `#15110b` | `#191510` | text on accent |
| `--color-success` | `#8bb97e` | *(new)* | kill badge |
| `--color-warning` | `#d99642` | *(new)* | in-progress badge |
| `--color-danger` | `#cf6354` | *(new)* | wipe badge, error states |
| `--color-info` | `#74a0c0` | *(new)* | "not configured" badge |
| `--color-crest` | `#7a2a23` | *(new)* | decorative only: section dividers, rank-group headers |

Contrast (computed, WCAG relative luminance):

| Pair | Ratio | Needs | Pass |
|---|---|---|---|
| fg / bg | 16.25 | 4.5 | yes |
| fg-muted / bg | 10.18 | 4.5 | yes |
| fg-subtle / bg | 5.92 | 4.5 | yes |
| fg-subtle / surface | 5.64 | 4.5 | yes |
| accent / bg | 10.16 | 4.5 | yes |
| accent-ink / accent | 9.64 | 4.5 | yes |
| line-strong / surface | 3.11 | 3.0 | yes |
| line-strong / bg | 3.26 | 3.0 | yes |
| success / bg, surface | 8.80, 8.39 | 4.5 | yes |
| warning / bg, surface | 7.91, 7.54 | 4.5 | yes |
| danger / bg, surface | 5.25, 5.00 | 4.5 | yes |
| info / bg, surface | 7.10, 6.77 | 4.5 | yes |

`--color-crest` has no contrast requirement: every use is decorative (a divider rule, a
heading underline), never body text or a required-to-understand UI boundary under WCAG 1.4.11.

Out of scope, unchanged: WoW class colours, item quality colours and parse brackets in
`app/utils/wow.ts` (Blizzard's and Warcraft Logs' own conventions).

No change to the type scale (`--text-display` is still the only project-specific entry) or to
spacing/radius (Tailwind's own `rounded-lg`/`rounded-xl`/`max-w-5xl`/etc. already cover
everything in use). Nothing surfaced during brainstorming that needs new tokens there.

## Components

| Pattern | Decision |
|---|---|
| Card | Stays a token, `CARD`/`CARD_DIVIDED` in `app/utils/ui.ts` (already added in a prior cleanup). No markup structure to encapsulate beyond a `class`. |
| Data table | **New component**, `app/components/DataTable.vue`. Props: `columns: { key: string, label: string, align?: 'left' \| 'right' }[]`, `rows: Record<string, unknown>[]`. A scoped slot per column (`#cell-<key>="{ row }"`) for custom rendering (links, colour-coded percentages, icons), falling back to plain text. Replaces the duplicated `<table><thead><th>…` markup in the two tables on the character page (raid parses, Mythic+ runs). |
| Pill / chip | No change. `AppBadge.vue` already covers display chips; the `PILL`/`PILL_ON`/`PILL_OFF` tokens stay for the two call sites that are interactive controls with state (`TierNav`, the difficulty tabs), not display chips. Not worth merging two genuinely different things. |
| Empty state | **New component**, `app/components/EmptyState.vue`. A single `<p>` with a `message` prop, Vue's default attribute fallthrough carries a caller's `class` the same way `FetchError` already does. Replaces every ad-hoc "No X yet" / "No matches" paragraph (roster, raids list, raid detail, character page, landing page's news block). |
| Error state | No change. `FetchError.vue` and `app/error.vue` already cover this. |

Both new components use Tailwind utility classes in their templates; neither needs a `<style>`
block.

## Migration (same PR)

- `app/assets/css/main.css`: replace the `@theme` colour block with the 16 tokens above; update
  the header comment to mention the crest's decorative red alongside black/gold.
- `app/utils/ui.ts`: add `SECTION_CREST` (`border-crest/40` variant of `SECTION`) alongside the
  existing neutral `SECTION`.
- `app/pages/roster.vue`: rank-group heading's `border-b` becomes `border-crest`; the "No members
  match those filters" paragraph becomes `<EmptyState>`.
- `app/pages/index.vue`, `app/pages/raids/[code].vue`, the character page: every top-level
  page-section divider (raid parses, raid nights, Mythic+, gear, progression on the character
  page; raid nights and explore/news on the landing page; bosses and who-was-there on the raid
  detail page) switches from `SECTION` to `SECTION_CREST`. Their ad-hoc empty-state paragraphs
  become `<EmptyState>`.
- Character page: both `<table>` blocks (raid parses, Mythic+ runs) become `<DataTable>`.
- `app/pages/raids/[code].vue` and the character page: kill/wipe status switches from the current
  neutral/ad-hoc styling to `success`/`danger` tokens.

## Reference

A new subsection under `CLAUDE.md`'s "Conventions → Styles", not a separate in-repo page (keeps
it where both the human and Claude already look for conventions, no extra route to maintain).
Content: a table of the colour tokens and when to reach for each, and a short "what exists, when
to use it" list covering `CARD`/`CARD_DIVIDED`, `DataTable`, `EmptyState`, `AppBadge`, and the
`PILL` tokens, so a future page doesn't re-invent any of them.

## Testing

- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` all pass.
- Manual check at phone and desktop width on every migrated page (roster, raids list, a raid
  night, a character page, the landing page), per the issue's "Done when" criteria.
- Contrast is verified by computation (this document), not by eyeballing.

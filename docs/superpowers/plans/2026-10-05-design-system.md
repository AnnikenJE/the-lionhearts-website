# Design System and Colour Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's colour tokens with the verified-AA, crest-matched palette, add two shared components (`DataTable`, `EmptyState`), and migrate every page that currently hand-rolls a table or an empty-state message to use them.

**Architecture:** New `@theme` colour tokens in `app/assets/css/main.css` (16 tokens, replacing the current 11) plus one new `app/utils/ui.ts` export (`SECTION_CREST`). Two new Vue components (`DataTable.vue`, `EmptyState.vue`) under `app/components/`, auto-imported by Nuxt like every existing component there. Six pages are then edited to consume the new tokens and components; no page gains new data dependencies or routes.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup>`, Tailwind v4 (`@theme`), Vitest + `@vue/test-utils`/`@nuxt/test-utils` for component tests.

**Spec:** `docs/superpowers/specs/2026-10-05-design-system-design.md`

## Global Constraints

- Never use an em dash, anywhere: not in copy, comments, or commit messages (`CLAUDE.md` "Copy" convention). Use a colon, comma, parentheses, or full stop.
- Tailwind utility classes are the default and are sufficient for every task in this plan; none needs a `<style>` block.
- A colour is always added as a `@theme` token in `main.css`, never hardcoded as a hex value in a component.
- Keep the gold accent (`--color-accent`) rare: only links, primary buttons, and the active nav/tab state use it. The new `--color-crest` red is decorative only (dividers, headings) and must never appear on anything clickable.
- `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` must all pass before a task is considered done (mirrors `.github/workflows/ci.yml`).
- Types stay co-located with the code that owns them (e.g. `DataTable`'s `Column` type lives in `DataTable.vue` until a second component needs it).

## Review Focus

- **`DataTable` with an empty `rows` array.** Every call site already wraps its table in a `v-if`/`v-else` keyed off emptiness, but `DataTable` itself must not throw or render a stray row when given `rows: []`. Task 4's tests cover this directly.
- **A column whose key is missing or `null` on a given row** (e.g. a boss with no `spec`). The non-slotted fallback path (`{{ row[col.key] }}`) must render something sane, not the literal string `"undefined"`. Task 4's tests cover this directly.
- **Colour-blind and no-colour rendering.** `--color-crest` and the new `success`/`warning`/`danger` tokens must never be the *only* signal: the kill/wipe status already carries a text label ("Killed", "3 pulls, best 82.4%"), and Task 9 keeps that label, only adding colour alongside it. A reviewer should confirm no task drops the text in favour of colour alone.
- **`CLAUDE.md`'s new reference section going stale.** No test can catch documentation drift. Task 11 is the one place this plan documents `DataTable`/`EmptyState`/the token table; a reviewer should check it actually matches what Tasks 1 to 10 shipped, not what was planned.
- **The `line-strong` border token, visually.** Task 2's test proves the ratio (3.11:1 / 3.26:1), not that the new, lighter border still looks intentional next to the gold accent. A human should look at the roster search box and a secondary button (both use `border-line-strong`) at the end of Task 2, not just trust the number.

---

## Task 1: Contrast-ratio utility and palette verification

**Files:**
- Create: `app/utils/contrast.ts`
- Test: `test/utils/contrast.spec.ts`

**Interfaces:**
- Produces: `contrastRatio(a: string, b: string): number`, a `#rrggbb` to `#rrggbb` WCAG contrast ratio, used directly by this task's own test and available to any later task that needs it.

- [ ] **Step 1: Write the failing test**

```ts
// test/utils/contrast.spec.ts
import { describe, expect, it } from 'vitest'
import { contrastRatio } from '../../app/utils/contrast'

describe('contrastRatio', () => {
  it('is 1 for identical colours', () => {
    expect(contrastRatio('#808080', '#808080')).toBeCloseTo(1, 5)
  })

  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })

  it('is order-independent', () => {
    expect(contrastRatio('#0a0a0a', '#f0e8d8')).toBeCloseTo(contrastRatio('#f0e8d8', '#0a0a0a'), 10)
  })
})

describe('the design system palette (#54)', () => {
  const TOKENS = {
    bg: '#0a0a0a',
    surface: '#121110',
    lineStrong: '#6b6153',
    fg: '#f0e8d8',
    fgMuted: '#c2b9a8',
    fgSubtle: '#938c7c',
    accent: '#d4b67a',
    accentInk: '#15110b',
    success: '#8bb97e',
    warning: '#d99642',
    danger: '#cf6354',
    info: '#74a0c0',
  } as const
  const AA_TEXT = 4.5
  const AA_UI = 3

  it.each([
    ['fg', 'bg'], ['fgMuted', 'bg'], ['fgSubtle', 'bg'], ['fgSubtle', 'surface'],
    ['accent', 'bg'], ['accentInk', 'accent'],
    ['success', 'bg'], ['success', 'surface'],
    ['warning', 'bg'], ['warning', 'surface'],
    ['danger', 'bg'], ['danger', 'surface'],
    ['info', 'bg'], ['info', 'surface'],
  ] as const)('%s on %s passes AA for text (4.5:1)', (a, b) => {
    expect(contrastRatio(TOKENS[a], TOKENS[b])).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it.each([
    ['lineStrong', 'surface'], ['lineStrong', 'bg'],
  ] as const)('%s on %s passes AA for a UI boundary (3:1)', (a, b) => {
    expect(contrastRatio(TOKENS[a], TOKENS[b])).toBeGreaterThanOrEqual(AA_UI)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/utils/contrast.spec.ts`
Expected: FAIL with "Failed to resolve import" or "contrastRatio is not a function" (the module does not exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// app/utils/contrast.ts

/** WCAG relative luminance of a #rrggbb colour, 0 (black) to 1 (white). */
function relativeLuminance(hex: string): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const n = Number.parseInt(hex.replace('#', ''), 16)
  const r = channel((n >> 16) & 0xff)
  const g = channel((n >> 8) & 0xff)
  const b = channel(n & 0xff)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two #rrggbb colours, 1 (no contrast) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/utils/contrast.spec.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add app/utils/contrast.ts test/utils/contrast.spec.ts
git commit -m "feat(theme): add a WCAG contrast-ratio utility and verify the new palette"
```

---

## Task 2: Theme tokens in main.css

**Files:**
- Modify: `app/assets/css/main.css`
- Test: `test/assets/theme.spec.ts`

**Interfaces:**
- Consumes: nothing from Task 1 at runtime (the hex values are copied in literally; Task 1 proved they pass AA before they are used here).
- Produces: the 16 `--color-*` custom properties, each also a Tailwind scale entry (`--color-crest` gives `text-crest`/`bg-crest`/`border-crest`), consumed by Tasks 3, 6 to 10.

- [ ] **Step 1: Write the failing test**

```ts
// test/assets/theme.spec.ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../../app/assets/css/main.css', import.meta.url), 'utf-8')

describe('main.css theme tokens', () => {
  it.each([
    ['--color-bg', '#0a0a0a'],
    ['--color-surface', '#121110'],
    ['--color-surface-hover', '#1c1a17'],
    ['--color-line', '#2e2a24'],
    ['--color-line-strong', '#6b6153'],
    ['--color-fg', '#f0e8d8'],
    ['--color-fg-muted', '#c2b9a8'],
    ['--color-fg-subtle', '#938c7c'],
    ['--color-accent', '#d4b67a'],
    ['--color-accent-bright', '#f0ce98'],
    ['--color-accent-ink', '#15110b'],
    ['--color-success', '#8bb97e'],
    ['--color-warning', '#d99642'],
    ['--color-danger', '#cf6354'],
    ['--color-info', '#74a0c0'],
    ['--color-crest', '#7a2a23'],
  ])('%s is %s', (token, value) => {
    expect(css).toContain(`${token}: ${value};`)
  })

  it('no longer hardcodes the old accent in ::selection', () => {
    expect(css).not.toContain('rgb(200 169 110')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/assets/theme.spec.ts`
Expected: FAIL, every `it.each` case (the old hex values are still in the file).

- [ ] **Step 3: Replace the `@theme` block and the hardcoded selection colour**

Replace the file's header comment and `@theme` block:

```css
/* Tokens declared in `@theme` are both plain CSS variables and Tailwind scale
   entries: `--color-accent` gives `text-accent`/`bg-accent`, and so on. Radii,
   widths and breakpoints deliberately use Tailwind's own scales instead.

   A neutral ramp with one warm accent, the guild's gold, and a second, rarer
   accent, the guild crest's own red, used only for structure (section
   dividers, rank headings), never anything clickable. Keep both accents
   rare: everything else structural is neutral. */
@theme {
  /* Warm near-black rather than a true grey. */
  --color-bg: #0a0a0a;
  --color-surface: #121110;
  --color-surface-hover: #1c1a17;

  --color-line: #2e2a24;
  --color-line-strong: #6b6153;

  /* Parchment text, in three steps: primary, body, and labels/meta. */
  --color-fg: #f0e8d8;
  --color-fg-muted: #c2b9a8;
  --color-fg-subtle: #938c7c;

  /* Heraldic gold, used as an accent rather than as the theme. */
  --color-accent: #d4b67a;
  --color-accent-bright: #f0ce98;
  --color-accent-ink: #15110b;

  /* Status colours: a kill, an in-progress pull, a wipe, "not configured". */
  --color-success: #8bb97e;
  --color-warning: #d99642;
  --color-danger: #cf6354;
  --color-info: #74a0c0;

  /* The guild crest's own red (see public/lionhearts-crest.png). Decorative
     only: section dividers, rank headings. Never required to meet a
     contrast ratio, since nothing it marks is text or a UI boundary. */
  --color-crest: #7a2a23;

  --font-sans: "Nunito Sans Variable", ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;

  /* Carries its own weight, leading and tracking, so `text-display` is all a
     page title needs. */
  --text-display: clamp(2.5rem, 6vw, 4rem);
  --text-display--line-height: 1.05;
  --text-display--letter-spacing: -0.025em;
  --text-display--font-weight: 700;
}
```

Replace the `::selection` rule's hardcoded colour (it currently spells out the old accent as raw rgb instead of referencing the token):

```css
  ::selection {
    background: rgb(212 182 122 / 0.25);
    color: var(--color-fg);
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/assets/theme.spec.ts`
Expected: PASS, every case.

- [ ] **Step 5: Run typecheck and build, then look at the result**

Run: `npm run typecheck && npm run build`
Expected: both exit 0 (ignore the known `vue-router/volar/sfc-route-blocks` stack trace noise on typecheck).

Then run `npm run dev`, open the roster page, and look at the search input's border and the "Read about the guild" secondary button on the landing page. Both use `border-line-strong`; confirm the new, lighter border reads as intentional rather than a mistake (Review Focus item 5). Stop the dev server after checking.

- [ ] **Step 6: Commit**

```bash
git add app/assets/css/main.css test/assets/theme.spec.ts
git commit -m "feat(theme): deepen the palette, add semantic and crest colours

Every text/accent pair still passes WCAG AA (see test/utils/contrast.spec.ts);
line-strong now clears the 3:1 UI-boundary minimum it previously missed."
```

---

## Task 3: SECTION_CREST token

**Files:**
- Modify: `app/utils/ui.ts`

**Interfaces:**
- Consumes: `--color-crest` (Task 2).
- Produces: `SECTION_CREST: string`, a drop-in replacement for the existing `SECTION` export, consumed by Tasks 7, 9, 10.

- [ ] **Step 1: Add the token**

```ts
/** The divider between a page's top-level sections. */
export const SECTION = 'mt-16 border-t border-line pt-16'
/** SECTION with the crest's red instead of the neutral line, for a page's
 *  own top-level structure (not every divider, just the ones that mark the
 *  page's own sections, as decided in docs/superpowers/specs/2026-10-05-design-system-design.md). */
export const SECTION_CREST = 'mt-16 border-t border-crest/40 pt-16'
```

This is a plain string constant, consistent with every other token in this file (`CARD`, `ROW`, `PILL`, …), none of which has a dedicated test; `SECTION_CREST` follows the same convention.

- [ ] **Step 2: Run lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/utils/ui.ts
git commit -m "feat(theme): add SECTION_CREST for page-section dividers"
```

---

## Task 4: DataTable component

**Files:**
- Create: `app/components/DataTable.vue`
- Test: `test/components/DataTable.spec.ts`

**Interfaces:**
- Consumes: `CARD` (`app/utils/ui.ts`, already exported).
- Produces: `DataTable`, a globally auto-imported component (Nuxt convention: every file in `app/components/` is available by filename, no import needed) with props `columns: { key: string, label: string, align?: 'right' }[]`, `rows: Row[]`, `minWidth?: string`, `rowKey?: (row: Row) => string | number`, and a dynamically named scoped slot per column (`#cell-<key>="{ row }"`) that falls back to the raw cell value when the caller does not provide one. Consumed by Task 10.

- [ ] **Step 1: Write the failing tests**

```ts
// test/components/DataTable.spec.ts
// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DataTable from '../../app/components/DataTable.vue'

describe('DataTable', () => {
  it('renders column labels as headers', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: {
        columns: [{ key: 'name', label: 'Name' }, { key: 'score', label: 'Score', align: 'right' }],
        rows: [{ name: 'Brightblade', score: 42 }],
      },
    })
    expect(wrapper.findAll('th').map(th => th.text())).toEqual(['Name', 'Score'])
  })

  it('falls back to the raw cell value when no slot is provided for a column', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ name: 'Brightblade' }],
      },
    })
    expect(wrapper.text()).toContain('Brightblade')
  })

  it('renders a scoped slot instead of the raw value when one is provided', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ name: 'Brightblade' }],
      },
      slots: {
        'cell-name': ({ row }: { row: { name: string } }) => `Sir ${row.name}`,
      },
    })
    expect(wrapper.text()).toBe('NameSir Brightblade')
  })

  it('renders no rows, without erroring, when rows is empty', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: { columns: [{ key: 'name', label: 'Name' }], rows: [] },
    })
    expect(wrapper.findAll('tbody tr')).toHaveLength(0)
  })

  it('renders an empty cell rather than the literal string "undefined" for a missing key', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: { columns: [{ key: 'spec', label: 'Spec' }], rows: [{ name: 'Brightblade' }] },
    })
    expect(wrapper.find('td').text()).toBe('')
  })

  it('right-aligns a column flagged align: "right"', async () => {
    const wrapper = await mountSuspended(DataTable, {
      props: { columns: [{ key: 'score', label: 'Score', align: 'right' }], rows: [{ score: 1 }] },
    })
    expect(wrapper.find('th').classes()).toContain('text-right')
    expect(wrapper.find('td').classes()).toContain('text-right')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run test/components/DataTable.spec.ts`
Expected: FAIL (the component does not exist yet).

- [ ] **Step 3: Write the implementation**

```vue
<!-- app/components/DataTable.vue -->
<script setup lang="ts" generic="Row extends Record<string, unknown>">
interface Column {
  key: string
  label: string
  align?: 'right'
}

const { columns, rows, minWidth, rowKey } = defineProps<{
  columns: Column[]
  rows: Row[]
  /** e.g. "40rem", so columns don't crush on a narrow viewport inside the scroll container. */
  minWidth?: string
  /** Defaults to the row's index. Pass one when rows can reorder, e.g. `(row) => row.url`. */
  rowKey?: (row: Row) => string | number
}>()

const TH = 'px-4 py-3 text-left text-xs font-medium text-fg-subtle'
const TD = 'px-4 py-3 tabular-nums'

const cellValue = (row: Row, key: string) => {
  const value = row[key]
  return value == null ? '' : value
}
</script>

<template>
  <div :class="[CARD, 'overflow-x-auto']">
    <table class="w-full text-sm" :style="minWidth ? { minWidth } : undefined">
      <thead class="border-b border-line">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[TH, col.align === 'right' ? 'text-right' : '']"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line">
        <tr v-for="(row, index) in rows" :key="rowKey ? rowKey(row) : index">
          <td
            v-for="col in columns"
            :key="col.key"
            :class="[TD, col.align === 'right' ? 'text-right' : '']"
          >
            <slot :name="`cell-${col.key}`" :row="row">{{ cellValue(row, col.key) }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

If `vue-tsc` rejects the `generic="Row extends …"` attribute (Task 2's typecheck step would catch this as a new failure in this file), drop it and type both `rows` and `rowKey` using `Record<string, unknown>` directly in place of `Row`; every call site in Task 10 still works since its scoped slots destructure specific fields off `row` at the call site, not off the component's own type.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run test/components/DataTable.spec.ts`
Expected: PASS, all six cases.

- [ ] **Step 5: Run lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/components/DataTable.vue test/components/DataTable.spec.ts
git commit -m "feat(ui): add a shared DataTable component"
```

---

## Task 5: EmptyState component

**Files:**
- Create: `app/components/EmptyState.vue`
- Test: `test/components/EmptyState.spec.ts`

**Interfaces:**
- Produces: `EmptyState`, a globally auto-imported component with a `message: string` prop, rendering a single `<p>`. A caller's `class` attribute merges onto that `<p>` via Vue's default attribute fallthrough, the same way `FetchError` already receives `class="mt-12"` from its callers. Consumed by Tasks 6, 7, 8, 9, 10.

- [ ] **Step 1: Write the failing tests**

```ts
// test/components/EmptyState.spec.ts
// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import EmptyState from '../../app/components/EmptyState.vue'

describe('EmptyState', () => {
  it('renders the message', async () => {
    const wrapper = await mountSuspended(EmptyState, { props: { message: 'No raid nights logged in Nerub-ar Palace.' } })
    expect(wrapper.text()).toBe('No raid nights logged in Nerub-ar Palace.')
  })

  it('merges a passed-in class with its own', async () => {
    const wrapper = await mountSuspended(EmptyState, { props: { message: 'Nothing yet.' }, attrs: { class: 'mt-8' } })
    expect(wrapper.classes()).toContain('mt-8')
    expect(wrapper.classes()).toContain('text-fg-muted')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run test/components/EmptyState.spec.ts`
Expected: FAIL (the component does not exist yet).

- [ ] **Step 3: Write the implementation**

```vue
<!-- app/components/EmptyState.vue -->
<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <p class="text-fg-muted">{{ message }}</p>
</template>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run test/components/EmptyState.spec.ts`
Expected: PASS, both cases.

- [ ] **Step 5: Commit**

```bash
git add app/components/EmptyState.vue test/components/EmptyState.spec.ts
git commit -m "feat(ui): add a shared EmptyState component"
```

---

## Task 6: Migrate roster.vue

**Files:**
- Modify: `app/pages/roster.vue`

**Interfaces:**
- Consumes: `EmptyState` (Task 5), `--color-crest` (Task 2).

- [ ] **Step 1: Crest-red rank-group headings**

In `app/pages/roster.vue`, find:

```html
        <h2 class="border-b border-line pb-2">
```

Replace with:

```html
        <h2 class="border-b border-crest pb-2">
```

- [ ] **Step 2: EmptyState for the no-matches message**

Find:

```html
      <p v-if="!groups.length" class="mt-6 text-fg-muted">
        No members match those filters.
      </p>
```

Replace with:

```html
      <EmptyState v-if="!groups.length" class="mt-6" message="No members match those filters." />
```

- [ ] **Step 3: Run the existing suite and check in a browser**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: all pass (no test in this repo currently exercises `roster.vue` directly; this step is a regression check, not new coverage).

Run `npm run dev`, open `/roster`, confirm each rank heading now has a red underline and that typing a search query with no matches shows the empty-state text in the same place as before. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add app/pages/roster.vue
git commit -m "style(roster): crest-red rank headings, shared EmptyState"
```

---

## Task 7: Migrate index.vue (landing page)

**Files:**
- Modify: `app/pages/index.vue`

**Interfaces:**
- Consumes: `EmptyState` (Task 5), `SECTION_CREST` (Task 3).

- [ ] **Step 1: Crest-red section dividers**

Find:

```ts
const section = SECTION
```

Replace with:

```ts
const section = SECTION_CREST
```

(This one-line change updates all three `<section :class="section">` usages on this page: raid nights, explore, latest news.)

- [ ] **Step 2: EmptyState for the no-posts message**

Find:

```html
      <p v-if="!latest?.length" class="text-fg-muted">
        No posts yet, check back soon.
      </p>
```

Replace with:

```html
      <EmptyState v-if="!latest?.length" message="No posts yet, check back soon." />
```

- [ ] **Step 3: Run checks and look at the page**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: all pass.

Run `npm run dev`, open `/`, confirm the three dividers between "Raid nights", "Explore" and "Latest news" now carry the crest red. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add app/pages/index.vue
git commit -m "style(home): crest-red section dividers, shared EmptyState"
```

---

## Task 8: Migrate raids/index.vue

**Files:**
- Modify: `app/pages/raids/index.vue`

**Interfaces:**
- Consumes: `EmptyState` (Task 5). (This page has no top-level `SECTION` divider, so `SECTION_CREST` does not apply here.)

- [ ] **Step 1: EmptyState for the no-raid-nights message**

Find:

```html
        <p v-if="!raids.length" class="mt-8 text-fg-muted">No raid nights logged in {{ shown.tier.name }}.</p>
```

Replace with:

```html
        <EmptyState v-if="!raids.length" class="mt-8" :message="`No raid nights logged in ${shown.tier.name}.`" />
```

- [ ] **Step 2: Run checks**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add app/pages/raids/index.vue
git commit -m "style(raids): shared EmptyState for an empty tier"
```

---

## Task 9: Migrate raids/[code].vue

**Files:**
- Modify: `app/pages/raids/[code].vue`

**Interfaces:**
- Consumes: `EmptyState` (Task 5), `SECTION_CREST` (Task 3), `--color-success`/`--color-danger` (Task 2).

- [ ] **Step 1: Crest-red section dividers**

Find:

```ts
const section = SECTION
```

Replace with:

```ts
const section = SECTION_CREST
```

(Updates both `<section :class="section">` usages: Bosses, Who was there.)

- [ ] **Step 2: EmptyState for the no-pulls message**

Find:

```html
        <p v-if="!raid.fights.length" class="text-fg-muted">No boss pulls in this log.</p>
```

Replace with:

```html
        <EmptyState v-if="!raid.fights.length" message="No boss pulls in this log." />
```

- [ ] **Step 3: Colour the kill/wipe status**

Find:

```html
            <span class="text-sm text-fg-subtle">{{ fightStatus(fight) }}</span>
```

Replace with:

```html
            <span class="text-sm" :class="fight.kill ? 'text-success' : 'text-danger'">{{ fightStatus(fight) }}</span>
```

- [ ] **Step 4: Run checks and look at the page**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: all pass.

Run `npm run dev`, open a raid night that has both a kill and a wipe (any recent one from `/raids`), confirm killed bosses show their status in the success green and un-killed bosses in the danger red, and that the section dividers carry the crest red. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add app/pages/raids/[code].vue
git commit -m "style(raids): crest-red dividers, success/danger boss status, shared EmptyState"
```

---

## Task 10: Migrate the character page

**Files:**
- Modify: `app/pages/characters/[realm]/[name].vue`

**Interfaces:**
- Consumes: `EmptyState` (Task 5), `SECTION_CREST` (Task 3), `DataTable` (Task 4).

- [ ] **Step 1: Crest-red section dividers**

Find:

```ts
const section = SECTION
const card = CARD
```

Replace with:

```ts
const section = SECTION_CREST
```

(`card` is no longer needed once both tables move to `DataTable`, which has its own `CARD` wrapper internally; Step 4 removes its two remaining uses.)

- [ ] **Step 2: EmptyState for the three ad-hoc messages**

Find:

```html
        <p v-if="!character.logs" class="text-fg-muted">
          No Warcraft Logs rankings for this character.
        </p>
```

Replace with:

```html
        <EmptyState v-if="!character.logs" message="No Warcraft Logs rankings for this character." />
```

Find:

```html
          <p v-if="!difficulty" class="mt-6 text-fg-muted">
            No kills logged in {{ character.logs.tier.name }}.
          </p>
```

Replace with:

```html
          <EmptyState v-if="!difficulty" class="mt-6" :message="`No kills logged in ${character.logs.tier.name}.`" />
```

Find:

```html
        <p v-if="!character.mythicPlus.bestRuns.length" class="text-fg-muted">No runs this season.</p>
```

Replace with:

```html
        <EmptyState v-if="!character.mythicPlus.bestRuns.length" message="No runs this season." />
```

- [ ] **Step 3: Add the column definitions**

In `<script setup>`, after the `stats` computed, add:

```ts
const parseColumns = computed(() => [
  { key: 'boss', label: 'Boss' },
  { key: 'best', label: 'Best', align: 'right' as const },
  { key: 'median', label: 'Median', align: 'right' as const },
  { key: 'bestAmount', label: `Best ${metricLabel.value}`, align: 'right' as const },
  { key: 'kills', label: 'Kills', align: 'right' as const },
  { key: 'fastest', label: 'Fastest', align: 'right' as const },
  { key: 'itemLevel', label: 'iLvl', align: 'right' as const },
  { key: 'serverRank', label: 'Realm rank', align: 'right' as const },
])

const mplusColumns = [
  { key: 'dungeon', label: 'Dungeon' },
  { key: 'key', label: 'Key', align: 'right' as const },
  { key: 'time', label: 'Time', align: 'right' as const },
  { key: 'score', label: 'Score', align: 'right' as const },
  { key: 'date', label: 'Date', align: 'right' as const },
]
```

- [ ] **Step 4: Replace the raid-parses `<table>` with `<DataTable>`**

Find the whole block from `<div :class="[card, 'mt-4 overflow-x-auto']">` through its closing `</div>` (the raid-parses table), and replace it with:

```html
            <DataTable
              :columns="parseColumns"
              :rows="difficulty.bosses"
              :row-key="row => row.boss"
              min-width="40rem"
              class="mt-4"
            >
              <template #cell-boss="{ row }">
                <span class="text-fg">
                  {{ row.boss }}
                  <span v-if="row.spec && row.bestPercent != null" class="ml-1 text-xs text-fg-subtle">{{ row.spec }}</span>
                </span>
              </template>
              <template #cell-best="{ row }">
                <span class="font-semibold" :style="row.bestPercent != null ? { color: parseColor(row.bestPercent) } : undefined">
                  {{ row.bestPercent != null ? Math.floor(row.bestPercent) : '–' }}
                </span>
              </template>
              <template #cell-median="{ row }">
                <span :style="row.medianPercent != null ? { color: parseColor(row.medianPercent) } : undefined">
                  {{ row.medianPercent != null ? Math.floor(row.medianPercent) : '–' }}
                </span>
              </template>
              <template #cell-bestAmount="{ row }">
                <span class="text-fg-muted">{{ row.bestAmount != null ? compactNumber(row.bestAmount) : '–' }}</span>
              </template>
              <template #cell-kills="{ row }">
                <span class="text-fg-muted">{{ row.kills }}</span>
              </template>
              <template #cell-fastest="{ row }">
                <span class="text-fg-muted">{{ row.fastestKillMs != null ? formatClock(row.fastestKillMs) : '–' }}</span>
              </template>
              <template #cell-itemLevel="{ row }">
                <span class="text-fg-muted">{{ row.itemLevel ?? '–' }}</span>
              </template>
              <template #cell-serverRank="{ row }">
                <span class="text-fg-muted">{{ row.serverRank != null ? `#${row.serverRank}` : '–' }}</span>
              </template>
            </DataTable>
```

- [ ] **Step 5: Replace the Mythic+ `<table>` with `<DataTable>`**

Find the whole block from `<div v-else :class="[card, 'overflow-x-auto']">` through its closing `</div>` (the Mythic+ table), and replace it with:

```html
        <DataTable
          v-else
          :columns="mplusColumns"
          :rows="character.mythicPlus.bestRuns"
          :row-key="row => row.url"
          min-width="32rem"
        >
          <template #cell-dungeon="{ row }">
            <a :href="row.url" target="_blank" rel="noopener" class="-my-1 inline-block py-1 text-fg hover:underline">{{ row.dungeon }}</a>
          </template>
          <template #cell-key="{ row }">
            <span :class="row.upgrades > 0 ? 'text-fg' : 'text-fg-subtle'">
              +{{ row.level }}<span v-if="row.upgrades > 0" class="text-accent">{{ '+'.repeat(row.upgrades) }}</span>
            </span>
          </template>
          <template #cell-time="{ row }">
            <span class="text-fg-muted">{{ formatClock(row.clearTimeMs) }} <span class="text-fg-subtle">/ {{ formatClock(row.parTimeMs) }}</span></span>
          </template>
          <template #cell-score="{ row }">
            <span class="text-fg-muted">{{ row.score.toFixed(1) }}</span>
          </template>
          <template #cell-date="{ row }">
            <span class="text-fg-subtle">{{ formatDate(row.completedAt) }}</span>
          </template>
        </DataTable>
```

- [ ] **Step 6: Remove the now-unused `th`/`td` local consts**

Find and delete, from `<script setup>`:

```ts
const th = 'px-4 py-3 text-left text-xs font-medium text-fg-subtle'
const td = 'px-4 py-3 tabular-nums'
```

- [ ] **Step 7: Run checks**

Run: `npm run lint && npm run typecheck && npm run test`
Expected: all pass. If `typecheck` fails on the `DataTable` generic, apply the fallback noted in Task 4 Step 3, then re-run.

- [ ] **Step 8: Look at the page**

Run `npm run dev`, open any roster member's character page that has both raid parses and Mythic+ runs, confirm both tables render identically to before (same columns, same colours, same links), and that the section dividers between Raid parses / Raid nights / Mythic+ / Gear / Raid progression carry the crest red. Check at a narrow (phone) width too: both tables should still scroll horizontally inside their card. Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git add "app/pages/characters/[realm]/[name].vue"
git commit -m "style(characters): move both tables to DataTable, crest-red dividers, shared EmptyState"
```

---

## Task 11: Reference section in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add the reference under Conventions → Styles**

In the `### Conventions` section, immediately after the existing `- **Styles:**` bullet and its sub-bullets (after the "Markdown from @nuxt/content…" line, before `- **Page shell:**`), add:

```markdown
  - **Colour tokens (`@theme` in `main.css`):**

    | Token | Use |
    |---|---|
    | `bg` / `surface` / `surface-hover` | page background, cards, hovered rows |
    | `line` / `line-strong` | thin dividers / input and button borders |
    | `fg` / `fg-muted` / `fg-subtle` | primary text / body text / labels and meta |
    | `accent` / `accent-bright` / `accent-ink` | the only interactive colour: links, primary buttons, the active nav/tab state |
    | `success` / `warning` / `danger` / `info` | a kill / an in-progress pull / a wipe or error / "not configured" |
    | `crest` | the guild crest's red (`public/lionhearts-crest.png`), decorative only: section dividers, rank headings. Never on anything clickable |

    Every text/accent pair above is checked against WCAG AA in `test/utils/contrast.spec.ts`; add a case there before adding a colour that text will sit on.
  - **Shared pieces, and when to reach for them, instead of writing new markup:**

    | Need | Use |
    |---|---|
    | A bordered panel or list wrapper | `CARD` / `CARD_DIVIDED` (`app/utils/ui.ts`) |
    | A page's top-level section divider | `SECTION` (neutral) or `SECTION_CREST` (crest red), `app/utils/ui.ts` |
    | A list row, label left and meta right | `ROW` / `ROW_LINK` (`app/utils/ui.ts`) |
    | A small status or filter chip | `AppBadge.vue` for a display chip; the `PILL`/`PILL_ON`/`PILL_OFF` tokens for an interactive one (a tab, a toggle) |
    | A table of rows and columns | `DataTable.vue` |
    | A "nothing here yet" message | `EmptyState.vue` |
    | A failed fetch, with or without retry | `FetchError.vue` |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: reference the design system's tokens and shared components"
```

---

## Task 12: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full project gate**

Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: all four exit 0.

- [ ] **Step 2: Phone-width pass**

Run `npm run dev`. At a narrow (phone) viewport, open: `/roster`, `/raids` (switch tier if more than one exists), a raid night from `/raids/<code>`, a character page with both a raid-parses table and Mythic+ runs, and `/`. Confirm nothing overflows the page horizontally, both `DataTable` instances still scroll inside their own card, and every `EmptyState` message still reads in place of what used to be a plain paragraph. Stop the dev server.

- [ ] **Step 3: Desktop-width pass**

Repeat the same five pages at a normal desktop width, confirming the crest-red dividers and headings, and the success/danger boss-status colours, look intentional rather than jarring (this is the Review Focus item on `line-strong`'s visual check from Task 2, repeated here now that every page has the new palette, not just the two checked in Task 2).

- [ ] **Step 4: Close the loop with the issue**

Confirm against issue #54's "Done when" list: palette chosen and documented (spec, `CLAUDE.md`), every text/accent token pair passes AA (`test/utils/contrast.spec.ts`), pages use shared components instead of per-file strings for cards/tables/pills (Tasks 6 to 10), and `lint`/`typecheck`/`test`/`build` pass (Step 1). Nothing further to do; this task has no commit of its own.

# Error page design (issue #4)

## Problem

There is no `app/error.vue`, so a 404 or 500 falls back to Nuxt's default white error screen with no header or footer. Pages already throw fatal 404s (`news/[slug].vue`, `raids/[code].vue`, `characters/[realm]/[name].vue`), and they all land there.

## Decisions

- `app/error.vue` wraps its content in `<NuxtLayout>`, so the default layout's header, nav and footer (including the required Blizzard attribution) render unchanged. No duplicated shell, no refactor of the layout.
- Two cases only: 404, and a generic fallback for every other status.
- The error's `statusMessage`, `message` and `stack` are never rendered. Only the numeric status code is shown.

## Units

### `app/utils/errorCopy.ts`

Pure function, auto-imported like the rest of `app/utils`:

```ts
export interface ErrorCopy { title: string, lede: string }
export function errorCopy(statusCode: number | undefined): ErrorCopy
```

- `404`: title "Page not found", a lede saying the page does not exist or has moved.
- Anything else (including `undefined`): title "Something went wrong", a lede saying something broke on our side and to try again later.

Copy is English, has no em dash, and never tells the visitor to click or select anything.

### `app/error.vue`

- Prop `error: NuxtError` (from `#app`).
- `<NuxtLayout>` around the standard page shell: `<main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">`, a left-aligned `<h1 class="text-display text-fg">`, a lede `<p class="mt-5 text-lg text-fg-muted">`.
- The status code as small `text-fg-subtle` meta above the heading (e.g. "Error 404").
- A primary `<button type="button">` styled like `AppButton`'s primary variant, labelled "Back to the home page", calling `clearError({ redirect: '/' })`. A real button because it must clear the error state, not just navigate. `AppButton` is not changed; the class string is hoisted to a `const`.
- 404 only: a short row of shortcut links below the button to Raids, Roster and About (`NuxtLink`, styled as regular accent links).
- `useHead`: title from `errorCopy`, so the tab reads "Page not found · The Lionhearts" via the existing `titleTemplate`; `useSeoMeta({ robots: 'noindex' })`.

## Testing

- `test/errorCopy.test.ts` (node environment): 404 gives the not-found copy; 500, 503 and `undefined` give the fallback; no returned string contains an em dash.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` all pass.
- In the browser on the dev server: `/does-not-exist` and `/news/does-not-exist` render the themed 404 inside the site header and footer; a thrown 500 renders the fallback with no internal message or stack; the home button clears the error and lands on `/`; a header nav link from the error page leaves the error screen.
  - The 500 check uses a temporary route or page that throws, removed before committing.

## Docs

Root `CLAUDE.md` (the only one in the repo) gets an Architecture entry for `app/error.vue` and `errorCopy()`.

## Out of scope

Status-specific copy beyond 404, reporting errors anywhere, changes to `AppButton` or the layout.

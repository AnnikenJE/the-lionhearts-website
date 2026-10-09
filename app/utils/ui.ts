/** Shared look for the form controls, so the search box and the filter menus
 *  cannot drift apart. */
export const CONTROL
  = 'h-10 w-full rounded-lg border border-line-strong bg-bg px-3 text-sm text-fg '
    + 'transition placeholder:text-fg-subtle hover:border-fg-subtle'

export const FIELD_LABEL = 'text-xs font-medium text-fg-subtle'

/** Fixed width so a menu never resizes with its contents and shifts the row. */
export const FIELD = 'flex w-full min-w-0 flex-col gap-1.5 sm:w-44 sm:flex-none'

/** The pill toggles: the raid tier selector and the difficulty tabs. */
export const PILL = 'rounded-full border px-3 py-1 text-xs font-medium transition'
export const PILL_ON = 'border-accent/40 bg-accent/10 text-accent'
export const PILL_OFF = 'border-line text-fg-muted hover:border-line-strong hover:text-fg'

/** The card shape behind most lists and panels. */
export const CARD = 'overflow-hidden rounded-xl border border-line bg-surface'
/** CARD with a divider between each item, for lists of rows. */
export const CARD_DIVIDED = `${CARD} divide-y divide-line`

/** The divider between a page's top-level sections. */
export const SECTION = 'mt-16 border-t border-line pt-16'

/** A list row: label on the left, meta on the right. */
export const ROW = 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4'
/** ROW for a row that is itself a link. */
export const ROW_LINK = `${ROW} transition hover:bg-surface-hover`

/** Shared by AppButton and error.vue's home button, which must be a real <button>. */
export const BUTTON_BASE = 'inline-block rounded-lg px-4 py-2.5 text-sm font-semibold transition'
export const BUTTON_PRIMARY = 'bg-accent text-accent-ink hover:bg-accent-bright'
export const BUTTON_SECONDARY = 'border border-line-strong text-fg hover:bg-surface-hover'

/** Markdown from @nuxt/content renders to plain HTML with no classes of its own, so
 *  typography supplies the rhythm and these variants pull it onto the site palette.
 *  Shared by the news post page and the landing page's full-post preview. */
export const PROSE = [
  'prose prose-invert prose-lg max-w-none',
  'prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-fg',
  'prose-p:text-fg-muted prose-li:text-fg-muted prose-li:marker:text-fg-subtle',
  'prose-strong:text-fg prose-code:text-fg',
  'prose-a:font-medium prose-a:text-accent prose-a:underline-offset-4',
  'prose-blockquote:border-line-strong prose-blockquote:font-normal prose-blockquote:not-italic prose-blockquote:text-fg-subtle',
  'prose-hr:border-line prose-th:text-fg prose-thead:border-line-strong prose-tr:border-line',
  // Typography only zeroes the margin on the true first child. A post that opens
  // with an image (its first child) leaves the first paragraph's own top margin
  // in place, stacking on top of the container's own spacing to the title.
  // ContentRenderer wraps a post's markdown in its own div, so the prose
  // container's children aren't the p/img tags themselves but that one wrapper.
  '[&>div>p:first-of-type]:mt-0',
].join(' ')

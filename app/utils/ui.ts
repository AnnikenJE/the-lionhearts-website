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
/** SECTION with the crest's red instead of the neutral line, for a page's
 *  own top-level structure (not every divider, just the ones that mark the
 *  page's own sections, as decided in docs/superpowers/specs/2026-10-05-design-system-design.md). */
export const SECTION_CREST = 'mt-16 border-t border-crest/40 pt-16'

/** A list row: label on the left, meta on the right. */
export const ROW = 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4'
/** ROW for a row that is itself a link. */
export const ROW_LINK = `${ROW} transition hover:bg-surface-hover`

/** Shared by AppButton and error.vue's home button, which must be a real <button>. */
export const BUTTON_BASE = 'inline-block rounded-lg px-4 py-2.5 text-sm font-semibold transition'
export const BUTTON_PRIMARY = 'bg-accent text-accent-ink hover:bg-accent-bright'
export const BUTTON_SECONDARY = 'border border-line-strong text-fg hover:bg-surface-hover'

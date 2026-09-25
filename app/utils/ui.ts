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

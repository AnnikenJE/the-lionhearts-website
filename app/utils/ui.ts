/** Shared look for the form controls, so the search box and the filter menus
 *  cannot drift apart. */
export const CONTROL
  = 'h-10 w-full rounded-lg border border-line-strong bg-bg px-3 text-sm text-fg '
    + 'transition placeholder:text-fg-subtle hover:border-fg-subtle'

export const FIELD_LABEL = 'text-xs font-medium text-fg-subtle'

/** Fixed width so a menu never resizes with its contents and shifts the row. */
export const FIELD = 'flex w-full min-w-0 flex-col gap-1.5 sm:w-44 sm:flex-none'

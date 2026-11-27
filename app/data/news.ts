/**
 * The switch for the whole news section, on since launch. Set to false and
 * `/news` shows a coming-soon notice, `/news/<slug>` 404s, and the landing page
 * shows no posts. Nothing is fetched either, so no post titles reach the page
 * payload.
 */
export const NEWS_ENABLED: boolean = true

/**
 * The avatar shown next to a post's byline, keyed by the frontmatter `author`
 * exactly as written. An author with no entry here (or no author at all)
 * simply gets no avatar, rather than a placeholder.
 */
export const AUTHOR_AVATARS: Record<string, string> = {
  'Chinde (Anniken)': '/chinde-avatar.png',
}

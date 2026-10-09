/**
 * News is built but not launched: the posts under `content/news/` are still
 * drafts. While this is false `/news` shows a coming-soon notice, `/news/<slug>`
 * 404s, and the landing page drops its news block. Nothing is fetched either,
 * so no draft titles leak into the page payload. Flip to true to launch.
 */
export const NEWS_ENABLED: boolean = false

/**
 * The avatar shown next to a post's byline, keyed by the frontmatter `author`
 * exactly as written. An author with no entry here (or no author at all)
 * simply gets no avatar, rather than a placeholder.
 */
export const AUTHOR_AVATARS: Record<string, string> = {
  Chinde: '/chinde-avatar.jpg',
}

/**
 * News is built but not launched: the posts under `content/news/` are still
 * drafts. While this is false `/news` shows a coming-soon notice, `/news/<slug>`
 * 404s, and the landing page drops its news block. Nothing is fetched either,
 * so no draft titles leak into the page payload. Flip to true to launch.
 */
export const NEWS_ENABLED: boolean = false

/**
 * Per-page metadata: the tab title, the search result, and the card Discord
 * builds when someone pastes a link.
 *
 * Site-wide defaults (title template, site name, fallback description) live in
 * `app/app.vue`. A page only states what is its own, and this fills in the
 * derived parts: the Open Graph title, the canonical URL, the preview image.
 */
export interface PageSeo {
  /** Shown in the tab ahead of the site name. Omit it to show the site name alone. */
  title?: string
  /** One or two plain sentences. This is the search result and the link preview. */
  description: string
  /** Root-relative path to a preview image. Falls back to the guild crest. */
  image?: string
  /** 'article' for a news post, 'website' for everything else. */
  type?: 'website' | 'article'
}

const SITE_NAME = 'The Lionhearts'
const DEFAULT_IMAGE = '/lionhearts-crest.png'

/**
 * Pass a getter rather than a plain object when the values come from fetched
 * data, so the tags fill in with the page instead of staying empty.
 */
export function usePageSeo(seo: PageSeo | (() => PageSeo)) {
  const read = () => (typeof seo === 'function' ? seo() : seo)

  // Taken from the request rather than a hardcoded host, so the dev deploy
  // never advertises production URLs, and the other way round.
  const url = useRequestURL()
  const absolute = (path: string) => new URL(path, url.origin).href
  const canonical = absolute(url.pathname)

  useHead({
    link: [{ rel: 'canonical', href: canonical }],
  })

  useSeoMeta({
    title: () => read().title,
    description: () => read().description,
    // og:title carries no template of its own, so the site name is spelled out.
    ogTitle: () => {
      const { title } = read()
      return title ? `${title} · ${SITE_NAME}` : SITE_NAME
    },
    ogDescription: () => read().description,
    ogType: () => read().type ?? 'website',
    ogImage: () => absolute(read().image ?? DEFAULT_IMAGE),
    ogUrl: canonical,
  })
}

import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-06-14',
  modules: ['@nuxt/eslint', '@nuxt/content'],
  css: ['~/assets/css/main.css'],
  // Server-only: never nested under `public`, so these never reach the browser payload.
  // Empty-string defaults let a server route detect "not configured" and return a
  // clean 503 instead of crashing. Bound from env as NUXT_WCL_CLIENT_ID and
  // NUXT_WCL_CLIENT_SECRET (Nuxt's uppercase-and-underscore mapping of wcl.clientId
  // and wcl.clientSecret).
  runtimeConfig: {
    wcl: {
      clientId: '',
      clientSecret: '',
    },
    // Only production writes to the shared KV cache. Cloudflare sets CF_PAGES_BRANCH
    // while building, so this is fixed per build: a preview (or a local build) reads
    // the same cached data but never spends KV's daily writes on it.
    cacheKvWrites: process.env.CF_PAGES_BRANCH === 'main',
  },
  // Browsers may reuse the API answers for a minute, so moving between pages does not
  // refetch data the server has cached anyway. Kept short so an opt-out still takes
  // effect almost at once for someone who has the page open.
  routeRules: {
    '/api/**': { headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=600' } },
  },
  app: {
    head: {
      // Paints the mobile browser chrome the same near-black as the page.
      meta: [{ name: 'theme-color', content: '#0f0f0f' }],
      link: [
        // Square SVG wrapper around the crest, so the icon is never stretched.
        // The PNG stays as the fallback for browsers without SVG favicons.
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', href: '/lionhearts-crest.png' },
        { rel: 'apple-touch-icon', href: '/lionhearts-crest.png' },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
})

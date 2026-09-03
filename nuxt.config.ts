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
        // Nunito Sans is the site's only typeface, headings included.
        // Preconnect to both Google Fonts hosts so it isn't held up by
        // DNS + TLS.
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400..700&display=swap',
        },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
})

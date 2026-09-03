<script setup lang="ts">
// Site-wide head defaults. Pages state their own title and description through
// usePageSeo; whatever a page leaves out falls back to what is set here.
const SITE_NAME = 'The Lionhearts'
const DESCRIPTION
  = 'A social raiding and Mythic+ guild on Darkmoon Faire (EU). Beginner-friendly, '
    + 'with a mixed community, from first-time raiders to Mythic veterans.'

useHead({
  htmlAttrs: { lang: 'en' },
  // The tab reads "Roster · The Lionhearts", and just the guild name on the
  // landing page, which sets no title of its own.
  titleTemplate: title => (title ? `${title} · ${SITE_NAME}` : SITE_NAME),
})

useSeoMeta({
  description: DESCRIPTION,
  ogSiteName: SITE_NAME,
  ogLocale: 'en_GB',
  // The crest is a square logo rather than a wide banner, so a summary card
  // frames it better than a large image would.
  twitterCard: 'summary',
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

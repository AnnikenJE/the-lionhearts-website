<script setup lang="ts">
import { CONTACT_EMAIL, DISCORD_URL } from '~/data/links'

const link = 'text-accent underline underline-offset-4 transition hover:no-underline'

usePageSeo({
  title: 'Contact',
  description:
    'Contact The Lionhearts by email or on Discord.',
})
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <header class="max-w-3xl">
      <h1 class="text-display text-fg">Contact</h1>
      <p class="mt-5 text-lg text-fg-muted">
        Get in touch with questions about the guild, feedback on the website or
        enquiries about the data it shows. Guild matters are usually quickest on
        Discord.
      </p>
    </header>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">Email</SectionHeading>
      <p class="text-fg-muted">
        Write to
        <a :href="`mailto:${CONTACT_EMAIL}`" :class="link">{{ CONTACT_EMAIL }}</a>
        for anything about the website, including enquiries from the services
        and organisations whose data it uses. If something on the site looks
        wrong, let us know which page it is on.
      </p>
    </section>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">Discord</SectionHeading>
      <p class="text-fg-muted">
        For joining, raiding, the rules or suggestions for the guild, message the
        King Lionheart or one of the Royal Advisors on Discord.
      </p>
      <AppButton :href="DISCORD_URL" class="mt-5">Join our Discord</AppButton>
    </section>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">Removing a character</SectionHeading>
      <p class="text-fg-muted">
        Want your character taken off the site? Send us an email or a message on
        Discord with the character's name, no reason needed. The
        <NuxtLink to="/privacy" :class="link">privacy page</NuxtLink>
        explains what the site shows and where it comes from.
      </p>
    </section>
  </main>
</template>

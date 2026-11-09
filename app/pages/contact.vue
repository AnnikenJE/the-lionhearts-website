<script setup lang="ts">
import { CONTACT_EMAIL, DISCORD_URL } from '~/data/links'

const link = 'text-accent underline underline-offset-4 transition hover:no-underline'

// Examples, not a list of allowed topics: anyone can write about anything.
const EXAMPLES = [
  'Joining the guild, or a question about raiding or Mythic+',
  'Something on the website that looks wrong, or an idea for it',
  'A question about the data the site shows',
  'Taking your character off the site',
  'Getting in touch from outside the guild, for example from Blizzard, Warcraft Logs or Raider.IO',
]

usePageSeo({
  title: 'Contact',
  description:
    'How to get in touch with The Lionhearts about anything: by email, or on '
    + 'our Discord.',
})
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <header class="max-w-3xl">
      <h1 class="text-display text-fg">Contact</h1>
      <p class="mt-5 text-lg text-fg-muted">
        Anyone can get in touch with us, about anything. Send an email, or find
        us on Discord.
      </p>
    </header>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">Email</SectionHeading>
      <p class="text-lg">
        <a :href="`mailto:${CONTACT_EMAIL}`" :class="link">{{ CONTACT_EMAIL }}</a>
      </p>
      <p class="mt-4 text-fg-muted">Write to us about whatever is on your mind, for example:</p>
      <ul class="mt-3 list-disc space-y-1.5 pl-5 text-fg-muted marker:text-fg-subtle">
        <li v-for="example in EXAMPLES" :key="example">{{ example }}</li>
      </ul>
    </section>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">Taking your character off the site</SectionHeading>
      <p class="text-fg-muted">
        Send an email to
        <a :href="`mailto:${CONTACT_EMAIL}`" :class="link">{{ CONTACT_EMAIL }}</a>,
        or contact us on Discord, and say which character you mean. You do not
        have to give a reason. The
        <NuxtLink to="/privacy" :class="link">privacy page</NuxtLink>
        explains what happens next.
      </p>
    </section>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">Discord</SectionHeading>
      <p class="text-fg-muted">
        On Discord, message the King Lionheart or one of the Royal Advisors.
        Both ranks are marked on the
        <NuxtLink to="/roster" :class="link">roster</NuxtLink>.
      </p>
      <AppButton :href="DISCORD_URL" class="mt-5">Join our Discord</AppButton>
    </section>
  </main>
</template>

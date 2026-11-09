<script setup lang="ts">
import { CONTACT_EMAIL, DISCORD_URL } from '~/data/links'

const link = 'text-accent underline underline-offset-4 transition hover:no-underline'
const card = 'rounded-xl border border-line bg-surface p-5'

usePageSeo({
  title: 'Contact',
  description:
    'How to reach The Lionhearts: Discord for the guild and raiding, email for '
    + 'the website, removal requests and anyone outside the guild.',
})
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <header class="max-w-3xl">
      <h1 class="text-display text-fg">Contact</h1>
      <p class="mt-5 text-lg text-fg-muted">
        Most things are quickest on our Discord. For anything that does not fit
        there, or if you are not in the guild, send us an email.
      </p>
    </header>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">Email</SectionHeading>
      <p class="text-fg-muted">
        <a :href="`mailto:${CONTACT_EMAIL}`" :class="link">{{ CONTACT_EMAIL }}</a>
      </p>
      <p class="mt-4 text-fg-muted">
        For questions about the website and the data it shows, requests to take
        a character off the site, and contact from outside the guild.
      </p>
    </section>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">Who to ask</SectionHeading>
      <dl class="space-y-4">
        <div :class="card">
          <dt class="font-semibold text-fg">Joining, raiding and the guild</dt>
          <dd class="mt-2 text-fg-muted">
            The King Lionheart or one of the Royal Advisors on Discord. Both
            ranks are marked on the
            <NuxtLink to="/roster" :class="link">roster</NuxtLink>.
          </dd>
        </div>
        <div :class="card">
          <dt class="font-semibold text-fg">The website</dt>
          <dd class="mt-2 text-fg-muted">
            Email
            <a :href="`mailto:${CONTACT_EMAIL}`" :class="link">{{ CONTACT_EMAIL }}</a>.
          </dd>
        </div>
        <div :class="card">
          <dt class="font-semibold text-fg">Taking your character off the site</dt>
          <dd class="mt-2 text-fg-muted">
            Email us, or message an officer on Discord, and say which character
            you mean. The
            <NuxtLink to="/privacy" :class="link">privacy page</NuxtLink>
            explains what happens next.
          </dd>
        </div>
      </dl>
      <AppButton :href="DISCORD_URL" class="mt-6">Join our Discord</AppButton>
    </section>
  </main>
</template>

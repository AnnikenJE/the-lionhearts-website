<script setup lang="ts">
import type { Feature } from '~/components/FeatureGrid.vue'
import { DISCORD_URL } from '~/data/links'

const WHAT_WE_DO: Feature[] = [
  {
    title: 'Raiding',
    body: 'Two fixed nights a week, Thursday and Sunday. We work through the tier together at a pace that keeps it fun: prepared, but not a second job. Sign-ups are in the in-game calendar.',
  },
  {
    title: 'Mythic+',
    body: 'Keys run all week outside raid nights, from relaxed weekly runs to groups pushing rating. If you want a group, ask in the Discord, there is almost always something going.',
  },
  {
    title: 'Community',
    body: 'A mixed crowd, from people clearing their first raid to Mythic veterans. New players are genuinely welcome: ask questions, learn the fights, and take the time you need.',
  },
]
usePageSeo({
  title: 'About the guild',
  description:
    'The Lionhearts are a social raiding guild on Darkmoon Faire (EU) that also runs '
    + 'Mythic+. Beginner-friendly, with a mixed community, from first-time raiders to '
    + 'Mythic veterans.',
})
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <header>
      <h1 class="text-display text-fg">About the guild</h1>
      <p class="mt-5 text-lg text-fg-muted">
        The Lionhearts are a social raiding guild on Darkmoon Faire (EU) that
        also runs Mythic+. Beginner-friendly, with a mixed community, from
        first-time raiders to Mythic veterans.
      </p>
    </header>

    <section class="mt-14">
      <SectionHeading class="mb-5">What we do</SectionHeading>
      <FeatureGrid :items="WHAT_WE_DO" />
    </section>

    <section class="mt-14">
      <SectionHeading class="mb-5">Raid nights</SectionHeading>
      <RaidSchedule />
    </section>

    <section class="mt-14">
      <SectionHeading class="mb-5">Who to ask</SectionHeading>
      <p class="max-w-3xl text-fg-muted">
        Questions about joining, raiding or anything else? Contact the King
        Lionheart or one of the Royal Advisors on Discord. Both ranks are marked
        on the
        <NuxtLink to="/roster" class="font-medium text-accent hover:text-accent-bright">roster</NuxtLink>.
      </p>
      <AppButton :href="DISCORD_URL" class="mt-5">Join our Discord</AppButton>
    </section>
  </main>
</template>

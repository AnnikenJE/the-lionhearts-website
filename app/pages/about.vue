<script setup lang="ts">
import { DISCORD_URL } from '~/data/links'

const WHAT_WE_DO = [
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

// Adapted from the Discord server rules.
const RULE_SETS = [
  {
    title: 'Guild rules',
    rules: [
      'Use common sense.',
      'Do not be rude, mean or creepy towards others. If any member makes you feel uncomfortable, please contact a GM or Royal Advisor.',
      'No spam.',
      'No inappropriate images or videos. We have a NSFW channel, but please use your brain.',
      'Use text and voice channels for their intended purpose.',
      'No politics or controversial topics.',
    ],
  },
  {
    title: 'Raid rules',
    rules: [
      'Sign-up for raids is always in the calendar. Please sign up as tentative if you are uncertain.',
      'If you join the raid on a character that is locked to other raids, you will not be allowed to raid on that character.',
      'If you are uncertain about tactics, speak up. We would much rather go over tactics than wipe on bosses.',
      'You must be in voice chat if you are joining a raid. You may be muted if you do not want to speak.',
      'You are not allowed to stream the raid without speaking to a GM or Royal Advisor first.',
      'You are not allowed to raid while drunk or affected by any drugs.',
    ],
  },
]

// Numbered as markup rather than a CSS counter, so the chip can be styled.
const marker = 'flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-sm font-semibold text-fg-muted'

usePageSeo({
  title: 'About the guild',
  description:
    'The Lionhearts are a social raiding guild on Darkmoon Faire (EU) that also runs '
    + 'Mythic+. Beginner-friendly, with a mixed community, from first-time raiders to '
    + 'Mythic veterans, plus the guild and raid rules.',
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
      <ul class="grid gap-4 sm:grid-cols-3">
        <li v-for="item in WHAT_WE_DO" :key="item.title" class="rounded-xl border border-line bg-surface p-5">
          <h3 class="font-semibold text-fg">{{ item.title }}</h3>
          <p class="mt-2 text-sm text-fg-muted">{{ item.body }}</p>
        </li>
      </ul>
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

    <section
      v-for="(set, index) in RULE_SETS"
      :id="index === 0 ? 'rules' : undefined"
      :key="set.title"
      class="mt-14 scroll-mt-20"
    >
      <!-- id="rules" (first section only) is the /rules redirect's landing
           spot, see nuxt.config.ts. -->
      <SectionHeading class="mb-5">{{ set.title }}</SectionHeading>
      <ol class="space-y-3">
        <li
          v-for="(rule, i) in set.rules"
          :key="rule"
          class="flex gap-4 rounded-xl border border-line bg-surface p-4 text-fg-muted"
        >
          <span :class="marker" aria-hidden="true">{{ i + 1 }}</span>
          <span>{{ rule }}</span>
        </li>
      </ol>
    </section>

    <aside
      class="mt-14 rounded-xl border border-accent/30 bg-accent/5 p-5"
      aria-labelledby="enforcement"
    >
      <h2 id="enforcement" class="font-semibold text-accent">Enforcement</h2>
      <p class="mt-2 text-fg-muted">
        Breaking the rules too many times will get you banned from the Discord
        and the guild. Breaking the raid rules will ban you from raiding.
      </p>
    </aside>

    <p class="mt-8 max-w-3xl text-fg-subtle">
      Got a question about the rules, or a suggestion for improving the Discord
      or the guild? Please tell us.
    </p>

    <section class="mt-14">
      <SectionHeading class="mb-5">About this site</SectionHeading>
      <p class="max-w-3xl text-fg-muted">
        This website is made by and for The Lionhearts, just for fun. It covers
        our own guild and nothing else, and it is not meant to compete with
        Raider.IO, Warcraft Logs or any other site: they are where the data comes
        from, and the site links back to them. There are no ads and nothing for
        sale. Every raid log shown here was uploaded by a member of the guild.
        The
        <NuxtLink to="/privacy" class="font-medium text-accent hover:text-accent-bright">privacy page</NuxtLink>
        lists what the site shows and where each part comes from.
      </p>
    </section>
  </main>
</template>

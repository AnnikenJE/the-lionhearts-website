<script setup lang="ts">
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
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <header>
      <h1 class="text-display text-fg">Guild rules</h1>
      <p class="mt-5 text-lg text-fg-muted">
        The code every Lionheart is held to, in the guild, in Discord, and in
        the raid.
      </p>
    </header>

    <!-- Articles read better on a narrower measure, so the blocks are
         constrained rather than the page container. -->
    <section v-for="set in RULE_SETS" :key="set.title" class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">
        {{ set.title }}
        <template #end>{{ set.rules.length }} articles</template>
      </SectionHeading>
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
      class="mt-14 max-w-3xl rounded-xl border border-accent/30 bg-accent/5 p-5"
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
  </main>
</template>

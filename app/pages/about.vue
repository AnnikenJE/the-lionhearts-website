<script setup lang="ts">
import type { Feature } from '~/components/FeatureGrid.vue'
import { DISCORD_URL } from '~/data/links'

const WHAT_WE_DO: Feature[] = [
  {
    title: 'Raiding',
    body: 'Two fixed nights a week, Thursday and Sunday. We work through the tier together at a pace that keeps it fun: prepared, but not a second job. Sign-ups go in the Discord calendar.',
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

interface Officer {
  rank: string
  /** Characters they play, the one they are best known by first. */
  characters: { name: string, spec: string }[]
  note?: string
}

const OFFICERS: Officer[] = [
  {
    rank: 'King Lionheart',
    characters: [
      { name: 'Alfr', spec: 'Feral Druid' },
      { name: 'Exavu', spec: 'Protection Paladin' },
    ],
    note: 'Guild Master. Alfr holds the rank, but everyone calls him Exavu.',
  },
  {
    rank: 'Royal Advisor',
    characters: [
      { name: 'Anniken', spec: 'Arcane Mage' },
      { name: 'Chinde', spec: 'Subtlety Rogue' },
    ],
  },
  {
    rank: 'Royal Advisor',
    characters: [{ name: 'Asvaldr', spec: 'Arms Warrior' }],
  },
]

const raiderIo = (name: string) => `https://raider.io/characters/eu/darkmoon-faire/${name}`

// Two officers share a rank, so the rank alone is not a stable key.
const officerKey = (officer: Officer) => officer.characters.map(c => c.name).join('-')
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
        Questions about joining, raiding or anything else? Speak to the Guild
        Master or one of the Royal Advisors. Both ranks are marked on the
        <NuxtLink to="/roster" class="font-medium text-accent hover:text-accent-bright">roster</NuxtLink>.
      </p>

      <ul class="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        <li v-for="officer in OFFICERS" :key="officerKey(officer)" class="px-5 py-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
            {{ officer.rank }}
          </h3>
          <ul class="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <li v-for="character in officer.characters" :key="character.name">
              <a
                :href="raiderIo(character.name)"
                target="_blank"
                rel="noopener"
                class="font-medium text-accent hover:text-accent-bright"
              >{{ character.name }}</a>
              <span class="ml-1.5 text-sm text-fg-subtle">{{ character.spec }}</span>
            </li>
          </ul>
          <p v-if="officer.note" class="mt-2 text-sm text-fg-muted">{{ officer.note }}</p>
        </li>
      </ul>

      <div class="mt-6 max-w-3xl rounded-xl border border-accent/30 bg-accent/5 p-5">
        <h3 class="font-semibold text-accent">Get in touch</h3>
        <p class="mt-2 text-fg-muted">
          The fastest way to reach us is Discord. Join the server and message
          the GM or a Royal Advisor directly.
        </p>
        <AppButton :href="DISCORD_URL" class="mt-5">Join our Discord</AppButton>
      </div>
    </section>
  </main>
</template>

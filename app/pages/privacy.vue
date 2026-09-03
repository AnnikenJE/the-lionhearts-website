<script setup lang="ts">
import { DISCORD_URL } from '~/data/links'

// Every external source a page pulls character data from. Named one by one, so
// the policy says who holds the data rather than "third parties".
const SOURCES = [
  {
    name: 'Blizzard Entertainment',
    url: 'https://develop.battle.net/',
    body: 'The official game data behind a character: name, class, specialisation, realm and guild rank. This is the same information the in-game guild roster and the Armory already show.',
  },
  {
    name: 'Raider.IO',
    url: 'https://raider.io/guilds/eu/darkmoon-faire/The%20Lionhearts',
    body: 'The roster page, and the Mythic+ numbers that go with it. Raider.IO builds its guild profile from public game data.',
  },
  {
    name: 'Warcraft Logs',
    url: 'https://www.warcraftlogs.com/guild/eu/darkmoon-faire/the%20lionhearts',
    body: 'The raid nights: which bosses we pulled, which ones died, and who was in the group. Those logs are uploaded by our own raiders and are already public on Warcraft Logs.',
  },
]

const link = 'text-accent underline underline-offset-4 transition hover:no-underline'

const LAST_UPDATED = '3 September 2026'

usePageSeo({
  title: 'Privacy',
  description:
    'What The Lionhearts website shows about a character, where that data comes '
    + 'from, and how to have your character taken off the site.',
})
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <header class="max-w-3xl">
      <h1 class="text-display text-fg">Privacy</h1>
      <p class="mt-5 text-lg text-fg-muted">
        This is a guild website, not a service. It has no accounts, no sign-up
        and nothing to log in to. The only personal data on it is the public game
        data of the characters in the guild.
      </p>
    </header>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">What the site shows</SectionHeading>
      <p class="text-fg-muted">
        The roster lists each character in the guild by name, with their class,
        specialisation, realm and guild rank. The raid pages list the bosses we
        pulled on a given night and which characters were in the raid group.
      </p>
      <p class="mt-4 text-fg-muted">
        All of it is character data. None of it is account data: no real names,
        no email addresses, no BattleTags, no Discord handles. We never see, ask
        for or store a Battle.net password, and nothing on this site can log you
        in to anything.
      </p>
    </section>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">Where it comes from</SectionHeading>
      <p class="text-fg-muted">
        The site holds no database of its own. Every character detail is fetched
        from one of three places when a page is loaded, cached for a short while
        so we are not hammering anyone, and then discarded.
      </p>
      <dl class="mt-6 space-y-4">
        <div
          v-for="source in SOURCES"
          :key="source.name"
          class="rounded-xl border border-line bg-surface p-5"
        >
          <dt class="font-semibold text-fg">
            <a :href="source.url" target="_blank" rel="noopener" :class="link">{{ source.name }}</a>
          </dt>
          <dd class="mt-2 text-fg-muted">{{ source.body }}</dd>
        </div>
      </dl>
      <p class="mt-6 text-fg-muted">
        Those calls are made by our server, not by your browser, so visiting this
        site does not hand your IP address to Blizzard, Raider.IO or Warcraft
        Logs.
      </p>
    </section>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">What we collect about you</SectionHeading>
      <p class="text-fg-muted">
        Nothing. There are no analytics, no tracking pixels and no advertising on
        this site, and it sets no cookies. We do not build a profile of visitors
        and there is nothing to opt in or out of.
      </p>
      <p class="mt-4 text-fg-muted">
        The one thing loaded from outside is the site's typeface, served by
        Google Fonts, which means your browser requests the font file from
        Google. The site itself does not pass anything to them.
      </p>
    </section>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">Taking your character off the site</SectionHeading>
      <p class="text-fg-muted">
        You can ask at any time, and you do not have to give a reason. Message
        Lionheart or one of the Royal Advisors on
        <a :href="DISCORD_URL" target="_blank" rel="noopener" :class="link">our Discord</a>
        and say which character you mean. We add the name to the site's opt-out
        list and it disappears from the roster and from every raid page.
      </p>
      <p class="mt-4 text-fg-muted">
        That covers this site only. Your character stays visible in game, on the
        Armory, on Raider.IO and on Warcraft Logs, because none of those are ours
        to change. Each of them has its own way of being asked.
      </p>
    </section>

    <section class="mt-14 max-w-3xl">
      <SectionHeading class="mb-5">Blizzard</SectionHeading>
      <p class="text-fg-muted">
        This site is a fan site run by the members of The Lionhearts. It is not
        affiliated with, endorsed by or sponsored by Blizzard Entertainment.
        World of Warcraft and Blizzard Entertainment are trademarks or registered
        trademarks of Blizzard Entertainment, Inc. in the U.S. and other
        countries. Game data is retrieved through the Blizzard Developer API.
      </p>
    </section>

    <p class="mt-14 max-w-3xl text-fg-subtle">
      Last updated {{ LAST_UPDATED }}. If any of this is unclear, or you think
      something on the site should not be here, please tell us on Discord.
    </p>
  </main>
</template>

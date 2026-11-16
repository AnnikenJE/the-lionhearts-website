<script setup lang="ts">
import { GUILD_LINKS } from '~/data/links'

// Primary navigation. Kept as data so the link styling lives in exactly one
// place rather than being repeated on every <NuxtLink>.
const NAV = [
  { to: '/', label: 'Home' },
  { to: '/news', label: 'News' },
  { to: '/raids', label: 'Raids' },
  { to: '/roster', label: 'Roster' },
  { to: '/about', label: 'About' },
]

// A pill that fills in on hover, and stays filled on the current page. A little tighter
// on phones, so all six fit on one line down to a 360px screen instead of wrapping under a
// sticky header.
const navLink
  = 'shrink-0 rounded-md px-2 py-1.5 text-sm font-medium text-fg-muted transition hover:bg-surface hover:text-fg sm:px-3 '
    + '[&.router-link-active]:bg-surface [&.router-link-active]:text-fg'

// Padded to a comfortable touch target, with the padding taken back out of the layout.
const footerLink = '-my-1.5 inline-block py-1.5 text-sm text-fg-muted transition hover:text-fg'

// The data sources named in the attribution line, each linked: Raider.IO's API terms ask
// for a link back, and Blizzard's for the source to be named clearly.
const sourceLink = 'underline underline-offset-2 transition hover:text-fg'
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- Sticky, faintly translucent header so content scrolls under it. -->
    <header class="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur">
      <div
        class="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-between sm:gap-4 sm:px-6"
      >
        <NuxtLink to="/" class="flex items-center gap-2.5 font-semibold tracking-tight text-fg">
          <span class="inline-flex w-7"><GuildCrest /></span>
          The Lionhearts
        </NuxtLink>
        <nav class="flex max-w-full overflow-x-auto [scrollbar-width:none] sm:gap-1" aria-label="Primary">
          <NuxtLink v-for="item in NAV" :key="item.to" :to="item.to" :class="navLink">
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>

    <div class="flex-1">
      <slot />
    </div>

    <!-- The page's own py-16 separates content from the top border, so the
         footer adds no top margin. -->
    <footer class="border-t border-line">
      <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p class="text-sm text-fg-subtle">
            The Lionhearts <span aria-hidden="true">·</span> Darkmoon Faire (EU)
          </p>
          <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a
              v-for="link in GUILD_LINKS"
              :key="link.url"
              :href="link.url"
              target="_blank"
              rel="noopener"
              :class="footerLink"
            >{{ link.label }}</a>
            <NuxtLink to="/contact" :class="footerLink">Contact</NuxtLink>
            <NuxtLink to="/privacy" :class="footerLink">Privacy</NuxtLink>
          </div>
        </div>

        <!-- Required by the Blizzard Developer API Terms of Use: name the source,
             and make clear the site is not Blizzard's. -->
        <p class="mt-5 max-w-3xl text-xs leading-relaxed text-fg-subtle">
          A fan site run by the guild for its own members, not affiliated with or
          endorsed by Blizzard Entertainment. World of Warcraft and Blizzard
          Entertainment are trademarks of Blizzard Entertainment, Inc. Character
          and raid data comes from the
          <a href="https://develop.battle.net/" target="_blank" rel="noopener" :class="sourceLink">Blizzard API</a>,
          <a href="https://raider.io" target="_blank" rel="noopener" :class="sourceLink">Raider.IO</a>
          and
          <a href="https://www.warcraftlogs.com" target="_blank" rel="noopener" :class="sourceLink">Warcraft Logs</a>.
        </p>
      </div>
    </footer>
  </div>
</template>

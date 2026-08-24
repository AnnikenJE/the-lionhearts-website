<script setup lang="ts">
// Primary navigation. Kept as data so the link styling lives in exactly one
// place rather than being repeated on every <NuxtLink>.
const NAV = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/news', label: 'News' },
  { to: '/roster', label: 'Roster' },
  { to: '/rules', label: 'Rules' },
]

// A pill that fills in on hover, and stays filled on the current page.
const navLink
  = 'rounded-md px-3 py-1.5 text-sm font-medium text-fg-muted transition hover:bg-surface hover:text-fg '
    + '[&.router-link-active]:bg-surface [&.router-link-active]:text-fg'
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
        <nav class="flex flex-wrap justify-center gap-1" aria-label="Primary">
          <NuxtLink v-for="item in NAV" :key="item.to" :to="item.to" :class="navLink">
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>

    <div class="flex-1">
      <slot />
    </div>

    <!-- Compact: the page's own py-16 already separates content from the top
         border, so the footer adds no top margin of its own. The extra bottom
         padding on phones keeps the fixed "under construction" badge off the
         colophon. -->
    <footer class="border-t border-line">
      <div class="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pb-8">
        <p class="mb-3 text-sm font-medium text-fg-muted">Quick links</p>
        <LinkGrid />
        <p class="mt-6 text-sm text-fg-subtle">
          The Lionhearts <span aria-hidden="true">·</span> Darkmoon Faire (EU)
        </p>
      </div>
    </footer>

    <DevNotice />
  </div>
</template>

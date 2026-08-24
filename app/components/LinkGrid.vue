<script setup lang="ts">
import { GUILD_LINKS } from '~/data/links'
</script>

<template>
  <ul class="grid gap-3 sm:grid-cols-3">
    <li v-for="link in GUILD_LINKS" :key="link.url">
      <a
        :href="link.url"
        target="_blank"
        rel="noopener"
        class="flex h-full flex-col rounded-lg border border-line bg-surface px-4 py-3 transition hover:border-line-strong hover:bg-surface-hover"
      >
        <span class="flex items-center gap-1.5 text-sm font-semibold text-fg">
          {{ link.label }}
          <span class="text-xs text-fg-subtle" aria-hidden="true">↗</span>
        </span>
        <span v-if="link.description" class="text-sm text-fg-muted">{{ link.description }}</span>
      </a>
    </li>
  </ul>
</template>

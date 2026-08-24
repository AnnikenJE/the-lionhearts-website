<script setup lang="ts">
import { GUILD_LINKS } from '~/data/links'
</script>

<template>
  <ul class="flex flex-wrap gap-x-6 gap-y-2">
    <li v-for="link in GUILD_LINKS" :key="link.url">
      <a
        :href="link.url"
        target="_blank"
        rel="noopener"
        class="text-sm text-fg-muted transition hover:text-fg"
      >
        {{ link.label }}
      </a>
    </li>
  </ul>
</template>

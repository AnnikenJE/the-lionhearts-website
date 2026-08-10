<script setup lang="ts">
import { GUILD_LINKS } from '~/data/links'
</script>

<template>
  <ul class="links">
    <li v-for="link in GUILD_LINKS" :key="link.url">
      <a :href="link.url" target="_blank" rel="noopener" class="link">
        <span class="label">{{ link.label }}</span>
        <span v-if="link.description" class="desc">{{ link.description }}</span>
      </a>
    </li>
  </ul>
</template>

<style scoped>
.links {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  padding: 0.6rem 1rem;
  border: 1px solid #222;
  border-radius: 8px;
}

.label {
  color: #c8a96e;
  letter-spacing: 0.05em;
}

.desc {
  color: #777;
  font-size: 0.8rem;
}

.link:hover {
  border-color: #c8a96e;
}
</style>

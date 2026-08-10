<script setup lang="ts">
import { GUILD_LINKS } from '~/data/links'
</script>

<template>
  <ul class="links">
    <li v-for="link in GUILD_LINKS" :key="link.url">
      <a :href="link.url" target="_blank" rel="noopener" class="link">
        <span class="label">
          {{ link.label }}
          <span class="ext" aria-hidden="true">↗</span>
        </span>
        <span v-if="link.description" class="desc">{{ link.description }}</span>
      </a>
    </li>
  </ul>
</template>

<style scoped>
.links {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.link {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  height: 100%;
  text-decoration: none;
  padding: 0.9rem 1.1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    transform 0.16s ease;
}

.link:hover {
  background: var(--surface-hover);
  border-color: var(--gold-deep);
  transform: translateY(-2px);
}

.label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--gold);
  letter-spacing: 0.04em;
}

.ext {
  color: var(--gold-deep);
  font-size: 0.75rem;
}

.desc {
  color: var(--text-muted);
  font-size: 0.82rem;
}
</style>

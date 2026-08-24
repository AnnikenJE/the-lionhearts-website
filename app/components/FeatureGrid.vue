<script setup lang="ts">
export interface Feature {
  title: string
  body: string
}

const { level = 3 } = defineProps<{
  items: Feature[]
  /** Heading level for each card, so it fits the surrounding outline. */
  level?: 2 | 3
}>()
</script>

<template>
  <ul class="grid gap-4 sm:grid-cols-3">
    <li v-for="item in items" :key="item.title" class="rounded-xl border border-line bg-surface p-5">
      <component :is="`h${level}`" class="font-semibold text-fg">
        {{ item.title }}
      </component>
      <p class="mt-2 text-sm text-fg-muted">{{ item.body }}</p>
    </li>
  </ul>
</template>

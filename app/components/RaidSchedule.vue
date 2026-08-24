<script setup lang="ts">
import { RAID_SCHEDULE } from '~/data/schedule'
</script>

<template>
  <ul class="grid gap-4 sm:grid-cols-2">
    <li
      v-for="night in RAID_SCHEDULE"
      :key="night.day"
      class="rounded-xl border border-line bg-surface p-5"
    >
      <p class="text-sm font-medium text-fg-muted">{{ night.day }}</p>
      <p class="mt-1 text-2xl font-semibold tracking-tight text-fg">
        {{ night.start }}<template v-if="night.end">–{{ night.end }}</template>
      </p>
      <p class="mt-1 text-sm text-fg-subtle">{{ night.timezone }}</p>
      <p v-if="night.note" class="mt-2 text-sm text-fg-muted">{{ night.note }}</p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { RAID_SCHEDULE } from '~/data/schedule'
</script>

<template>
  <ul class="schedule">
    <li v-for="night in RAID_SCHEDULE" :key="night.day" class="night">
      <span class="day">{{ night.day }}</span>
      <span class="time">
        {{ night.start }}<template v-if="night.end">–{{ night.end }}</template>
        <span class="tz">{{ night.timezone }}</span>
      </span>
      <span v-if="night.note" class="note">{{ night.note }}</span>
    </li>
  </ul>
</template>

<style scoped>
.schedule {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.night {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 1rem 1.1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 2px solid var(--gold-deep);
  border-radius: var(--radius);
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;
}

.night:hover {
  background: var(--surface-hover);
  border-color: var(--border-strong);
  border-left-color: var(--gold);
}

.day {
  color: var(--gold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.time {
  color: var(--text);
  font-size: 1.05rem;
}

.tz {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.note {
  color: var(--text-muted);
  font-size: 0.8rem;
  margin-top: 0.2rem;
}
</style>

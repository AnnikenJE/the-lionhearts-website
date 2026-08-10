<script setup lang="ts">
import { RAID_SCHEDULE } from '~/data/schedule'
</script>

<template>
  <ul class="schedule">
    <li v-for="night in RAID_SCHEDULE" :key="night.day" class="night">
      <span class="day">{{ night.day }}</span>
      <span class="time">{{ night.start }}–{{ night.end }} {{ night.timezone }}</span>
      <span v-if="night.note" class="note">{{ night.note }}</span>
    </li>
  </ul>
</template>

<style scoped>
.schedule {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.night {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 1rem;
  border: 1px solid #222;
  border-radius: 8px;
  min-width: 160px;
}

.day {
  color: #c8a96e;
  letter-spacing: 0.05em;
}

.time {
  color: #e8e0d0;
}

.note {
  color: #777;
  font-size: 0.8rem;
  margin-top: 0.2rem;
}
</style>

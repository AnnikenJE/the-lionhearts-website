<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <p class="text-fg-muted">{{ message }}</p>
</template>

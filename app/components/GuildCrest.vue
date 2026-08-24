<script setup lang="ts">
// Decorative wherever the guild name already appears as text, so it is hidden
// from assistive tech unless given a label. Sizing is the caller's job.
withDefaults(defineProps<{ alt?: string }>(), { alt: '' })
</script>

<template>
  <img
    src="/lionhearts-crest.png"
    class="block h-auto w-full"
    :alt="alt"
    :aria-hidden="alt ? undefined : 'true'"
    width="380"
    height="513"
    decoding="async"
  >
</template>

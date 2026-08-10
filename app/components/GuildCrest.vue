<script setup lang="ts">
// The Lionhearts guild crest (crowned lion). Decorative wherever the guild
// name already appears as text, so it's hidden from assistive tech by default.
withDefaults(
  defineProps<{
    /** Accessible label. Omit to render the crest as decorative. */
    alt?: string
  }>(),
  { alt: '' },
)
</script>

<template>
  <img
    src="/lionhearts-crest.png"
    class="crest"
    :alt="alt"
    :aria-hidden="alt ? undefined : 'true'"
    width="380"
    height="513"
    decoding="async"
  >
</template>

<style scoped>
.crest {
  display: block;
  width: 100%;
  height: auto;
  /* A faint warm glow lifts the crest off the dark background. */
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.55));
}
</style>

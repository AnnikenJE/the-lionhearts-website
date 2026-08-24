<template>
  <!-- Vertical margin is left to the caller so it cannot fight a utility class
       passed in from outside. -->
  <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
    <h2 class="text-xl font-semibold text-fg">
      <slot />
    </h2>
    <div v-if="$slots.end" class="text-sm text-fg-subtle">
      <slot name="end" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Headless UI's Listbox rather than a native <select>: the option list is real
// markup, so it can carry the site palette, and the arrow is ours to place.
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from '@headlessui/vue'

defineProps<{
  label: string
  /** Shown when nothing is picked. Choosing it clears the filter. */
  placeholder: string
  options: string[]
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <Listbox v-model="model" as="div" :class="FIELD">
    <ListboxLabel :class="FIELD_LABEL">{{ label }}</ListboxLabel>
    <div class="relative">
      <ListboxButton :class="[CONTROL, 'flex cursor-pointer items-center justify-between gap-2 text-left']">
        <span class="truncate">{{ model || placeholder }}</span>
        <svg
          class="size-4 shrink-0 text-fg-subtle"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </ListboxButton>

      <ListboxOptions
        class="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line-strong bg-surface p-1 shadow-xl focus:outline-none"
      >
        <ListboxOption
          v-for="option in ['', ...options]"
          :key="option"
          v-slot="{ active, selected }"
          :value="option"
          as="template"
        >
          <li
            class="cursor-pointer truncate rounded-md px-2.5 py-1.5 text-sm"
            :class="[
              active ? 'bg-surface-hover' : '',
              selected ? 'text-accent' : 'text-fg-muted',
            ]"
          >
            {{ option || placeholder }}
          </li>
        </ListboxOption>
      </ListboxOptions>
    </div>
  </Listbox>
</template>

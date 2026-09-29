<script setup lang="ts">
// A placeholder shaped like the content it stands in for, so a page keeps its layout
// while its fetch is on its way. One component for every page; `shape` picks the layout
// and mirrors that page's own margins and cards. The bones are aria-hidden: a screen
// reader hears only the label.
const { shape, label } = defineProps<{
  shape: 'roster' | 'raids' | 'raid' | 'character'
  label: string
}>()

const bone = 'block rounded-md bg-surface-hover motion-safe:animate-pulse'
const card = 'divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface'
const row = 'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4'
const section = 'mt-16 border-t border-line pt-16'
</script>

<template>
  <div role="status" aria-busy="true">
    <span class="sr-only">{{ label }}</span>

    <div aria-hidden="true">
      <!-- roster.vue: filter bar, the "Showing" line, then ranks of name and spec -->
      <template v-if="shape === 'roster'">
        <div class="mt-10 h-[4.625rem] rounded-xl border border-line bg-surface" />
        <div class="mt-4 min-h-6" />
        <section v-for="group in 3" :key="group" class="mt-8">
          <div class="border-b border-line pb-2">
            <span :class="[bone, 'my-1.5 h-5 w-40']" />
          </div>
          <ul class="mt-3 columns-[280px] gap-x-6">
            <li v-for="member in 6" :key="member" class="break-inside-avoid px-3 py-2">
              <span :class="[bone, 'h-5 w-28']" />
              <span :class="[bone, 'mt-1.5 h-4 w-36']" />
            </li>
          </ul>
        </section>
      </template>

      <!-- raids/index.vue: the tier pills, then one row per raid night -->
      <template v-else-if="shape === 'raids'">
        <div class="mt-10 flex flex-wrap gap-2">
          <span v-for="pill in 4" :key="pill" :class="[bone, 'h-7 w-32 rounded-full']" />
        </div>
        <ul :class="[card, 'mt-6']">
          <li v-for="night in 8" :key="night" :class="row">
            <span :class="[bone, 'h-5 w-48']" />
            <span :class="[bone, 'h-4 w-64']" />
          </li>
        </ul>
      </template>

      <!-- raids/[code].vue: title, date line, log button, then the boss list -->
      <template v-else-if="shape === 'raid'">
        <span :class="[bone, 'mt-6 h-[1.05em] w-2/3 text-display']" />
        <span :class="[bone, 'mt-5 h-6 w-1/2']" />
        <span :class="[bone, 'mt-6 h-10 w-48 rounded-lg']" />
        <div :class="section">
          <span :class="[bone, 'mb-6 h-6 w-32']" />
          <ul :class="card">
            <li v-for="fight in 6" :key="fight" :class="row">
              <span :class="[bone, 'h-5 w-44']" />
              <span :class="[bone, 'h-4 w-28']" />
            </li>
          </ul>
        </div>
      </template>

      <!-- characters/[realm]/[name].vue: portrait and name, spec line, links, stats, parses -->
      <template v-else>
        <div class="mt-6 flex items-center gap-5">
          <span :class="[bone, 'size-16 shrink-0 rounded-xl sm:size-20']" />
          <span :class="[bone, 'h-[1.05em] w-64 max-w-full text-display']" />
        </div>
        <span :class="[bone, 'mt-5 h-6 w-80 max-w-full']" />
        <div class="mt-6 flex flex-wrap gap-3">
          <span v-for="link in 3" :key="link" :class="[bone, 'h-10 w-32 rounded-lg']" />
        </div>
        <div class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          <div v-for="stat in 5" :key="stat" class="rounded-xl border border-line bg-surface px-5 py-4">
            <span :class="[bone, 'h-4 w-20']" />
            <span :class="[bone, 'mt-2 h-8 w-16']" />
          </div>
        </div>
        <div :class="section">
          <span :class="[bone, 'mb-6 h-6 w-36']" />
          <div class="flex flex-wrap gap-2">
            <span v-for="pill in 4" :key="pill" :class="[bone, 'h-7 w-32 rounded-full']" />
          </div>
          <ul :class="[card, 'mt-6']">
            <li v-for="boss in 6" :key="boss" :class="row">
              <span :class="[bone, 'h-5 w-40']" />
              <span :class="[bone, 'h-4 w-48']" />
            </li>
          </ul>
        </div>
      </template>
    </div>
  </div>
</template>

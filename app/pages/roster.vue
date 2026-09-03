<script setup lang="ts">
import type { RosterMember } from '~~/server/api/roster.get'

// Raider.IO exposes only the numeric rank index (0 = Guild Master), so the
// labels live here and must be kept in sync with the in-game ranks. Rank 99 is
// Raider.IO's placeholder for an unresolved rank and is filtered out in
// server/api/roster.get.ts.
const RANK_NAMES: Record<number, string> = {
  0: 'King Lionheart',
  1: 'Royal Advisor',
  2: 'Lord',
  3: 'Noble',
  4: 'Knight',
  5: 'Squire',
  6: 'Soldier',
  7: 'Recruit',
  8: 'Civilian',
  9: 'Peasant',
}

// Official WoW class colours.
const CLASS_COLORS: Record<string, string> = {
  'Death Knight': '#c41e3a',
  'Demon Hunter': '#a330c9',
  'Druid': '#ff7c0a',
  'Evoker': '#33937f',
  'Hunter': '#aad372',
  'Mage': '#3fc7eb',
  'Monk': '#00ff98',
  'Paladin': '#f48cba',
  'Priest': '#ffffff',
  'Rogue': '#fff468',
  'Shaman': '#0070dd',
  'Warlock': '#8788ee',
  'Warrior': '#c69b6d',
}

const rankName = (rank: number) => RANK_NAMES[rank] ?? `Rank ${rank}`
const classColor = (cls: string) => CLASS_COLORS[cls] ?? 'var(--color-fg)'

const { data: members, pending, error } = await useFetch<RosterMember[]>('/api/roster')

const total = computed(() => members.value?.length ?? 0)

const query = ref('')
const classFilter = ref('')
const roleFilter = ref('')

// Options come from the roster itself, so they can never list a class or role
// nobody plays.
const classes = computed(() => [...new Set((members.value ?? []).map(m => m.class))].sort())
const roles = computed(() =>
  [...new Set((members.value ?? []).flatMap(m => m.role ?? []))].sort(),
)

const isFiltering = computed(
  () => !!(query.value.trim() || classFilter.value || roleFilter.value),
)

const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  return (members.value ?? []).filter((m) => {
    if (classFilter.value && m.class !== classFilter.value) return false
    if (roleFilter.value && m.role !== roleFilter.value) return false
    // Name, class and spec are searched together, so "frost" and "mage" both work.
    return !q || `${m.name} ${m.class} ${m.spec ?? ''}`.toLowerCase().includes(q)
  })
})

const clearFilters = () => {
  query.value = ''
  classFilter.value = ''
  roleFilter.value = ''
}

const groups = computed(() => {
  const byRank = new Map<number, RosterMember[]>()
  for (const m of matches.value) {
    byRank.set(m.rank, [...(byRank.get(m.rank) ?? []), m])
  }
  return [...byRank.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rank, list]) => ({ rank, name: rankName(rank), members: list }))
})

const collapsed = ref<Set<number>>(new Set())
const toggle = (rank: number) => {
  const next = new Set(collapsed.value)
  if (!next.delete(rank)) next.add(rank)
  collapsed.value = next
}

// Filtering forces every rank open, otherwise a collapsed rank would hide the
// matches the search just found.
const isOpen = (rank: number) => isFiltering.value || !collapsed.value.has(rank)

// flex-1 gives the search box a 0% basis, so its width never depends on its own
// content and the row cannot re-wrap while you type.
const fieldSearch = 'flex w-full min-w-0 flex-col gap-1.5 sm:w-auto sm:flex-1'
usePageSeo({
  title: 'Roster',
  description:
    'Every member of The Lionhearts, grouped by in-game rank and searchable by name, '
    + 'class and spec. Pulled live from Raider.IO.',
})
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <header>
      <h1 class="text-display text-fg">Roster</h1>
    </header>

    <p v-if="pending" class="mt-12 text-fg-muted">Loading roster…</p>
    <p v-else-if="error" class="mt-12 text-fg-muted">Could not load the roster right now.</p>

    <template v-else>
      <!-- Every control is h-10 and none is sized by its own content, so
           items-end lands all four on one baseline and nothing moves as you
           type. -->
      <div class="mt-10 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4">
        <div :class="fieldSearch">
          <label :class="FIELD_LABEL" for="roster-search">Search</label>
          <input
            id="roster-search"
            v-model="query"
            type="search"
            :class="CONTROL"
            placeholder="Name, class or spec…"
            autocomplete="off"
          >
        </div>

        <SelectMenu v-model="classFilter" label="Class" placeholder="All classes" :options="classes" />
        <SelectMenu v-model="roleFilter" label="Role" placeholder="All roles" :options="roles" />

        <!-- The wrapper keeps the button auto-width on its own stacked line on
             phones. The button is always rendered and only disabled, because
             hiding it changed the bar's width as soon as you typed. -->
        <div class="flex w-full justify-end sm:w-auto sm:justify-start">
          <button
            type="button"
            class="h-10 shrink-0 cursor-pointer rounded-lg bg-surface-hover px-4 text-sm font-medium text-fg transition hover:bg-line-strong disabled:cursor-default disabled:opacity-40 disabled:hover:bg-surface-hover"
            :disabled="!isFiltering"
            @click="clearFilters"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Always rendered and merely hidden, so the line reserves the height it
           will occupy at every width, wrapped lines included. -->
      <p class="mt-4 min-h-6 text-sm tabular-nums text-fg-subtle" role="status">
        <span :class="{ invisible: !isFiltering }">
          Showing {{ matches.length }} of {{ total }} members
        </span>
      </p>

      <p v-if="!groups.length" class="mt-6 text-fg-muted">
        No members match those filters.
      </p>

      <section v-for="group in groups" :key="group.rank" class="mt-8">
        <h2 class="border-b border-line pb-2">
          <button
            class="flex w-full cursor-pointer items-center gap-2 rounded-md py-1 text-left text-lg font-semibold text-fg transition hover:text-accent"
            :aria-expanded="isOpen(group.rank)"
            @click="toggle(group.rank)"
          >
            <!-- The fixed box pins the glyph's footprint, so the rank name
                 keeps its position whichever way the arrow points. -->
            <span
              class="inline-block w-3 shrink-0 text-center text-xs leading-none text-fg-subtle transition-transform"
              :class="{ '-rotate-90': !isOpen(group.rank) }"
              aria-hidden="true"
            >▼</span>
            {{ group.name }}
            <!-- min-w holds the pill at one size from 1 to 999 members. -->
            <span class="ml-auto min-w-10 shrink-0 rounded-full bg-surface px-2.5 py-0.5 text-center text-xs font-medium tabular-nums text-fg-subtle">
              {{ group.members.length }}
            </span>
          </button>
        </h2>
        <!-- v-show keeps the list in the DOM so re-expanding is instant. -->
        <ul v-show="isOpen(group.rank)" class="mt-3 columns-[280px] gap-x-6">
          <li
            v-for="m in group.members"
            :key="m.name + m.realm"
            class="flex break-inside-avoid flex-col rounded-lg px-3 py-2 transition hover:bg-surface"
          >
            <a
              :href="m.profileUrl"
              target="_blank"
              rel="noopener"
              class="font-medium hover:underline"
              :style="{ color: classColor(m.class) }"
            >{{ m.name }}</a>
            <span class="text-sm text-fg-subtle">
              {{ m.spec ? `${m.spec} ${m.class}` : m.class }}
            </span>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

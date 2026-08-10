<script setup lang="ts">
// Guild roster page: fetches members from our cached /api/roster endpoint,
// groups them by in-game rank, and lets each rank be collapsed.
import type { RosterMember } from "~~/server/api/roster.get";

// Raider.IO only exposes the numeric rank index (0 = Guild Master), not the
// guild's chosen rank names. Edit these labels to match the in-game ranks.
const RANK_NAMES: Record<number, string> = {
  0: "King Lionheart",
  1: "Royal Advisor",
  2: "Lord",
  3: "Noble",
  4: "Knight",
  5: "Squire",
  6: "Soldier",
  7: "Recruit",
  8: "Civilian",
  9: "Peasant",
};

// Official WoW class colours.
const CLASS_COLORS: Record<string, string> = {
  "Death Knight": "#c41e3a",
  "Demon Hunter": "#a330c9",
  Druid: "#ff7c0a",
  Evoker: "#33937f",
  Hunter: "#aad372",
  Mage: "#3fc7eb",
  Monk: "#00ff98",
  Paladin: "#f48cba",
  Priest: "#ffffff",
  Rogue: "#fff468",
  Shaman: "#0070dd",
  Warlock: "#8788ee",
  Warrior: "#c69b6d",
};

// Fall back gracefully if Raider.IO ever returns an unknown rank or class.
const rankName = (rank: number) => RANK_NAMES[rank] ?? `Rank ${rank}`;
const classColor = (cls: string) => CLASS_COLORS[cls] ?? "#e8e0d0";

// Fetched once on the server during SSR and reused on the client.
const {
  data: members,
  pending,
  error,
} = await useFetch<RosterMember[]>("/api/roster");

const total = computed(() => members.value?.length ?? 0);

// Group members by rank so each rank gets a heading, keeping API sort order.
const groups = computed(() => {
  const byRank = new Map<number, RosterMember[]>();
  for (const m of members.value ?? []) {
    const list = byRank.get(m.rank) ?? [];
    list.push(m);
    byRank.set(m.rank, list);
  }
  return [...byRank.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rank, list]) => ({ rank, name: rankName(rank), members: list }));
});

// Track which ranks are collapsed so each role can be hidden independently.
const collapsed = ref<Set<number>>(new Set());
const toggle = (rank: number) => {
  const next = new Set(collapsed.value);
  if (next.has(rank)) next.delete(rank);
  else next.add(rank);
  collapsed.value = next;
};
</script>

<template>
  <main class="roster">
    <header class="head">
      <h1>Roster</h1>
      <p class="server">
        The Lionhearts — Darkmoon Faire (EU)
        <span v-if="total" class="total">· {{ total }} members</span>
      </p>
    </header>

    <!-- Loading / error states -->
    <p v-if="pending" class="status">Loading roster…</p>
    <p v-else-if="error" class="status">Could not load the roster right now.</p>

    <!-- One collapsible section per rank -->
    <template v-else>
      <section v-for="group in groups" :key="group.rank" class="rank-group">
        <!-- Clicking the heading toggles this rank's member list -->
        <h2>
          <button
            class="toggle"
            :aria-expanded="!collapsed.has(group.rank)"
            @click="toggle(group.rank)"
          >
            <span class="chevron" :class="{ closed: collapsed.has(group.rank) }"
              >▾</span
            >
            {{ group.name }}
            <span class="count">{{ group.members.length }}</span>
          </button>
        </h2>
        <!-- v-show keeps the list in the DOM so re-expanding is instant -->
        <ul v-show="!collapsed.has(group.rank)">
          <li v-for="m in group.members" :key="m.name + m.realm">
            <a
              :href="m.profileUrl"
              target="_blank"
              rel="noopener"
              class="name"
              :style="{ color: classColor(m.class) }"
              >{{ m.name }}</a
            >
            <span class="meta">
              {{ m.spec ? `${m.spec} ${m.class}` : m.class }}
            </span>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

<style scoped>
.roster {
  text-align: left;
  max-width: 1080px;
  width: 100%;
  padding: 2.5rem 1.5rem 1rem;
  margin: 0 auto;
}

.head {
  position: relative;
  text-align: center;
  margin-bottom: 2.5rem;
}

h1 {
  margin-bottom: 0.4rem;
}

.server {
  text-align: center;
}

.total {
  color: var(--gold);
  white-space: nowrap;
}

.status {
  text-align: center;
}

.rank-group {
  margin-bottom: 2.5rem;
}

h2 {
  border-bottom: 1px solid var(--border);
  margin-bottom: 0.8rem;
}

.toggle {
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--gold);
  font-family: inherit;
  font-size: 1.05rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.35rem 0.4rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: color 0.15s ease;
}

.toggle:hover {
  color: var(--gold-bright);
}

.chevron {
  font-size: 0.8rem;
  color: var(--gold-deep);
  transition: transform 0.15s ease;
}

/* Point right when the rank is collapsed, down when expanded */
.chevron.closed {
  transform: rotate(-90deg);
}

.count {
  margin-left: auto;
  color: var(--text-dim);
  font-size: 0.8rem;
}

/* Multi-column layout: members flow top-to-bottom, fitting as many ~300px
   columns as the width allows (3 on desktop, 2 on tablet, 1 on mobile). */
ul {
  list-style: none;
  column-width: 300px;
  column-gap: 1.5rem;
}

li {
  display: flex;
  flex-direction: column;
  padding: 0.4rem 0.6rem;
  border-radius: var(--radius-sm);
  transition: background 0.12s ease;
  break-inside: avoid; /* keep a member's name + spec together in one column */
}

li:hover {
  background: var(--surface);
}

.name {
  text-decoration: none;
  font-size: 1rem;
  line-height: 1.3;
}

.name:hover {
  text-decoration: underline;
}

.meta {
  color: var(--text-muted);
  font-size: 0.78rem;
}
</style>

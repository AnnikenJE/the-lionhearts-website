<script setup lang="ts">
import type { CharacterDifficultyRankings, CharacterProfile } from '~~/server/api/characters/[realm]/[name].get'

const route = useRoute()

// The tier lives in the URL (?tier=44), so a tier can be linked and the back button
// works. A computed query makes useFetch refetch when it changes.
const query = computed(() => (route.query.tier ? { tier: String(route.query.tier) } : {}))

const { data: character, pending, error } = await useFetch<CharacterProfile>(
  () => `/api/characters/${route.params.realm}/${encodeURIComponent(String(route.params.name))}`,
  { query },
)

// Same pattern as raids/[code].vue: the route's 404 lands in error, so it is
// re-thrown for Nuxt's error page.
if (error.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Character not found', fatal: true })
}

// Mythic, Heroic, Normal, only those with a kill; the first is the hardest one the
// character has killed anything on, which is the one worth showing first.
const selectedDifficulty = ref<string | null>(null)
watch(() => character.value?.logs?.tier.id, () => (selectedDifficulty.value = null))

const difficulty = computed<CharacterDifficultyRankings | null>(() => {
  const all = character.value?.logs?.difficulties ?? []
  return all.find(d => d.difficulty === selectedDifficulty.value) ?? all[0] ?? null
})

const metricLabel = computed(() => (character.value?.logs?.metric === 'hps' ? 'HPS' : 'DPS'))

const specLine = computed(() => {
  const c = character.value
  if (!c) return ''
  return [c.spec, c.className].filter(Boolean).join(' ')
})

const stats = computed(() => {
  const c = character.value
  if (!c) return []
  const d = difficulty.value
  return [
    { label: 'Item level', value: c.itemLevel != null ? Math.floor(c.itemLevel).toString() : null, color: null },
    { label: 'Mythic+ score', value: c.mythicPlus ? Math.round(c.mythicPlus.score).toString() : null, color: c.mythicPlus?.color ?? null },
    {
      label: d ? `Best avg, ${d.difficulty}` : 'Best avg',
      value: d?.bestAverage != null ? d.bestAverage.toFixed(1) : null,
      color: d?.bestAverage != null ? parseColor(d.bestAverage) : null,
    },
    {
      label: 'Server rank',
      value: d?.allStars ? `#${d.allStars.serverRank}` : null,
      color: null,
    },
    {
      label: 'Achievement points',
      value: c.achievementPoints != null ? c.achievementPoints.toLocaleString('en-GB') : null,
      color: null,
    },
  ].filter(stat => stat.value != null)
})

const roleLabel = { tank: 'Tank', healer: 'Healer', dps: 'DPS' } as const

// Five nights at a time, paged in place like the raids page.
const nightsPager = usePagination(() => character.value?.raidNights)

const section = 'mt-16 border-t border-line pt-16'
const card = 'overflow-hidden rounded-xl border border-line bg-surface'
const th = 'px-4 py-3 text-left text-xs font-medium text-fg-subtle'
const td = 'px-4 py-3 tabular-nums'
const pill = 'rounded-full border px-3 py-1 text-xs font-medium transition'
const pillOn = 'border-accent/40 bg-accent/10 text-accent'
const pillOff = 'border-line text-fg-muted hover:border-line-strong hover:text-fg'

usePageSeo(() => ({
  title: character.value ? `${character.value.name}, ${character.value.realm}` : 'Character',
  description: character.value
    ? `${character.value.name}, ${specLine.value} on ${character.value.realm}: raid parses, gear and Mythic+ for The Lionhearts.`
    : 'A raider of The Lionhearts.',
}))
</script>

<template>
  <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
    <NuxtLink to="/roster" class="text-sm text-fg-muted transition hover:text-fg">
      <span aria-hidden="true">←</span> Roster
    </NuxtLink>

    <p v-if="pending && !character" class="mt-12 text-fg-muted">Loading character…</p>
    <p v-else-if="error" class="mt-12 text-fg-muted">Could not load this character right now.</p>

    <template v-else-if="character">
      <div class="mt-6 flex items-center gap-5">
        <img
          v-if="character.thumbnailUrl"
          :src="character.thumbnailUrl"
          :alt="`${character.name}'s portrait`"
          class="size-16 shrink-0 rounded-xl border border-line sm:size-20"
          width="80"
          height="80"
        >
        <div class="min-w-0">
          <h1 class="text-display" :style="{ color: classColor(character.className) }">{{ character.name }}</h1>
        </div>
      </div>

      <p class="mt-5 text-lg text-fg-muted">
        {{ specLine }}<template v-if="character.race">, {{ character.race }}</template>
        on {{ character.realm }}<template v-if="character.guild">, &lt;{{ character.guild.name }}&gt;</template>
      </p>

      <div class="mt-6 flex flex-wrap gap-3">
        <AppButton :href="character.links.warcraftLogs">Warcraft Logs</AppButton>
        <AppButton v-if="character.links.raiderIo" :href="character.links.raiderIo" variant="secondary">Raider.IO</AppButton>
        <AppButton :href="character.links.armory" variant="secondary">Armory</AppButton>
      </div>

      <dl v-if="stats.length" class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <div v-for="stat in stats" :key="stat.label" class="rounded-xl border border-line bg-surface px-5 py-4">
          <dt class="text-xs font-medium text-fg-subtle">{{ stat.label }}</dt>
          <dd class="mt-1 text-2xl font-semibold tabular-nums text-fg" :style="stat.color ? { color: stat.color } : undefined">
            {{ stat.value }}
          </dd>
        </div>
      </dl>

      <!-- Raid logs -->
      <section :class="section">
        <SectionHeading class="mb-6">
          Raid parses
          <template v-if="character.logs" #end>{{ metricLabel }}, from Warcraft Logs</template>
        </SectionHeading>

        <p v-if="!character.logs" class="text-fg-muted">
          No Warcraft Logs rankings for this character.
        </p>

        <template v-else>
          <nav aria-label="Raid tier" class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="(tier, index) in character.logs.tiers"
              :key="tier.id"
              :to="{ query: index === 0 ? {} : { tier: tier.id } }"
              :class="[pill, tier.id === character.logs.tier.id ? pillOn : pillOff]"
              :aria-current="tier.id === character.logs.tier.id ? 'page' : undefined"
            >
              {{ tier.name }}
            </NuxtLink>
          </nav>

          <p v-if="!difficulty" class="mt-6 text-fg-muted">
            No kills logged in {{ character.logs.tier.name }}.
          </p>

          <template v-else>
            <div v-if="character.logs.difficulties.length > 1" class="mt-4 flex flex-wrap gap-2" role="tablist">
              <button
                v-for="d in character.logs.difficulties"
                :key="d.difficulty"
                type="button"
                role="tab"
                :aria-selected="d.difficulty === difficulty.difficulty"
                :class="[pill, 'cursor-pointer', d.difficulty === difficulty.difficulty ? pillOn : pillOff]"
                @click="selectedDifficulty = d.difficulty"
              >
                {{ d.difficulty }}
              </button>
            </div>

            <p class="mt-6 text-sm text-fg-muted">
              <span v-if="difficulty.bestAverage != null">
                Best average
                <span class="font-semibold" :style="{ color: parseColor(difficulty.bestAverage) }">{{ difficulty.bestAverage.toFixed(1) }}</span>
              </span>
              <span v-if="difficulty.medianAverage != null">
                · Median
                <span class="font-semibold" :style="{ color: parseColor(difficulty.medianAverage) }">{{ difficulty.medianAverage.toFixed(1) }}</span>
              </span>
              <span v-if="difficulty.allStars">
                · All Stars {{ Math.round(difficulty.allStars.points) }} of {{ difficulty.allStars.possiblePoints }} points
                ({{ difficulty.allStars.spec }}), rank {{ difficulty.allStars.rank.toLocaleString('en-GB') }} worldwide,
                {{ difficulty.allStars.regionRank.toLocaleString('en-GB') }} in EU, {{ difficulty.allStars.serverRank }} on the realm
              </span>
            </p>

            <div :class="[card, 'mt-4 overflow-x-auto']">
              <table class="w-full min-w-[40rem] text-sm">
                <thead class="border-b border-line">
                  <tr>
                    <th :class="th">Boss</th>
                    <th :class="[th, 'text-right']">Best</th>
                    <th :class="[th, 'text-right']">Median</th>
                    <th :class="[th, 'text-right']">Best {{ metricLabel }}</th>
                    <th :class="[th, 'text-right']">Kills</th>
                    <th :class="[th, 'text-right']">Fastest</th>
                    <th :class="[th, 'text-right']">iLvl</th>
                    <th :class="[th, 'text-right']">Realm rank</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line">
                  <tr v-for="boss in difficulty.bosses" :key="boss.boss">
                    <td :class="[td, 'text-fg']">
                      {{ boss.boss }}
                      <span v-if="boss.spec && boss.bestPercent != null" class="ml-1 text-xs text-fg-subtle">{{ boss.spec }}</span>
                    </td>
                    <td :class="[td, 'text-right font-semibold']" :style="boss.bestPercent != null ? { color: parseColor(boss.bestPercent) } : undefined">
                      {{ boss.bestPercent != null ? Math.floor(boss.bestPercent) : '–' }}
                    </td>
                    <td :class="[td, 'text-right']" :style="boss.medianPercent != null ? { color: parseColor(boss.medianPercent) } : undefined">
                      {{ boss.medianPercent != null ? Math.floor(boss.medianPercent) : '–' }}
                    </td>
                    <td :class="[td, 'text-right text-fg-muted']">{{ boss.bestAmount != null ? compactNumber(boss.bestAmount) : '–' }}</td>
                    <td :class="[td, 'text-right text-fg-muted']">{{ boss.kills }}</td>
                    <td :class="[td, 'text-right text-fg-muted']">{{ boss.fastestKillMs != null ? formatClock(boss.fastestKillMs) : '–' }}</td>
                    <td :class="[td, 'text-right text-fg-muted']">{{ boss.itemLevel ?? '–' }}</td>
                    <td :class="[td, 'text-right text-fg-muted']">{{ boss.serverRank != null ? `#${boss.serverRank}` : '–' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </template>
      </section>

      <!-- Raid nights with the guild -->
      <section v-if="character.raidNights.length" :class="section">
        <SectionHeading class="mb-6">
          Recent raid nights
          <template #end>{{ plural(character.raidNights.length, 'night') }} with the guild</template>
        </SectionHeading>
        <ul :class="[card, 'divide-y divide-line']">
          <li v-for="night in nightsPager.pageItems.value" :key="night.code">
            <NuxtLink
              :to="`/raids/${night.code}`"
              class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4 transition hover:bg-surface-hover"
            >
              <span class="text-fg">{{ night.zone ?? 'Raid night' }}</span>
              <span class="text-sm text-fg-subtle">
                {{ formatDate(night.startedAt) }} · {{ night.spec ? `${night.spec} ` : '' }}{{ roleLabel[night.role] }}
              </span>
            </NuxtLink>
          </li>
        </ul>
        <PagerControls
          :page="nightsPager.page.value"
          :page-count="nightsPager.pageCount.value"
          :has-previous="nightsPager.hasPrevious.value"
          :has-next="nightsPager.hasNext.value"
          @previous="nightsPager.previous"
          @next="nightsPager.next"
        />
      </section>

      <!-- Mythic+ -->
      <section v-if="character.mythicPlus" :class="section">
        <SectionHeading class="mb-6">
          Mythic+
          <template #end>
            Score <span class="font-semibold" :style="{ color: character.mythicPlus.color }">{{ Math.round(character.mythicPlus.score) }}</span>, from Raider.IO
          </template>
        </SectionHeading>

        <p v-if="!character.mythicPlus.bestRuns.length" class="text-fg-muted">No runs this season.</p>
        <div v-else :class="[card, 'overflow-x-auto']">
          <table class="w-full min-w-[32rem] text-sm">
            <thead class="border-b border-line">
              <tr>
                <th :class="th">Dungeon</th>
                <th :class="[th, 'text-right']">Key</th>
                <th :class="[th, 'text-right']">Time</th>
                <th :class="[th, 'text-right']">Score</th>
                <th :class="[th, 'text-right']">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="run in character.mythicPlus.bestRuns" :key="run.url">
                <td :class="[td, 'text-fg']">
                  <a :href="run.url" target="_blank" rel="noopener" class="hover:underline">{{ run.dungeon }}</a>
                </td>
                <td :class="[td, 'text-right', run.upgrades > 0 ? 'text-fg' : 'text-fg-subtle']">
                  +{{ run.level }}<span v-if="run.upgrades > 0" class="text-accent">{{ '+'.repeat(run.upgrades) }}</span>
                </td>
                <td :class="[td, 'text-right text-fg-muted']">
                  {{ formatClock(run.clearTimeMs) }} <span class="text-fg-subtle">/ {{ formatClock(run.parTimeMs) }}</span>
                </td>
                <td :class="[td, 'text-right text-fg-muted']">{{ run.score.toFixed(1) }}</td>
                <td :class="[td, 'text-right text-fg-subtle']">{{ formatDate(run.completedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Gear -->
      <section v-if="character.gear.length" :class="section">
        <SectionHeading class="mb-6">
          Gear
          <template v-if="character.itemLevel" #end>Item level {{ character.itemLevel.toFixed(1) }}, from Raider.IO</template>
        </SectionHeading>
        <ul class="grid gap-2 sm:grid-cols-2">
          <li v-for="(item, index) in character.gear" :key="`${item.slot}-${index}`">
            <a
              :href="wowheadItemUrl(item.itemId)"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-surface"
            >
              <img
                :src="iconUrl(item.icon)"
                alt=""
                class="size-9 shrink-0 rounded-md border"
                :style="{ borderColor: itemQualityColor(item.quality) }"
                width="36"
                height="36"
                loading="lazy"
              >
              <span class="min-w-0">
                <span class="block truncate text-sm font-medium" :style="{ color: itemQualityColor(item.quality) }">{{ item.name }}</span>
                <span class="block text-xs text-fg-subtle">
                  {{ item.slot }} · {{ item.itemLevel }}<template v-if="item.track">
                    · <span :style="{ color: trackColor(item.track) }">{{ item.track }}</span></template>
                </span>
              </span>
            </a>
          </li>
        </ul>
      </section>

      <!-- Raid progression -->
      <section v-if="character.raidProgression.length" :class="section">
        <SectionHeading class="mb-6">
          Raid progression
          <template #end>From Raider.IO</template>
        </SectionHeading>
        <ul :class="[card, 'divide-y divide-line']">
          <li
            v-for="raid in character.raidProgression"
            :key="raid.raid"
            class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4"
          >
            <span class="text-fg">{{ raid.raid }}</span>
            <span class="text-sm tabular-nums text-fg-subtle">
              {{ raid.normal }}/{{ raid.total }} N · {{ raid.heroic }}/{{ raid.total }} H · {{ raid.mythic }}/{{ raid.total }} M
            </span>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

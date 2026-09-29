<script setup lang="ts">
import type { NuxtError } from '#app'

// Only the numeric status is used. The error's message and stack can carry internal
// detail, so they are never rendered.
const { error } = defineProps<{ error: NuxtError }>()

const copy = computed(() => errorCopy(error.statusCode))
const isNotFound = computed(() => error.statusCode === 404)

const SHORTCUTS = [
  { to: '/raids', label: 'Raids' },
  { to: '/roster', label: 'Roster' },
  { to: '/about', label: 'About' },
]

// Same look as AppButton's primary variant, but a real button: it has to clear the
// error state, which a plain link would not.
const homeButton
  = 'inline-block cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition hover:bg-accent-bright'

const handleError = () => clearError({ redirect: '/' })

// error.vue replaces app.vue, so the site's titleTemplate and html lang do not apply here.
useHead({ htmlAttrs: { lang: 'en' }, title: () => `${copy.value.title} · ${SITE_NAME}` })
useSeoMeta({ robots: 'noindex' })
</script>

<template>
  <NuxtLayout>
    <main class="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p class="text-sm text-fg-subtle">Error {{ error.statusCode }}</p>
      <h1 class="mt-2 text-display text-fg">{{ copy.title }}</h1>
      <p class="mt-5 text-lg text-fg-muted">{{ copy.lede }}</p>
      <div class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <button type="button" :class="homeButton" @click="handleError">
          Back to the home page
        </button>
        <ul v-if="isNotFound" class="flex flex-wrap gap-x-6 gap-y-2">
          <li v-for="item in SHORTCUTS" :key="item.to">
            <NuxtLink :to="item.to" class="font-medium text-accent hover:text-accent-bright">
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </main>
  </NuxtLayout>
</template>

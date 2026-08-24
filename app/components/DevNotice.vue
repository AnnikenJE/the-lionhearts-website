<script setup lang="ts">
// Work-in-progress notice: a modal shown once per browser session, plus a
// corner badge that reopens it. Remove this component and its use in
// layouts/default.vue once the site is finished.
const STORAGE_KEY = 'lionhearts:dev-notice-seen'

const open = ref(false)
const dialog = useTemplateRef<HTMLElement>('dialog')

const dismiss = () => {
  open.value = false
  sessionStorage.setItem(STORAGE_KEY, '1')
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && open.value) dismiss()
}

onMounted(() => {
  // sessionStorage is browser-only, so this cannot run during SSR.
  if (sessionStorage.getItem(STORAGE_KEY) !== '1') open.value = true
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

watch(open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  dialog.value?.focus()
})
</script>

<template>
  <div>
    <ClientOnly>
      <Teleport to="body">
        <div
          v-if="open"
          class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          @click.self="dismiss"
        >
          <div
            ref="dialog"
            class="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-2xl focus:outline-none"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dev-notice-title"
            aria-describedby="dev-notice-body"
            tabindex="-1"
          >
            <AppBadge>Heads up</AppBadge>
            <h2 id="dev-notice-title" class="mt-5 text-xl font-semibold text-fg">
              This site is under construction
            </h2>
            <p id="dev-notice-body" class="mt-3 text-fg-muted">
              The Lionhearts website is still being built. Pages, content and
              numbers may be incomplete, placeholder or plain wrong, so please
              don't treat anything here as final yet.
            </p>
            <AppButton class="mt-7 w-full" @click="dismiss">Got it, let me in</AppButton>
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <button
      type="button"
      class="fixed bottom-4 right-4 z-20 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-xs font-medium text-fg-muted shadow-lg backdrop-blur transition hover:border-line-strong hover:text-fg"
      @click="open = true"
    >
      <span class="size-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
      Under construction
    </button>
  </div>
</template>

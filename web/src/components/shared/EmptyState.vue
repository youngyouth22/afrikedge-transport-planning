<script setup lang="ts">
import { Inbox } from '@lucide/vue'

defineProps<{
  title?: string
  description?: string
  actionLabel?: string
}>()

defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
    <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-inner mb-4">
      <Inbox class="h-7 w-7" />
    </div>
    <h3 class="text-base font-bold text-foreground">
      {{ title || 'Aucune donnée disponible' }}
    </h3>
    <p class="mt-1 max-w-sm text-xs text-muted-foreground">
      {{ description || 'Aucun élément ne correspond aux filtres appliqués.' }}
    </p>
    <button
      v-if="actionLabel"
      type="button"
      @click="$emit('action')"
      class="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

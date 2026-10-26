<script setup lang="ts">
import { AlertTriangle, RefreshCw } from '@lucide/vue'

defineProps<{
  title?: string
  message: string
  canRetry?: boolean
}>()

defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
    <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3">
      <AlertTriangle class="h-6 w-6" />
    </div>
    <h3 class="text-sm font-bold text-destructive">
      {{ title || 'Une erreur est survenue' }}
    </h3>
    <p class="mt-1 max-w-md text-xs text-muted-foreground">
      {{ message }}
    </p>
    <button
      v-if="canRetry !== false"
      type="button"
      @click="$emit('retry')"
      class="mt-4 inline-flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-accent transition"
    >
      <RefreshCw class="h-3.5 w-3.5" />
      <span>Réessayer</span>
    </button>
  </div>
</template>

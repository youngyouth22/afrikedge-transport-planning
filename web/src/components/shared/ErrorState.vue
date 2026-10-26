<script setup lang="ts">
import { AlertTriangle, RefreshCw } from '@lucide/vue'
import { Button } from '@/components/ui/button'

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
    <Button
      v-if="canRetry !== false"
      variant="outline"
      class="mt-4 h-[46px] hover:cursor-pointer inline-flex items-center gap-2"
      @click="$emit('retry')"
    >
      <RefreshCw class="h-3.5 w-3.5" />
      <span>Réessayer</span>
    </Button>
  </div>
</template>

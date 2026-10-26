<script setup lang="ts">
import { computed } from 'vue'
import { FileEdit, CheckCircle2, Truck } from '@lucide/vue'

const props = defineProps<{
  status: number
}>()

const badgeConfig = computed(() => {
  switch (props.status) {
    case 0:
      return {
        label: 'Brouillon',
        subtitle: 'Modifiable',
        icon: FileEdit,
        class: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      }
    case 1:
      return {
        label: 'Validé',
        subtitle: 'Verrouillé',
        icon: CheckCircle2,
        class: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      }
    case 2:
      return {
        label: 'Parti',
        subtitle: 'En livraison',
        icon: Truck,
        class: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      }
    default:
      return {
        label: 'Inconnu',
        subtitle: '',
        icon: FileEdit,
        class: 'bg-muted text-muted-foreground border-border',
      }
  }
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-xs"
    :class="badgeConfig.class"
  >
    <component :is="badgeConfig.icon" class="h-3.5 w-3.5 shrink-0" />
    <span>{{ badgeConfig.label }}</span>
  </span>
</template>

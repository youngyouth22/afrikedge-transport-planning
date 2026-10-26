<script setup lang="ts">
import { computed } from 'vue'
import { FileEdit, CheckCircle2, Truck } from '@lucide/vue'
import TableStatusBadge from '@/components/shared/TableStatusBadge.vue'

const props = defineProps<{
  status: number
}>()

const badgeConfig = computed(() => {
  switch (props.status) {
    case 0:
      return {
        label: 'Brouillon',
        icon: FileEdit,
        variant: 'warning' as const,
      }
    case 1:
      return {
        label: 'Validé',
        icon: CheckCircle2,
        variant: 'success' as const,
      }
    case 2:
      return {
        label: 'Parti',
        icon: Truck,
        variant: 'info' as const,
      }
    default:
      return {
        label: 'Inconnu',
        icon: FileEdit,
        variant: 'neutral' as const,
      }
  }
})
</script>

<template>
  <TableStatusBadge :variant="badgeConfig.variant" :icon="badgeConfig.icon">
    {{ badgeConfig.label }}
  </TableStatusBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FileEdit, CheckCircle2, Truck } from '@lucide/vue'
import TableStatusBadge from '@/components/shared/TableStatusBadge.vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  status: number
}>()

const { t } = useI18n()

const badgeConfig = computed(() => {
  switch (props.status) {
    case 0:
      return {
        label: t('status.transportOrder.draft'),
        icon: FileEdit,
        variant: 'warning' as const,
      }
    case 1:
      return {
        label: t('status.transportOrder.validated'),
        icon: CheckCircle2,
        variant: 'success' as const,
      }
    case 2:
      return {
        label: t('status.transportOrder.departed'),
        icon: Truck,
        variant: 'info' as const,
      }
    default:
      return {
        label: t('status.transportOrder.unknown'),
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

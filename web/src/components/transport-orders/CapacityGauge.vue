<script setup lang="ts">
import { computed } from 'vue'
import { Weight, AlertTriangle } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { formatNumber } from '@/i18n'

const props = defineProps<{
  totalWeightKg: number
  capacityKg: number
}>()

const { t } = useI18n()

const fillPercentage = computed(() => {
  if (props.capacityKg <= 0) return 0
  return Math.min(100, Math.round((props.totalWeightKg / props.capacityKg) * 100))
})

const remainingKg = computed(() => {
  return Math.max(0, Math.round((props.capacityKg - props.totalWeightKg) * 100) / 100)
})

const isOver = computed(() => {
  return props.totalWeightKg > props.capacityKg
})

const gaugeColor = computed(() => {
  if (isOver.value) return 'bg-destructive'
  if (fillPercentage.value >= 90) return 'bg-amber-500'
  return 'bg-primary'
})
</script>

<template>
  <div class="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
    <!-- Top Stats -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Weight class="h-5 w-5" />
        </div>
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {{ t('transportOrders.capacityGauge.title') }}
          </h3>
          <div class="text-2xl font-black text-foreground">
            {{ fillPercentage }} % <span class="text-xs font-medium text-muted-foreground">{{ t('transportOrders.capacityGauge.used') }}</span>
          </div>
        </div>
      </div>

      <div class="text-right">
        <div class="text-xs text-muted-foreground">{{ t('transportOrders.capacityGauge.remainingWeight') }}</div>
        <div
          class="text-base font-extrabold"
          :class="isOver ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'"
        >
          {{ formatNumber(remainingKg) }} {{ t('common.kg') }}
        </div>
      </div>
    </div>

    <!-- Visual Progress Bar -->
    <div class="h-4 w-full overflow-hidden bg-muted/80 p-0.5">
      <div
        class="h-full transition-all duration-500 shadow-sm"
        :class="gaugeColor"
        :style="{ width: `${Math.min(100, (totalWeightKg / (capacityKg || 1)) * 100)}%` }"
      />
    </div>

    <!-- Bottom Breakdown -->
    <div class="grid grid-cols-2 gap-4 border-t border-border pt-3 text-xs">
      <div>
        <span class="text-muted-foreground">{{ t('transportOrders.capacityGauge.transportedWeight') }}</span>
        <div class="text-sm font-bold text-foreground">
          {{ formatNumber(totalWeightKg) }} {{ t('common.kg') }}
        </div>
      </div>
      <div class="text-right">
        <span class="text-muted-foreground">{{ t('transportOrders.capacityGauge.maxAllowedLoad') }}</span>
        <div class="text-sm font-bold text-foreground">
          {{ formatNumber(capacityKg) }} {{ t('common.kg') }}
        </div>
      </div>
    </div>

    <div v-if="isOver" class="flex items-center gap-2 rounded-xl bg-destructive/10 p-2 text-xs font-semibold text-destructive">
      <AlertTriangle class="h-4 w-4 shrink-0" />
      <span>{{ t('transportOrders.capacityGauge.warningOverload') }}</span>
    </div>
  </div>
</template>

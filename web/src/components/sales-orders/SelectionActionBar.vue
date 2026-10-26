<script setup lang="ts">
import { useSalesOrdersStore } from '@/stores/sales-orders'
import { PlusCircle, Weight } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'
import { formatNumber } from '@/i18n'

const store = useSalesOrdersStore()
const { t } = useI18n()

defineEmits<{
  (e: 'open-assign-modal'): void
}>()
</script>

<template>
  <Transition
    enter-active-class="transform transition ease-out duration-300"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transform transition ease-in duration-200"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="store.selectedCount > 0"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-full bg-olive-950 px-3 py-3.5 shadow-2xl text-white"
    >
      <!-- Compteur sélection -->
      <div class="flex items-center gap-2 border-r border-slate-800 pr-4">
        <!-- <CheckSquare class="h-5 w-5 text-white" /> -->
        <span class="text-base font-semibold">
          {{ t('salesOrders.selectionBar.count', { n: store.selectedCount }, store.selectedCount) }}
        </span>
      </div>

      <!-- Poids cumulé -->
      <div class="flex items-center gap-2 border-r border-slate-800 pr-4">
        <Weight class="h-5 w-5 text-white" />
        <div class="flex items-baseline gap-1">
          <span class="text-base text-white">{{ t('salesOrders.selectionBar.totalWeight') }}</span>
          <strong class="text-sm font-bold text-white tracking-wide">
            {{ formatNumber(store.selectedTotalWeight) }}
          </strong>
          <span class="text-xs text-emerald-400 font-medium">{{ t('common.kg') }}</span>
        </div>
      </div>

      <!-- Bouton Annuler sélection -->
      <Button
        variant="ghost"
        @click="store.clearSelection()"
        class="h-11.5 hover:cursor-pointer text-base"
        :title="t('salesOrders.selectionBar.deselectAllTitle')"
      >
        <span class="hidden sm:inline">{{ t('salesOrders.selectionBar.cancel') }}</span>
      </Button>

      <!-- Action Button -->
      <Button
        @click="$emit('open-assign-modal')"
        class="h-11.5 px-4 text-base hover:cursor-pointer rounded-full"
      >
        <PlusCircle class="h-4 w-4" />
        <span>{{ t('salesOrders.selectionBar.addToTransport') }}</span>
      </Button>
    </div>
  </Transition>
</template>

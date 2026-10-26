<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { salesOrdersApi, type SalesOrderToPlan } from '@/api/sales-orders.api'
import { transportOrdersApi } from '@/api/transport-orders.api'
import { toast } from 'vue-sonner'
import { useI18n } from 'vue-i18n'
import { formatNumber } from '@/i18n'
import { getLocalizedErrorMessage } from '@/lib/error-translator'
import {
  AlertTriangle,
  Loader2,
  CheckCircle2,
  MapPin,
  Inbox,
  FileText,
} from '@lucide/vue'
import TablePill from '@/components/shared/TablePill.vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  open: boolean
  transportNo: string
  currentWeightKg: number
  capacityKg: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const { t } = useI18n()
const availableOrders = ref<SalesOrderToPlan[]>([])
const selectedNos = ref<Set<string>>(new Set())
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

watch(
  () => props.open,
  (val) => {
    if (val) {
      selectedNos.value = new Set()
      errorMessage.value = null
      loadOrders()
    }
  },
)

async function loadOrders() {
  isLoading.value = true
  try {
    const res = await salesOrdersApi.getToPlan(undefined, 1, 100)
    availableOrders.value = res.data
  } catch (err: any) {
    errorMessage.value = getLocalizedErrorMessage(err)
  } finally {
    isLoading.value = false
  }
}

function onOpenChange(val: boolean) {
  if (!val) {
    emit('close')
  }
}

function toggleSelect(no: string) {
  const next = new Set(selectedNos.value)
  if (next.has(no)) next.delete(no)
  else next.add(no)
  selectedNos.value = next
}

const selectedOrders = computed(() => {
  return availableOrders.value.filter((o) => selectedNos.value.has(o.salesOrderNo))
})

const additionalWeightKg = computed(() => {
  const sum = selectedOrders.value.reduce((acc, o) => acc + o.totalWeightKg, 0)
  return Math.round(sum * 100) / 100
})

const newTotalWeightKg = computed(() => {
  return props.currentWeightKg + additionalWeightKg.value
})

const isOverCapacity = computed(() => {
  return newTotalWeightKg.value > props.capacityKg
})

async function handleConfirm() {
  if (selectedNos.value.size === 0) {
    toast.error(t('transportOrders.addLinesModal.selectAtLeastOne'))
    return
  }

  if (isOverCapacity.value) {
    toast.error(t('transportOrders.addLinesModal.capacityExceeded'))
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    const ids = Array.from(selectedNos.value)
    await transportOrdersApi.addLines(props.transportNo, ids)

    toast.success(
      t('transportOrders.addLinesModal.success', { count: ids.length }, ids.length),
    )
    emit('success')
    emit('close')
  } catch (err: any) {
    errorMessage.value = getLocalizedErrorMessage(err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] flex flex-col p-6 gap-5">
      <!-- Header -->
      <DialogHeader class="border-b border-border pb-4 shrink-0 text-left">
        <div class="flex items-center gap-3">
          <div>
            <DialogTitle class="text-2xl font-bold text-foreground">
              {{ t('transportOrders.addLinesModal.title', { no: transportNo }) }}
            </DialogTitle>
            <DialogDescription class="textbase text-muted-foreground mt-0.5">
              {{ t('transportOrders.addLinesModal.description') }}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <!-- Erreur si présente -->
      <div
        v-if="errorMessage"
        class="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive shrink-0"
      >
        <AlertTriangle class="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <span class="font-bold">{{ t('common.errorOccurred') }} : </span>
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <!-- Live Capacity Summary -->
      <div class="rounded-2xl border border-border p-3.5 space-y-2 shrink-0">
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">{{ t('transportOrders.addLinesModal.selectedWeight') }}</span>
          <strong class="text-foreground">+{{ formatNumber(additionalWeightKg) }} {{ t('common.kg') }}</strong>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">{{ t('transportOrders.addLinesModal.newTotalWeight') }}</span>
          <strong :class="isOverCapacity ? 'text-destructive font-black' : 'text-foreground'">
            {{ formatNumber(newTotalWeightKg) }} / {{ formatNumber(capacityKg) }} {{ t('common.kg') }}
          </strong>
        </div>
        <div class="h-2 w-full overflow-hidden bg-muted">
          <div
            class="h-full transition-all duration-300"
            :class="isOverCapacity ? 'bg-destructive' : 'bg-primary'"
            :style="{ width: `${Math.min(100, (newTotalWeightKg / (capacityKg || 1)) * 100)}%` }"
          />
        </div>
        <div v-if="isOverCapacity" class="text-[14px] font-medium text-destructive flex items-center gap-1">
          <AlertTriangle class="h-3.5 w-3.5" />
          <span>{{ t('transportOrders.addLinesModal.overCapacityWarning', { weight: formatNumber(newTotalWeightKg - capacityKg) }) }} {{ t('common.kg') }}</span>
        </div>
      </div>

      <!-- Orders List Scrollable -->
      <div class="flex-1 overflow-y-auto min-h-55 rounded-2xl border border-border divide-y divide-border">
        <div v-if="isLoading" class="p-8 text-center text-xs text-muted-foreground">
          {{ t('transportOrders.addLinesModal.loading') }}
        </div>
        <Empty
          v-else-if="availableOrders.length === 0"
          class="border border-dashed p-6 my-4 mx-4"
        >
          <EmptyHeader>
            <EmptyMedia variant="icon" class="size-18 rounded-2xl mb-3">
              <Inbox class="size-7 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{{ t('transportOrders.addLinesModal.emptyTitle') }}</EmptyTitle>
            <EmptyDescription>
              {{ t('transportOrders.addLinesModal.emptyDesc') }}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
        <div
          v-for="order in availableOrders"
          :key="order.salesOrderNo"
          @click="toggleSelect(order.salesOrderNo)"
          class="flex items-center justify-between p-3.5 hover:bg-accent/40 cursor-pointer transition text-xs"
          :class="{ 'bg-emerald-500/10 dark:bg-emerald-950/30': selectedNos.has(order.salesOrderNo) }"
        >
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              :checked="selectedNos.has(order.salesOrderNo)"
              @click.stop="toggleSelect(order.salesOrderNo)"
              class="w-5 h-5 border border-Mgray400! rounded-lg accent-emerald-600 cursor-pointer"
            />
            <div class="flex items-center gap-2.5">
              <div class="h-8 w-8 rounded-full bg-Msurfacesurfacesecondary border border-Mborderborderprimary! flex items-center justify-center shrink-0">
                <FileText class="h-3.5 w-3.5 text-Mtexttextsecondary" />
              </div>
              <div>
                <div class="font-medium text__16 text-Mtexttextprimary">{{ order.salesOrderNo }}</div>
                <div class="text-xs text-Mtexttextsecondary">{{ order.customerName }}</div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <TablePill :icon="MapPin" icon-class="text-Mmaincolorgreen">
              {{ order.deliveryCity }}
            </TablePill>
            <div class="font-medium text__14 text-Mtexttextprimary">
              {{ formatNumber(order.totalWeightKg) }} {{ t('common.kg') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <DialogFooter class="bg-transparent p-0 m-0 rounded-none border-0 flex flex-row items-center justify-between sm:justify-between w-full shrink-0">
        <div class="text-muted-foreground">
          {{ t('transportOrders.addLinesModal.selectedOrdersCount', { count: selectedNos.size }, selectedNos.size) }}
        </div>
        <div class="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            class="h-11.5 px-5 hover:cursor-pointer"
            @click="$emit('close')"
          >
            {{ t('transportOrders.addLinesModal.cancel') }}
          </Button>
          <Button
            type="button"
            variant="default"
            class="h-11.5 px-5 hover:cursor-pointer inline-flex items-center gap-2"
            :disabled="isSubmitting || selectedNos.size === 0 || isOverCapacity"
            @click="handleConfirm"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            <CheckCircle2 v-else class="h-4 w-4" />
            <span>{{ isSubmitting ? t('transportOrders.addLinesModal.adding') : t('transportOrders.addLinesModal.addOrders') }}</span>
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

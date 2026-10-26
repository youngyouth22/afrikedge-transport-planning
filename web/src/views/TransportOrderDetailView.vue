<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import TransportStatusBadge from '@/components/transport-orders/TransportStatusBadge.vue'
import CapacityGauge from '@/components/transport-orders/CapacityGauge.vue'
import AddLinesModal from '@/components/transport-orders/AddLinesModal.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import DataTableCustom from '@/components/shared/DataTableCustom.vue'
import TablePill from '@/components/shared/TablePill.vue'
import TableStatusBadge from '@/components/shared/TableStatusBadge.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { transportOrdersApi, type TransportOrderDetail } from '@/api/transport-orders.api'
import { useUserStore } from '@/stores/user'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { toast } from 'vue-sonner'
import { useI18n } from 'vue-i18n'
import { formatNumber, formatDate } from '@/i18n'
import { getLocalizedErrorMessage } from '@/lib/error-translator'
import {
  Truck,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Navigation,
  Loader2,
  Boxes,
  MapPin,
  FileText,
} from '@lucide/vue'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Button } from '@/components/ui/button'

const route = useRoute()
const userStore = useUserStore()
const { confirm, confirmDialogProps, handleConfirm, handleCancel } = useConfirmDialog()
const { t } = useI18n()

const orderNo = String(route.params.no || '')
const order = ref<TransportOrderDetail | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const isAddLinesModalOpen = ref(false)
const isActionLoading = ref(false)

onMounted(() => {
  fetchDetail()
})

async function fetchDetail() {
  if (!orderNo) return
  isLoading.value = true
  error.value = null
  try {
    order.value = await transportOrdersApi.getOne(orderNo)
  } catch (err: any) {
    error.value = getLocalizedErrorMessage(err)
  } finally {
    isLoading.value = false
  }
}

async function handleRemoveLine(salesOrderNo: string) {
  if (!order.value || order.value.status !== 0) return

  const confirmed = await confirm({
    title: t('transportOrders.detail.confirmRemove.title'),
    description: t('transportOrders.detail.confirmRemove.description', { no: salesOrderNo }),
    confirmText: t('transportOrders.detail.confirmRemove.confirm'),
    cancelText: t('transportOrders.detail.confirmRemove.cancel'),
    confirmVariant: 'destructive',
    variant: 'destructive',
    icon: Trash2,
  })
  if (!confirmed) return

  isActionLoading.value = true
  try {
    await transportOrdersApi.removeLine(orderNo, salesOrderNo)
    toast.success(t('transportOrders.detail.confirmRemove.success', { no: salesOrderNo }))
    await fetchDetail()
  } catch (err: any) {
    toast.error(getLocalizedErrorMessage(err))
  } finally {
    isActionLoading.value = false
  }
}

async function handleValidate() {
  if (!order.value || order.value.status !== 0) return

  if (!userStore.isLogisticsManager) {
    return
  }

  if (order.value.orders.length === 0) {
    toast.error(t('transportOrders.detail.confirmValidate.cannotValidateEmpty'), {
      description: t('transportOrders.detail.confirmValidate.cannotValidateEmptyDesc'),
    })
    return
  }

  const confirmed = await confirm({
    title: t('transportOrders.detail.confirmValidate.title'),
    description: t('transportOrders.detail.confirmValidate.description', { no: orderNo }),
    confirmText: t('transportOrders.detail.confirmValidate.confirm'),
    cancelText: t('transportOrders.detail.confirmValidate.cancel'),
    confirmVariant: 'default',
    variant: 'default',
    icon: CheckCircle2,
  })
  if (!confirmed) return

  isActionLoading.value = true
  try {
    await transportOrdersApi.validate(orderNo)
    toast.success(t('transportOrders.detail.confirmValidate.success', { no: orderNo }), {
      description: t('transportOrders.detail.confirmValidate.successDesc'),
    })
    await fetchDetail()
  } catch (err: any) {
    toast.error(getLocalizedErrorMessage(err))
  } finally {
    isActionLoading.value = false
  }
}

async function handleDepart() {
  if (!order.value || order.value.status !== 1) return

  const confirmed = await confirm({
    title: t('transportOrders.detail.confirmDepart.title'),
    description: t('transportOrders.detail.confirmDepart.description', { no: orderNo }),
    confirmText: t('transportOrders.detail.confirmDepart.confirm'),
    cancelText: t('transportOrders.detail.confirmDepart.cancel'),
    confirmVariant: 'default',
    variant: 'default',
    icon: Navigation,
  })
  if (!confirmed) return

  isActionLoading.value = true
  try {
    await transportOrdersApi.depart(orderNo)
    toast.success(t('transportOrders.detail.confirmDepart.success', { no: orderNo }), {
      description: t('transportOrders.detail.confirmDepart.successDesc'),
    })
    await fetchDetail()
  } catch (err: any) {
    toast.error(getLocalizedErrorMessage(err))
  } finally {
    isActionLoading.value = false
  }
}

const statusLabel = computed(() => {
  if (!order.value) return ''
  if (order.value.status === 0) return t('status.transportOrder.draftEditable')
  if (order.value.status === 1) return t('status.transportOrder.validatedLocked')
  return t('status.transportOrder.departedInDelivery')
})
</script>

<template>
  <AppLayout
    :breadcrumbs="[
      { label: t('transportOrders.title'), to: '/transport-orders' },
      { label: orderNo },
    ]"
  >
    <div v-if="isLoading" class="p-12 text-center text-xs text-muted-foreground">
      <Loader2 class="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
      <span>{{ t('transportOrders.detail.loading') }}</span>
    </div>

    <ErrorState
      v-else-if="error || !order"
      :message="error || t('transportOrders.detail.notFound')"
      @retry="fetchDetail()"
    />

    <div v-else class="space-y-8 max-w-7xl mx-auto">
      <!-- En-tête Principal & Actions -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div class="space-y-1">
          <div class="flex items-center gap-3">
            <h2 class="text-3xl font-black tracking-tight text-foreground">
              {{ order.no }}
            </h2>
            <TransportStatusBadge :status="order.status" />
          </div>
          <p class="text-xs text-muted-foreground">
            {{ t('transportOrders.detail.createdBy') }} <strong class="text-foreground">{{ order.createdBy }}</strong>
            <template v-if="order.validatedBy">
              · {{ t('transportOrders.detail.validatedBy') }} <strong class="text-foreground">{{ order.validatedBy }}</strong>
            </template>
          </p>
        </div>

        <!-- Boutons d'Action selon le Statut et le Rôle -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Si BROUILLON (0) -->
          <template v-if="order.status === 0">
            <!-- Bouton Ajouter des commandes -->
            <Button
              variant="outline"
              @click="isAddLinesModalOpen = true"
              :disabled="isActionLoading"
              class="h-11.5 px-4 cursor-pointer"
            >
              <Plus class="h-4 w-4" />
              <span>{{ t('transportOrders.detail.addOrders') }}</span>
            </Button>

            <!-- Bouton Valider l'ordre - Masqué si Dispatcher n'a pas le droit -->
            <Button
              v-if="userStore.isLogisticsManager"
              variant="default"
              @click="handleValidate"
              :disabled="isActionLoading || order.orders.length === 0"
              class="h-11.5 px-4 cursor-pointer"
            >
              <Loader2 v-if="isActionLoading" class="h-4 w-4 animate-spin" />
              <CheckCircle2 v-else class="h-4 w-4" />
              <span>{{ t('transportOrders.detail.validateOrder') }}</span>
            </Button>
          </template>

          <!-- Si VALIDÉ (1) -->
          <template v-else-if="order.status === 1">
            <Button
              variant="default"
              @click="handleDepart"
              :disabled="isActionLoading"
              class="h-11.5 px-5 hover:cursor-pointer"
            >
              <Loader2 v-if="isActionLoading" class="h-4 w-4 animate-spin" />
              <Navigation v-else class="h-4 w-4" />
              <span>{{ t('transportOrders.detail.confirmDepart') }}</span>
            </Button>
          </template>

          <!-- Si PARTI (2) -->
          <template v-else>
            <div class="inline-flex items-center gap-2 rounded bg-blue-500/10 border border-blue-500/20 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Truck class="h-4 w-4" />
              <span>{{ t('transportOrders.detail.departedBadge') }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Synthèse Cartes : Véhicule, Livraison, Jauge -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Carte Véhicule -->
        <div class="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
          <div class="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <Truck class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{{ t('transportOrders.detail.assignedVehicle') }}</span>
          </div>
          <div>
            <div class="text-2xl font-black text-foreground">{{ order.vehicleCode }}</div>
            <div class="text-xs font-mono text-muted-foreground font-semibold mt-0.5">
              {{ t('transportOrders.detail.plateNo', { plate: order.vehiclePlateNo }) }}
            </div>
          </div>
          <div class="border-t border-border pt-3 text-xs text-muted-foreground flex justify-between">
            <span>{{ t('transportOrders.detail.ratedCapacity') }}</span>
            <strong class="text-foreground">{{ formatNumber(order.vehicleCapacityKg) }} {{ t('common.kg') }}</strong>
          </div>
        </div>

        <!-- Carte Livraison & Supervision -->
        <div class="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
          <div class="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <Calendar class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{{ t('transportOrders.detail.planning') }}</span>
          </div>
          <div>
            <div class="text-2xl font-black text-foreground">{{ formatDate(order.deliveryDate) }}</div>
            <div class="text-xs text-muted-foreground font-semibold mt-0.5">
              {{ t('transportOrders.detail.scheduledDeliveryDate') }}
            </div>
          </div>
          <div class="border-t border-border pt-3 text-xs text-muted-foreground flex justify-between">
            <span>{{ t('transportOrders.detail.currentState') }}</span>
            <strong class="text-foreground">
              {{ statusLabel }}
            </strong>
          </div>
        </div>

        <!-- Jauge de Remplissage Dynamique -->
        <CapacityGauge
          :total-weight-kg="order.totalWeightKg"
          :capacity-kg="order.vehicleCapacityKg"
        />
      </div>

      <!-- Tableau des Commandes Affectées -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Boxes class="h-5 w-5 text-primary" />
            <h3 class="text-lg font-bold text-foreground">
              {{ t('transportOrders.detail.transportedOrders', { count: order.orders.length }) }}
            </h3>
          </div>
          <div class="text-xs font-bold text-muted-foreground">
            {{ t('transportOrders.detail.totalCumulativeWeight') }} <span class="text-foreground font-black">{{ formatNumber(order.totalWeightKg) }} {{ t('common.kg') }}</span>
          </div>
        </div>

        <!-- Empty State shadcn -->
        <Empty v-if="order.orders.length === 0" class="border border-dashed p-10">
          <EmptyHeader>
            <EmptyMedia variant="icon" class="size-18 rounded-2xl mb-3">
              <Boxes class="size-7 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>{{ t('transportOrders.detail.emptyOrdersTitle') }}</EmptyTitle>
            <EmptyDescription>
              {{ t('transportOrders.detail.emptyOrdersDesc') }}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent v-if="order.status === 0">
            <Button
              variant="default"
              class="h-11.5 hover:cursor-pointer"
              @click="isAddLinesModalOpen = true"
            >
              <Plus class="h-4 w-4" />
              <span>{{ t('transportOrders.detail.addOrders') }}</span>
            </Button>
          </EmptyContent>
        </Empty>

        <div v-else class="overflow-hidden border border-Mborderborderprimary! bg-card shadow-xs">
          <DataTableCustom>
            <template #header>
              <tr>
                <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
                  {{ t('transportOrders.detail.lineTable.order') }}
                </th>
                <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
                  {{ t('transportOrders.detail.lineTable.customer') }}
                </th>
                <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
                  {{ t('transportOrders.detail.lineTable.city') }}
                </th>
                <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider text-right">
                  {{ t('transportOrders.detail.lineTable.weight') }}
                </th>
                <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider text-center">
                  {{ t('transportOrders.detail.lineTable.status') }}
                </th>
                <th v-if="order.status === 0" class="w-16 px-5 py-3.5 text-right"></th>
              </tr>
            </template>

            <tr
              v-for="line in order.orders"
              :key="line.salesOrderNo"
              class="hover:bg-accent/40 transition-colors"
            >
              <!-- Numéro -->
              <td class="px-5 py-3">
                <div class="flex items-center gap-3">
                  <div class="h-9 w-9 rounded-full bg-Msurfacesurfacesecondary border border-Mborderborderprimary! flex items-center justify-center shrink-0">
                    <FileText class="h-4 w-4 text-Mtexttextsecondary" />
                  </div>
                  <div>
                    <h5 class="font-medium text__16 text-Mtexttextprimary">{{ line.salesOrderNo }}</h5>
                    <p class="text__14 text-Mtexttextsecondary">{{ t('transportOrders.detail.lineTable.lineLabel') }}</p>
                  </div>
                </div>
              </td>

              <!-- Client -->
              <td class="px-5 py-3">
                <div class="font-medium text__14 text-Mtexttextprimary">{{ line.customerName }}</div>
                <div class="text-xs text-Mtexttextsecondary">{{ t('transportOrders.detail.lineTable.customerCode', { code: line.customerNo }) }}</div>
              </td>

              <!-- Ville -->
              <td class="px-5 py-3">
                <TablePill :icon="MapPin" icon-class="text-Mmaincolorgreen">
                  {{ line.deliveryCity }}
                </TablePill>
              </td>

              <!-- Poids -->
              <td class="px-5 py-3 text-right">
                <span class="font-medium text__14 text-Mtexttextprimary">
                  {{ formatNumber(line.totalWeightKg, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) }} {{ t('common.kg') }}
                </span>
              </td>

              <!-- Statut de la commande -->
              <td class="px-5 py-3 text-center">
                <TableStatusBadge :variant="line.status === 1 ? 'warning' : 'info'">
                  {{ line.status === 1 ? t('status.salesOrder.planned') : t('status.salesOrder.inDelivery') }}
                </TableStatusBadge>
              </td>

              <!-- Action Retrait (si brouillon) -->
              <td v-if="order.status === 0" class="px-5 py-3 text-right">
                <Button
                  variant="outline"
                  size="icon"
                  @click="handleRemoveLine(line.salesOrderNo)"
                  :disabled="isActionLoading"
                  :title="t('transportOrders.detail.lineTable.removeLineTitle')"
                  class="h-8 w-8 text-muted-foreground hover:text-destructive hover:border-destructive/40 cursor-pointer"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </td>
            </tr>
          </DataTableCustom>
        </div>
      </div>

      <!-- Dialogue d'ajout de commandes à ce transport -->
      <AddLinesModal
        :open="isAddLinesModalOpen"
        :transport-no="order.no"
        :current-weight-kg="order.totalWeightKg"
        :capacity-kg="order.vehicleCapacityKg"
        @close="isAddLinesModalOpen = false"
        @success="fetchDetail"
      />

      <!-- Dialogue de confirmation réutilisable Alert / AlertDialog -->
      <ConfirmDialog
        v-bind="confirmDialogProps"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
import { Button } from '@/components/ui/button'

const route = useRoute()
const userStore = useUserStore()
const { confirm, confirmDialogProps, handleConfirm, handleCancel } = useConfirmDialog()

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
    error.value = err.message || "Impossible de charger le détail de l'ordre de transport."
  } finally {
    isLoading.value = false
  }
}

async function handleRemoveLine(salesOrderNo: string) {
  if (!order.value || order.value.status !== 0) return

  const confirmed = await confirm({
    title: 'Retirer la commande',
    description: `Êtes-vous sûr de vouloir retirer la commande ${salesOrderNo} de cet ordre ? Elle repassera au statut "À planifier".`,
    confirmText: "Retirer de l'ordre",
    confirmVariant: 'destructive',
    variant: 'destructive',
    icon: Trash2,
  })
  if (!confirmed) return

  isActionLoading.value = true
  try {
    await transportOrdersApi.removeLine(orderNo, salesOrderNo)
    toast.success(`Commande ${salesOrderNo} retirée avec succès.`)
    await fetchDetail()
  } catch (err: any) {
    toast.error(err.message || "Erreur lors du retrait de la commande.")
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
    toast.error('Validation impossible', {
      description: "Un ordre de transport doit contenir au moins une commande pour être validé.",
    })
    return
  }

  const confirmed = await confirm({
    title: "Valider l'ordre de transport",
    description: `Êtes-vous sûr de vouloir valider l'ordre ${orderNo} ? Une fois validé, il sera verrouillé contre toute modification et prêt pour le départ.`,
    confirmText: "Valider l'ordre",
    confirmVariant: 'default',
    variant: 'default',
    icon: CheckCircle2,
  })
  if (!confirmed) return

  isActionLoading.value = true
  try {
    await transportOrdersApi.validate(orderNo)
    toast.success(`L'ordre ${orderNo} a été validé avec succès !`, {
      description: "L'ordre est désormais verrouillé et prêt pour le départ.",
    })
    await fetchDetail()
  } catch (err: any) {
    toast.error(err.message || "Erreur lors de la validation de l'ordre.")
  } finally {
    isActionLoading.value = false
  }
}

async function handleDepart() {
  if (!order.value || order.value.status !== 1) return

  const confirmed = await confirm({
    title: 'Confirmer le départ du véhicule',
    description: `Confirmer le départ du véhicule pour l'ordre ${orderNo} ? Les commandes associées passeront au statut "En livraison".`,
    confirmText: 'Confirmer le départ',
    confirmVariant: 'default',
    variant: 'default',
    icon: Navigation,
  })
  if (!confirmed) return

  isActionLoading.value = true
  try {
    await transportOrdersApi.depart(orderNo)
    toast.success(`Le transport ${orderNo} est marqué comme Parti !`, {
      description: 'Toutes les commandes sont désormais en cours de livraison.',
    })
    await fetchDetail()
  } catch (err: any) {
    toast.error(err.message || "Erreur lors du départ du transport.")
  } finally {
    isActionLoading.value = false
  }
}
</script>

<template>
  <AppLayout
    :breadcrumbs="[
      { label: 'Ordres de transport', to: '/transport-orders' },
      { label: orderNo },
    ]"
  >
    <div v-if="isLoading" class="p-12 text-center text-xs text-muted-foreground">
      <Loader2 class="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
      <span>Chargement du détail de l'ordre...</span>
    </div>

    <ErrorState
      v-else-if="error || !order"
      :message="error || 'Ordre introuvable.'"
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
            Créé par <strong class="text-foreground">{{ order.createdBy }}</strong>
            <template v-if="order.validatedBy">
              · Validé par <strong class="text-foreground">{{ order.validatedBy }}</strong>
            </template>
          </p>
        </div>

        <!-- Boutons d'Action selon le Statut et le Rôle -->
        <div class="flex flex-wrap items-center gap-3">
          <!-- Si BROUILLON (0) -->
          <template v-if="order.status === 0">
            <!-- Bouton Ajouter des commandes (Outline, action secondaire) -->
            <Button
              variant="outline"
              @click="isAddLinesModalOpen = true"
              :disabled="isActionLoading"
              class="h-[46px] px-4 cursor-pointer"
            >
              <Plus class="h-4 w-4" />
              <span>Ajouter des commandes</span>
            </Button>

            <!-- Bouton Valider l'ordre (Default, action principale) - Masqué si Diane n'a pas le droit -->
            <Button
              v-if="userStore.isLogisticsManager"
              variant="default"
              @click="handleValidate"
              :disabled="isActionLoading || order.orders.length === 0"
              class="h-[46px] px-4 cursor-pointer"
            >
              <Loader2 v-if="isActionLoading" class="h-4 w-4 animate-spin" />
              <CheckCircle2 v-else class="h-4 w-4" />
              <span>Valider l'ordre</span>
            </Button>
          </template>

          <!-- Si VALIDÉ (1) -->
          <template v-else-if="order.status === 1">
            <Button
              variant="default"
              @click="handleDepart"
              :disabled="isActionLoading"
              class="h-11.5 px-5 cursor-pointer"
            >
              <Loader2 v-if="isActionLoading" class="h-4 w-4 animate-spin" />
              <Navigation v-else class="h-4 w-4" />
              <span>Confirmer le départ</span>
            </Button>
          </template>

          <!-- Si PARTI (2) -->
          <template v-else>
            <div class="inline-flex items-center gap-2 rounded bg-blue-500/10 border border-blue-500/20 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Truck class="h-4 w-4" />
              <span>Transport parti en livraison</span>
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
            <span>Véhicule affecté</span>
          </div>
          <div>
            <div class="text-2xl font-black text-foreground">{{ order.vehicleCode }}</div>
            <div class="text-xs font-mono text-muted-foreground font-semibold mt-0.5">
              Immatriculation : {{ order.vehiclePlateNo }}
            </div>
          </div>
          <div class="border-t border-border pt-3 text-xs text-muted-foreground flex justify-between">
            <span>Capacité nominale :</span>
            <strong class="text-foreground">{{ order.vehicleCapacityKg.toLocaleString('fr-FR') }} kg</strong>
          </div>
        </div>

        <!-- Carte Livraison & Supervision -->
        <div class="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
          <div class="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <Calendar class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Planification</span>
          </div>
          <div>
            <div class="text-2xl font-black text-foreground">{{ order.deliveryDate }}</div>
            <div class="text-xs text-muted-foreground font-semibold mt-0.5">
              Date de livraison prévue
            </div>
          </div>
          <div class="border-t border-border pt-3 text-xs text-muted-foreground flex justify-between">
            <span>État actuel :</span>
            <strong class="text-foreground">
              {{ order.status === 0 ? 'Brouillon (Modifiable)' : order.status === 1 ? 'Validé (Verrouillé)' : 'Parti (En livraison)' }}
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
              Commandes transportées ({{ order.orders.length }})
            </h3>
          </div>
          <div class="text-xs font-bold text-muted-foreground">
            Poids total cumulé : <span class="text-foreground font-black">{{ order.totalWeightKg.toLocaleString('fr-FR') }} kg</span>
          </div>
        </div>

        <div class="overflow-hidden border border-Mborderborderprimary! bg-card shadow-xs">
          <div v-if="order.orders.length === 0" class="p-12 text-center space-y-3">
            <Boxes class="h-10 w-10 text-muted-foreground mx-auto" />
            <div class="text-sm font-bold text-foreground">Aucune commande affectée à cet ordre</div>
            <p class="text-xs text-muted-foreground max-w-sm mx-auto">
              Cet ordre est un brouillon vide. Ajoutez des commandes pour pouvoir le valider et planifier la tournée.
            </p>
            <Button
              v-if="order.status === 0"
              variant="default"
              @click="isAddLinesModalOpen = true"
              class="cursor-pointer"
            >
              <Plus class="h-4 w-4" />
              <span>Ajouter des commandes</span>
            </Button>
          </div>

          <DataTableCustom v-else>
            <template #header>
              <tr>
                <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
                  Commande
                </th>
                <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
                  Client
                </th>
                <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
                  Ville
                </th>
                <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider text-right">
                  Poids
                </th>
                <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider text-center">
                  Statut
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
                    <p class="text__14 text-Mtexttextsecondary">Ligne transport</p>
                  </div>
                </div>
              </td>

              <!-- Client -->
              <td class="px-5 py-3">
                <div class="font-medium text__14 text-Mtexttextprimary">{{ line.customerName }}</div>
                <div class="text-xs text-Mtexttextsecondary">Code : {{ line.customerNo }}</div>
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
                  {{ line.totalWeightKg.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) }} kg
                </span>
              </td>

              <!-- Statut de la commande -->
              <td class="px-5 py-3 text-center">
                <TableStatusBadge :variant="line.status === 1 ? 'warning' : 'info'">
                  {{ line.status === 1 ? 'Planifiée' : 'En livraison' }}
                </TableStatusBadge>
              </td>

              <!-- Action Retrait (si brouillon) -->
              <td v-if="order.status === 0" class="px-5 py-3 text-right">
                <Button
                  variant="outline"
                  size="icon"
                  @click="handleRemoveLine(line.salesOrderNo)"
                  :disabled="isActionLoading"
                  title="Retirer du transport"
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

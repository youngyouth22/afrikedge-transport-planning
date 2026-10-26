<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import TransportStatusBadge from '@/components/transport-orders/TransportStatusBadge.vue'
import CapacityGauge from '@/components/transport-orders/CapacityGauge.vue'
import AddLinesModal from '@/components/transport-orders/AddLinesModal.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import { transportOrdersApi, type TransportOrderDetail } from '@/api/transport-orders.api'
import { useUserStore } from '@/stores/user'
import { toast } from 'vue-sonner'
import {
  Truck,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Navigation,
  ShieldAlert,
  Loader2,
  Boxes,
  MapPin,
} from '@lucide/vue'

const route = useRoute()
const userStore = useUserStore()

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

  const confirmed = window.confirm(
    `Êtes-vous sûr de vouloir retirer la commande ${salesOrderNo} de cet ordre ? Elle repassera au statut "À planifier".`,
  )
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
    toast.error('Action interdite', {
      description: 'Seul un Responsable Logistique (Eric) est habilité à valider un ordre de transport.',
    })
    return
  }

  if (order.value.orders.length === 0) {
    toast.error('Validation impossible', {
      description: "Un ordre de transport doit contenir au moins une commande pour être validé.",
    })
    return
  }

  isActionLoading.value = true
  try {
    await transportOrdersApi.validate(orderNo)
    toast.success(`L'ordre ${orderNo} a été validé avec succès !`, {
      description: 'L\'ordre est désormais verrouillé et prêt pour le départ.',
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

  const confirmed = window.confirm(
    `Confirmer le départ du véhicule pour l'ordre ${orderNo} ? Les commandes associées passeront au statut "En livraison".`,
  )
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
            <!-- Bouton Ajouter des commandes -->
            <button
              type="button"
              @click="isAddLinesModalOpen = true"
              :disabled="isActionLoading"
              class="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-sm hover:bg-accent transition"
            >
              <Plus class="h-4 w-4" />
              <span>Ajouter des commandes</span>
            </button>

            <!-- Bouton Valider l'ordre -->
            <div class="relative group">
              <button
                type="button"
                @click="handleValidate"
                :disabled="isActionLoading || !userStore.isLogisticsManager || order.orders.length === 0"
                class="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold shadow transition"
                :class="[
                  userStore.isLogisticsManager && order.orders.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    : 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed',
                ]"
              >
                <Loader2 v-if="isActionLoading" class="h-4 w-4 animate-spin" />
                <CheckCircle2 v-else class="h-4 w-4" />
                <span>Valider l'ordre</span>
              </button>

              <!-- Infobulle explicative si Diane -->
              <div
                v-if="!userStore.isLogisticsManager"
                class="absolute right-0 top-full mt-2 hidden w-56 rounded-xl border border-border bg-popover p-2 text-[11px] text-popover-foreground shadow-lg group-hover:block z-20"
              >
                <div class="flex items-center gap-1.5 font-bold text-amber-500 mb-1">
                  <ShieldAlert class="h-3.5 w-3.5" />
                  <span>Validation restreinte</span>
                </div>
                Seul un Responsable Logistique (Eric) a la permission de valider cet ordre.
              </div>
            </div>
          </template>

          <!-- Si VALIDÉ (1) -->
          <template v-else-if="order.status === 1">
            <button
              type="button"
              @click="handleDepart"
              :disabled="isActionLoading"
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition transform hover:scale-105 active:scale-95"
            >
              <Loader2 v-if="isActionLoading" class="h-4 w-4 animate-spin" />
              <Navigation v-else class="h-4 w-4" />
              <span>Confirmer le départ</span>
            </button>
          </template>

          <!-- Si PARTI (2) -->
          <template v-else>
            <div class="inline-flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
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

        <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div v-if="order.orders.length === 0" class="p-12 text-center space-y-3">
            <Boxes class="h-10 w-10 text-muted-foreground mx-auto" />
            <div class="text-sm font-bold text-foreground">Aucune commande affectée à cet ordre</div>
            <p class="text-xs text-muted-foreground max-w-sm mx-auto">
              Cet ordre est un brouillon vide. Ajoutez des commandes pour pouvoir le valider et planifier la tournée.
            </p>
            <button
              v-if="order.status === 0"
              type="button"
              @click="isAddLinesModalOpen = true"
              class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition"
            >
              <Plus class="h-4 w-4" />
              <span>Ajouter des commandes</span>
            </button>
          </div>

          <table v-else class="w-full text-left text-xs">
            <thead class="border-b border-border bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th class="px-5 py-3.5">Numéro</th>
                <th class="px-5 py-3.5">Client</th>
                <th class="px-5 py-3.5">Ville</th>
                <th class="px-5 py-3.5 text-right">Poids (kg)</th>
                <th class="px-5 py-3.5 text-center">Statut commande</th>
                <th v-if="order.status === 0" class="w-16 px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="line in order.orders"
                :key="line.salesOrderNo"
                class="hover:bg-muted/30 transition-colors"
              >
                <!-- Numéro -->
                <td class="px-5 py-3.5 font-bold text-foreground">
                  {{ line.salesOrderNo }}
                </td>

                <!-- Client -->
                <td class="px-5 py-3.5">
                  <div class="font-semibold text-foreground">{{ line.customerName }}</div>
                  <div class="text-[10px] text-muted-foreground">Code : {{ line.customerNo }}</div>
                </td>

                <!-- Ville -->
                <td class="px-5 py-3.5">
                  <div class="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
                    <MapPin class="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{{ line.deliveryCity }}</span>
                  </div>
                </td>

                <!-- Poids -->
                <td class="px-5 py-3.5 text-right font-bold text-foreground">
                  {{ line.totalWeightKg.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) }} kg
                </td>

                <!-- Statut de la commande -->
                <td class="px-5 py-3.5 text-center">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border"
                    :class="[
                      line.status === 1
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
                    ]"
                  >
                    {{ line.status === 1 ? 'Planifiée' : 'En livraison' }}
                  </span>
                </td>

                <!-- Action Retrait (si brouillon) -->
                <td v-if="order.status === 0" class="px-5 py-3.5 text-right">
                  <button
                    type="button"
                    @click="handleRemoveLine(line.salesOrderNo)"
                    :disabled="isActionLoading"
                    title="Retirer du transport"
                    class="inline-flex items-center justify-center h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
    </div>
  </AppLayout>
</template>

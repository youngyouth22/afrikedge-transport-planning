<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import SalesOrdersFilters from '@/components/sales-orders/SalesOrdersFilters.vue'
import SalesOrdersTable from '@/components/sales-orders/SalesOrdersTable.vue'
import SelectionActionBar from '@/components/sales-orders/SelectionActionBar.vue'
import AddToTransportModal from '@/components/sales-orders/AddToTransportModal.vue'
import TableSkeleton from '@/components/shared/TableSkeleton.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import { useSalesOrdersStore } from '@/stores/sales-orders'
import { PackageCheck, Weight, RefreshCw } from '@lucide/vue'

const store = useSalesOrdersStore()
const isModalOpen = ref(false)

onMounted(() => {
  store.fetchOrders()
})
</script>

<template>
  <AppLayout title="Commandes à planifier">
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- En-tête Métier et Cartes KPI -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Commandes à planifier
          </h2>
          <p class="text-xs text-muted-foreground mt-1">
            Gérez le portefeuille des commandes en attente d'affectation et regroupez-les par transport.
          </p>
        </div>

        <!-- KPI Cards -->
        <div class="flex items-center gap-3">
          <!-- Carte À planifier -->
          <div class="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm min-w-[150px]">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackageCheck class="h-5 w-5" />
            </div>
            <div>
              <div class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                À planifier
              </div>
              <div class="text-xl font-extrabold text-foreground">
                {{ store.filteredOrders.length }}
              </div>
            </div>
          </div>

          <!-- Carte Poids sélectionné -->
          <div class="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm min-w-[170px]">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Weight class="h-5 w-5" />
            </div>
            <div>
              <div class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Poids sélectionné
              </div>
              <div class="text-xl font-extrabold text-foreground">
                {{ store.selectedTotalWeight.toLocaleString('fr-FR') }}
                <span class="text-xs font-normal text-muted-foreground">kg</span>
              </div>
            </div>
          </div>

          <!-- Bouton rafraîchir -->
          <button
            type="button"
            @click="store.fetchOrders()"
            :disabled="store.isLoading"
            title="Rafraîchir les données"
            class="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': store.isLoading }" />
          </button>
        </div>
      </div>

      <!-- Barre de filtres et recherche -->
      <SalesOrdersFilters />

      <!-- États de chargement, erreur et tableau -->
      <div v-if="store.isLoading" class="rounded-2xl border border-border bg-card shadow-sm">
        <TableSkeleton :rows="8" :cols="6" />
      </div>

      <ErrorState
        v-else-if="store.error"
        :message="store.error"
        @retry="store.fetchOrders()"
      />

      <EmptyState
        v-else-if="store.filteredOrders.length === 0"
        title="Aucune commande trouvée"
        description="Aucune commande à planifier ne correspond à vos critères de recherche ou de filtre."
        action-label="Réinitialiser les filtres"
        @action="() => { store.searchQuery = ''; store.setCityFilter('all') }"
      />

      <SalesOrdersTable v-else />

      <!-- Barre d'action persistante au bas de l'écran lors d'une sélection -->
      <SelectionActionBar @open-assign-modal="isModalOpen = true" />

      <!-- Dialogue d'affectation au transport -->
      <AddToTransportModal
        :open="isModalOpen"
        @close="isModalOpen = false"
        @success="store.fetchOrders()"
      />
    </div>
  </AppLayout>
</template>

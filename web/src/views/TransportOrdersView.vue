<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import TransportOrdersTable from '@/components/transport-orders/TransportOrdersTable.vue'
import CreateTransportModal from '@/components/transport-orders/CreateTransportModal.vue'
import TableSkeleton from '@/components/shared/TableSkeleton.vue'
import TablePagination from '@/components/shared/TablePagination.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import { useTransportOrdersStore } from '@/stores/transport-orders'

import { Plus, Calendar, RefreshCw, X } from '@lucide/vue'

const store = useTransportOrdersStore()
const isCreateModalOpen = ref(false)

onMounted(() => {
  store.fetchOrders()
})

const statusOptions = [
  { value: 'all', label: 'Tous' },
  { value: '0', label: 'Brouillon' },
  { value: '1', label: 'Validé' },
  { value: '2', label: 'Parti' },
]
</script>

<template>
  <AppLayout title="Ordres de transport">
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- En-tête et Bouton de création -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Ordres de transport
          </h2>
          <p class="text-xs text-muted-foreground mt-1">
            Suivi opérationnel des tournées, vérification des capacités et validation des départs.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Bouton rafraîchir -->
          <button
            type="button"
            @click="store.fetchOrders()"
            :disabled="store.isLoading"
            title="Rafraîchir la liste"
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': store.isLoading }" />
          </button>

          <!-- Bouton Créer un ordre -->
          <button
            type="button"
            @click="isCreateModalOpen = true"
            class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition transform hover:scale-105 active:scale-95"
          >
            <Plus class="h-4 w-4" />
            <span>Nouveau transport</span>
          </button>
        </div>
      </div>

      <!-- Filtres par Statut et par Date -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <!-- Status Tabs -->
        <div class="flex rounded-xl bg-muted p-1 text-xs font-semibold">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            type="button"
            @click="store.setStatusFilter(opt.value)"
            class="rounded-lg px-3.5 py-1.5 transition"
            :class="[
              store.statusFilter === opt.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            {{ opt.label }}
          </button>
        </div>

        <!-- Filtre Date & Reset -->
        <div class="flex items-center gap-2">
          <div class="relative min-w-[170px]">
            <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              :value="store.dateFilter"
              @change="(e: any) => store.setDateFilter(e.target.value)"
              class="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            />
          </div>

          <button
            v-if="store.statusFilter !== 'all' || store.dateFilter"
            type="button"
            @click="store.resetFilters()"
            class="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X class="h-3.5 w-3.5" />
            <span>Effacer</span>
          </button>
        </div>
      </div>

      <!-- États de chargement, erreur et tableau -->
      <div v-if="store.isLoading" class="rounded-2xl border border-border bg-card shadow-sm">
        <TableSkeleton :rows="6" :cols="6" />
      </div>

      <ErrorState
        v-else-if="store.error"
        :message="store.error"
        @retry="store.fetchOrders()"
      />

      <EmptyState
        v-else-if="store.filteredOrders.length === 0"
        title="Aucun ordre de transport trouvé"
        description="Aucun ordre ne correspond aux filtres de statut ou de date sélectionnés."
        action-label="Créer un nouvel ordre"
        @action="isCreateModalOpen = true"
      />

      <div v-else class="space-y-4">
        <TransportOrdersTable />
        <TablePagination
          :page="store.page"
          :limit="store.limit"
          :total="store.total"
          :total-pages="store.totalPages"
          :is-loading="store.isLoading"
          @change-page="store.setPage"
          @change-limit="store.setLimit"
        />
      </div>


      <!-- Dialogue de création d'ordre -->
      <CreateTransportModal
        :open="isCreateModalOpen"
        @close="isCreateModalOpen = false"
        @success="store.fetchOrders()"
      />
    </div>
  </AppLayout>
</template>

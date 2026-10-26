<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import SalesOrdersFilters from '@/components/sales-orders/SalesOrdersFilters.vue'
import SalesOrdersTable from '@/components/sales-orders/SalesOrdersTable.vue'
import SelectionActionBar from '@/components/sales-orders/SelectionActionBar.vue'
import AddToTransportModal from '@/components/sales-orders/AddToTransportModal.vue'
import TableSkeleton from '@/components/shared/TableSkeleton.vue'
import TablePagination from '@/components/shared/TablePagination.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import { Inbox } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useSalesOrdersStore } from '@/stores/sales-orders'
import { useI18n } from 'vue-i18n'

const store = useSalesOrdersStore()
const { t } = useI18n()
const isModalOpen = ref(false)

onMounted(() => {
  store.fetchOrders()
})
</script>

<template>
  <AppLayout :title="t('salesOrders.title')">
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- En-tête Métier -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-4xl font-bold tracking-tight text-foreground sm:text-3xl mb-1">
            {{ t('salesOrders.title') }}
          </h2>
          <p class="text__16 text-Mtexttextsecondary">
            {{ t('salesOrders.subtitle') }}
          </p>
        </div>
      </div>

      <!-- Barre de filtres et recherche -->
      <div class="relative z-2">
        <SalesOrdersFilters />
      </div>

      <!-- États de chargement, erreur et tableau -->
      <div v-if="store.isLoading" class="rounded-2xl border border-border bg-card shadow-sm">
        <TableSkeleton :rows="8" :cols="6" />
      </div>

      <ErrorState
        v-else-if="store.error"
        :message="store.error"
        @retry="store.fetchOrders()"
      />

      <Empty v-else-if="store.filteredOrders.length === 0" class="border border-dashed p-10">
        <EmptyHeader>
          <EmptyMedia variant="icon" class="size-18 rounded-2xl mb-3">
            <Inbox class="size-7 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>{{ t('salesOrders.empty.title') }}</EmptyTitle>
          <EmptyDescription>
            {{ t('salesOrders.empty.description') }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            class="h-11.5 hover:cursor-pointer"
            @click="() => { store.searchQuery = ''; store.setCityFilter('all') }"
          >
            {{ t('salesOrders.empty.resetFilters') }}
          </Button>
        </EmptyContent>
      </Empty>

      <div v-else class="space-y-4">
        <SalesOrdersTable />
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


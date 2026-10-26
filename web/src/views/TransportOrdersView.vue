<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { DateValue } from 'reka-ui'
import { parseDate } from '@internationalized/date'
import AppLayout from '@/components/layout/AppLayout.vue'
import TransportOrdersTable from '@/components/transport-orders/TransportOrdersTable.vue'
import CreateTransportModal from '@/components/transport-orders/CreateTransportModal.vue'
import TableSkeleton from '@/components/shared/TableSkeleton.vue'
import TablePagination from '@/components/shared/TablePagination.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import { useTransportOrdersStore } from '@/stores/transport-orders'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Plus, Calendar as CalendarIcon, RefreshCw, X, Truck } from '@lucide/vue'

const store = useTransportOrdersStore()
const isCreateModalOpen = ref(false)
const isCalendarOpen = ref(false)
const calendarDateValue = ref<any>(undefined)

onMounted(() => {
  store.fetchOrders()
})

watch(
  () => store.dateFilter,
  (newVal) => {
    if (newVal) {
      try {
        calendarDateValue.value = parseDate(newVal)
      } catch {
        calendarDateValue.value = undefined
      }
    } else {
      calendarDateValue.value = undefined
    }
  },
  { immediate: true },
)

const formattedDate = computed(() => {
  if (!store.dateFilter) return null
  try {
    const [year, month, day] = store.dateFilter.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return store.dateFilter
  }
})

function onDateSelected(date: DateValue | undefined) {
  if (date) {
    store.setDateFilter(date.toString())
    isCalendarOpen.value = false
  } else {
    store.setDateFilter('')
  }
}

function clearDateFilter() {
  calendarDateValue.value = undefined
  store.setDateFilter('')
  isCalendarOpen.value = false
}

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
      <!-- En-tête et Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-4xl font-bold tracking-tight text-foreground sm:text-3xl mb-1">
            Ordres de transport
          </h2>
          <p class="text__16 text-Mtexttextsecondary">
            Suivi opérationnel des tournées, vérification des capacités.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Popover Filtre Date & Bouton calendrier -->
          <div class="relative flex items-center">
            <Popover v-model:open="isCalendarOpen">
              <PopoverTrigger as-child>
                <Button
                  type="button"
                  variant="outline"
                  class="h-11.5 flex items-center gap-2.5 border-border hover:bg-accent font-medium text-sm text-foreground hover:cursor-pointer"
                  :class="store.dateFilter ? 'pl-4 pr-10' : 'px-4'"
                >
                  <CalendarIcon class="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{{ formattedDate || 'Filtrer par date' }}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0 rounded-2xl border-border bg-card shadow-lg" align="end">
                <Calendar
                  :model-value="calendarDateValue"
                  @update:model-value="onDateSelected"
                />
              </PopoverContent>
            </Popover>

            <!-- Bouton Close quand une date est sélectionnée (intégré à l'intérieur à droite) -->
            <Button
              v-if="store.dateFilter"
              type="button"
              variant="ghost"
              size="icon"
              title="Effacer la date"
              @click.stop.prevent="clearDateFilter"
              class="absolute right-1.5 h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>

          <!-- Bouton rafraîchir -->
          <Button
            type="button"
            variant="outline"
            @click="store.fetchOrders()"
            :disabled="store.isLoading"
            title="Rafraîchir la liste"
            class="h-11.5 px-4 flex items-center gap-2 border-border bg-card hover:bg-accent font-medium text-sm text-foreground hover:cursor-pointer"
          >
            <RefreshCw class="h-4 w-4 text-muted-foreground" :class="{ 'animate-spin': store.isLoading }" />
            <span>Rafraîchir</span>
          </Button>

          <!-- Bouton Nouveau transport -->
          <Button
            type="button"
            @click="isCreateModalOpen = true"
            class="h-11.5 px-4 hover:cursor-pointer"
          >
            <Plus class="h-4 w-4" />
            <span>Nouveau transport</span>
          </Button>
        </div>
      </div>

      <!-- Filtres par Statut (Tabs style Stripe / SaaS comme sur l'image) -->
      <div class="border-b border-border">
        <nav class="flex items-center gap-6 sm:gap-8 -mb-px overflow-x-auto" aria-label="Filtres de statut">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            type="button"
            @click="store.setStatusFilter(opt.value)"
            class="relative pb-3 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer border-b-2"
            :class="[
              store.statusFilter === opt.value
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted',
            ]"
          >
            {{ opt.label }}
          </button>
        </nav>
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

      <Empty v-else-if="store.filteredOrders.length === 0" class="border border-dashed p-10">
        <EmptyHeader>
          <EmptyMedia variant="icon" class="size-18 rounded-2xl mb-3">
            <Truck class="size-7 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>Aucun ordre de transport trouvé</EmptyTitle>
          <EmptyDescription>
            Aucun ordre ne correspond aux filtres de statut ou de date sélectionnés.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            class="h-11.5 hover:cursor-pointer"
            @click="isCreateModalOpen = true"
          >
            Créer un nouvel ordre
          </Button>
        </EmptyContent>
      </Empty>

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

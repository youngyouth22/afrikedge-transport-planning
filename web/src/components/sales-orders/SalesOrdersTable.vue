<script setup lang="ts">
import { computed } from 'vue'
import { useSalesOrdersStore } from '@/stores/sales-orders'
import type { SalesOrderToPlan } from '@/api/sales-orders.api'
import { MapPin, Weight, FileText } from '@lucide/vue'

const store = useSalesOrdersStore()

const isAllSelected = computed(() => {
  if (store.filteredOrders.length === 0) return false
  return store.filteredOrders.every((o) => store.selectedOrderNos.has(o.salesOrderNo))
})

const isSomeSelected = computed(() => {
  return store.selectedCount > 0 && !isAllSelected.value
})

function toggleSelectAll() {
  store.selectAllCurrent(!isAllSelected.value)
}

function handleRowClick(order: SalesOrderToPlan) {
  store.toggleSelection(order.salesOrderNo)
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="border-b border-border bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
          <tr>
            <th class="w-12 px-4 py-3.5 text-center">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isSomeSelected"
                @change="toggleSelectAll"
                class="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
              />
            </th>
            <th class="px-4 py-3.5">Numéro</th>
            <th class="px-4 py-3.5">Client</th>
            <th class="px-4 py-3.5">Ville</th>
            <th class="px-4 py-3.5 text-right">Poids (kg)</th>
            <th class="px-4 py-3.5 text-center">Statut</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="order in store.filteredOrders"
            :key="order.salesOrderNo"
            @click="handleRowClick(order)"
            class="group cursor-pointer transition-colors"
            :class="[
              store.selectedOrderNos.has(order.salesOrderNo)
                ? 'bg-emerald-500/10 dark:bg-emerald-950/30'
                : 'hover:bg-muted/40',
            ]"
          >
            <!-- Checkbox -->
            <td class="w-12 px-4 py-3.5 text-center" @click.stop>
              <input
                type="checkbox"
                :checked="store.selectedOrderNos.has(order.salesOrderNo)"
                @change="store.toggleSelection(order.salesOrderNo)"
                class="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
              />
            </td>

            <!-- Numéro -->
            <td class="px-4 py-3.5">
              <div class="flex items-center gap-2">
                <FileText class="h-3.5 w-3.5 text-muted-foreground" />
                <span class="font-bold text-foreground">{{ order.salesOrderNo }}</span>
              </div>
            </td>

            <!-- Client -->
            <td class="px-4 py-3.5">
              <div class="font-semibold text-foreground">{{ order.customerName }}</div>
              <div class="text-[10px] text-muted-foreground">Code : {{ order.customerNo }}</div>
            </td>

            <!-- Ville -->
            <td class="px-4 py-3.5">
              <div class="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
                <MapPin class="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span>{{ order.deliveryCity }}</span>
              </div>
            </td>

            <!-- Poids -->
            <td class="px-4 py-3.5 text-right">
              <div class="inline-flex items-center gap-1 font-bold text-foreground">
                <Weight class="h-3 w-3 text-muted-foreground" />
                <span>{{ order.totalWeightKg.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) }}</span>
                <span class="text-[10px] font-normal text-muted-foreground">kg</span>
              </div>
            </td>

            <!-- Statut -->
            <td class="px-4 py-3.5 text-center">
              <span class="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                À planifier
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSalesOrdersStore } from '@/stores/sales-orders'
import type { SalesOrderToPlan } from '@/api/sales-orders.api'
import { MapPin, Weight, FileText } from '@lucide/vue'
import DataTableCustom from '@/components/shared/DataTableCustom.vue'
import TablePill from '@/components/shared/TablePill.vue'
import TableStatusBadge from '@/components/shared/TableStatusBadge.vue'

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
  store.toggleSelection(order)
}
</script>

<template>
  <DataTableCustom>
    <template #header>
      <tr>
        <th class="w-12 px-4 py-3.5 text-center">
          <input
            type="checkbox"
            :checked="isAllSelected"
            :indeterminate="isSomeSelected"
            @change="toggleSelectAll"
            class="w-5 h-5 border border-Mgray400! rounded-lg accent-emerald-600 cursor-pointer"
            aria-label="Sélectionner toutes les commandes"
          />
        </th>
        <th class="px-4 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
          Commande
        </th>
        <th class="px-4 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
          Client
        </th>
        <th class="px-4 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
          Ville de livraison
        </th>
        <th class="px-4 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider text-right">
          Poids
        </th>
        <th class="px-4 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider text-center">
          Statut
        </th>
      </tr>
    </template>

    <tr
      v-for="order in store.filteredOrders"
      :key="order.salesOrderNo"
      @click="handleRowClick(order)"
      class="group cursor-pointer transition-colors"
      :class="[
        store.selectedOrderNos.has(order.salesOrderNo)
          ? 'bg-emerald-500/10 dark:bg-emerald-950/30'
          : 'hover:bg-accent/40',
      ]"
    >
      <!-- Checkbox -->
      <td class="w-12 px-4 py-3 text-center" @click.stop>
        <input
          type="checkbox"
          :checked="store.selectedOrderNos.has(order.salesOrderNo)"
          @change="store.toggleSelection(order)"
          class="w-5 h-5 border border-Mgray400! rounded-lg accent-emerald-600 cursor-pointer"
          :aria-label="`Sélectionner commande ${order.salesOrderNo}`"
        />
      </td>


      <!-- Commande -->
      <td class="px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-full bg-Msurfacesurfacesecondary border border-Mborderborderprimary! flex items-center justify-center shrink-0">
            <FileText class="h-4 w-4 text-Mtexttextsecondary" />
          </div>
          <div>
            <h5 class="font-medium text__16 text-Mtexttextprimary">{{ order.salesOrderNo }}</h5>
            <p class="text__14 text-Mtexttextsecondary">Réf. Cde</p>
          </div>
        </div>
      </td>

      <!-- Client -->
      <td class="px-4 py-3">
        <div class="font-medium text__14 text-Mtexttextprimary">{{ order.customerName }}</div>
        <div class="text-xs text-Mtexttextsecondary">Code : {{ order.customerNo }}</div>
      </td>

      <!-- Ville (Pill style comme Category) -->
      <td class="px-4 py-3">
        <TablePill :icon="MapPin" icon-class="text-Mmaincolorgreen">
          {{ order.deliveryCity }}
        </TablePill>
      </td>

      <!-- Poids -->
      <td class="px-4 py-3 text-right">
        <div class="inline-flex items-center gap-1.5 font-medium text__14 text-Mtexttextprimary">
          <Weight class="h-3.5 w-3.5 text-Mtexttextsecondary" />
          <span>{{ order.totalWeightKg.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) }} kg</span>
        </div>
      </td>

      <!-- Statut (Badge pastel) -->
      <td class="px-4 py-3 text-center">
        <TableStatusBadge variant="success">
          À planifier
        </TableStatusBadge>
      </td>
    </tr>
  </DataTableCustom>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTransportOrdersStore } from '@/stores/transport-orders'
import TransportStatusBadge from './TransportStatusBadge.vue'
import DataTableCustom from '@/components/shared/DataTableCustom.vue'
import TablePill from '@/components/shared/TablePill.vue'
import { Truck, Calendar, ChevronRight, Boxes } from '@lucide/vue'

const router = useRouter()
const store = useTransportOrdersStore()

function navigateToDetail(orderNo: string) {
  router.push(`/transport-orders/${encodeURIComponent(orderNo)}`)
}

function getFillRatio(totalKg: number, capacityKg: number) {
  if (capacityKg <= 0) return 0
  return Math.min(100, Math.round((totalKg / capacityKg) * 100))
}
</script>

<template>
  <DataTableCustom>
    <template #header>
      <tr>
        <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
          Ordre de transport
        </th>
        <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
          Véhicule
        </th>
        <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
          Date de livraison
        </th>
        <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider text-center">
          Commandes
        </th>
        <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider">
          Remplissage / Capacité
        </th>
        <th class="px-5 py-3.5 text-xs uppercase font-semibold text-Mtexttextsecondary tracking-wider text-center">
          Statut
        </th>
        <th class="w-12 px-5 py-3.5 text-right"></th>
      </tr>
    </template>

    <tr
      v-for="order in store.filteredOrders"
      :key="order.no"
      @click="navigateToDetail(order.no)"
      class="group cursor-pointer hover:bg-accent/40 transition-colors"
    >
      <!-- Numéro de transport -->
      <td class="px-5 py-3.5">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-full bg-Msurfacesurfacesecondary border border-Mborderborderprimary! flex items-center justify-center shrink-0">
            <Truck class="h-4 w-4 text-Mtexttextsecondary" />
          </div>
          <div>
            <h5 class="font-medium text__16 text-Mtexttextprimary group-hover:text-primary transition-colors">
              {{ order.no }}
            </h5>
            <p class="text__14 text-Mtexttextsecondary">Créé par {{ order.createdBy }}</p>
          </div>
        </div>
      </td>

      <!-- Véhicule -->
      <td class="px-5 py-3.5">
        <div class="space-y-1">
          <TablePill :icon="Truck" icon-class="text-Mmaincolorgreen" class=" bg-transparent! border-none! px-0!">
            {{ order.vehicleCode }}
          </TablePill>
          <div class="text-xs text-Mtexttextsecondary font-mono pl-0.5">
            {{ order.vehiclePlateNo }}
          </div>
        </div>
      </td>

      <!-- Date de livraison -->
      <td class="px-5 py-3.5">
        <TablePill :icon="Calendar" icon-class="text-Mtexttextsecondary">
          {{ order.deliveryDate }}
        </TablePill>
      </td>

      <!-- Nombre de commandes -->
      <td class="px-5 py-3.5 text-center">
        <TablePill :icon="Boxes" icon-class="text-Mtexttextsecondary">
          {{ order.ordersCount }}
        </TablePill>
      </td>

      <!-- Jauge remplissage -->
      <td class="px-5 py-3.5 min-w-52.5">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-Mtexttextprimary text__14">
              {{ order.totalWeightKg.toLocaleString('fr-FR') }} / {{ order.vehicleCapacityKg.toLocaleString('fr-FR') }} kg
            </span>
            <span class="font-semibold text-Mtexttextsecondary">
              {{ getFillRatio(order.totalWeightKg, order.vehicleCapacityKg) }} %
            </span>
          </div>
          <div class="h-2 w-full overflow-hidden bg-Msurfacesurfacesecondary border border-Mborderborderprimary!">
            <div
              class="h-full  transition-all duration-300"
              :class="[
                getFillRatio(order.totalWeightKg, order.vehicleCapacityKg) >= 90
                  ? 'bg-amber-500'
                  : 'bg-Mmaincolorgreen',
              ]"
              :style="{ width: `${getFillRatio(order.totalWeightKg, order.vehicleCapacityKg)}%` }"
            />
          </div>
        </div>
      </td>

      <!-- Statut -->
      <td class="px-5 py-3.5 text-center">
        <TransportStatusBadge :status="order.status" />
      </td>

      <!-- Actions -->
      <td class="px-5 py-3.5 text-right">
        <div class="inline-flex items-center justify-center h-8 w-8 rounded-lg text-Mtexttextsecondary group-hover:text-foreground group-hover:bg-accent transition-colors">
          <ChevronRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </td>
    </tr>
  </DataTableCustom>
</template>

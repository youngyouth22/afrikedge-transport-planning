<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTransportOrdersStore } from '@/stores/transport-orders'
import TransportStatusBadge from './TransportStatusBadge.vue'
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
  <div class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="border-b border-border bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
          <tr>
            <th class="px-5 py-3.5">Numéro d'ordre</th>
            <th class="px-5 py-3.5">Véhicule</th>
            <th class="px-5 py-3.5">Date de livraison</th>
            <th class="px-5 py-3.5 text-center">Commandes</th>
            <th class="px-5 py-3.5">Remplissage / Capacité</th>
            <th class="px-5 py-3.5 text-center">Statut</th>
            <th class="w-10 px-5 py-3.5 text-right"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="order in store.filteredOrders"
            :key="order.no"
            @click="navigateToDetail(order.no)"
            class="group cursor-pointer hover:bg-muted/40 transition-colors"
          >
            <!-- Numéro -->
            <td class="px-5 py-4">
              <div class="font-extrabold text-foreground text-sm group-hover:text-primary transition-colors">
                {{ order.no }}
              </div>
              <div class="text-[10px] text-muted-foreground">Créé par {{ order.createdBy }}</div>
            </td>

            <!-- Véhicule -->
            <td class="px-5 py-4">
              <div class="flex items-center gap-2">
                <Truck class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div class="font-bold text-foreground">{{ order.vehicleCode }}</div>
                  <div class="text-[10px] text-muted-foreground font-mono">{{ order.vehiclePlateNo }}</div>
                </div>
              </div>
            </td>

            <!-- Date -->
            <td class="px-5 py-4">
              <div class="inline-flex items-center gap-1.5 font-medium text-foreground">
                <Calendar class="h-3.5 w-3.5 text-muted-foreground" />
                <span>{{ order.deliveryDate }}</span>
              </div>
            </td>

            <!-- Nombre de commandes -->
            <td class="px-5 py-4 text-center">
              <div class="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
                <Boxes class="h-3 w-3 text-muted-foreground" />
                <span>{{ order.ordersCount }}</span>
              </div>
            </td>

            <!-- Jauge remplissage -->
            <td class="px-5 py-4 min-w-[200px]">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-bold text-foreground">
                    {{ order.totalWeightKg.toLocaleString('fr-FR') }} / {{ order.vehicleCapacityKg.toLocaleString('fr-FR') }} kg
                  </span>
                  <span class="font-semibold text-muted-foreground">
                    {{ getFillRatio(order.totalWeightKg, order.vehicleCapacityKg) }} %
                  </span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :class="[
                      getFillRatio(order.totalWeightKg, order.vehicleCapacityKg) >= 90
                        ? 'bg-amber-500'
                        : 'bg-primary',
                    ]"
                    :style="{ width: `${getFillRatio(order.totalWeightKg, order.vehicleCapacityKg)}%` }"
                  />
                </div>
              </div>
            </td>

            <!-- Statut -->
            <td class="px-5 py-4 text-center">
              <TransportStatusBadge :status="order.status" />
            </td>

            <!-- Flèche action -->
            <td class="px-5 py-4 text-right">
              <ChevronRight class="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  ClipboardList,
  Truck,
  Boxes,
  ShieldCheck,
  ChevronRight,
  LogOut,
} from '@lucide/vue'

const route = useRoute()
const userStore = useUserStore()

const navigation = [
  {
    name: 'Commandes à planifier',
    to: '/sales-orders',
    icon: ClipboardList,
    description: 'Affectation des commandes',
  },
  {
    name: 'Ordres de transport',
    to: '/transport-orders',
    icon: Truck,
    description: 'Brouillons, validés et départs',
  },
]

function isActive(path: string) {
  if (path === '/transport-orders') {
    return route.path.startsWith('/transport-orders')
  }
  return route.path === path
}
</script>

<template>
  <aside class="flex h-screen w-64 flex-col border-r border-border bg-card">
    <!-- Top Branding -->
    <div class="flex h-16 items-center gap-3 border-b border-border px-6">
      <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Boxes class="h-5 w-5" />
      </div>
      <div>
        <h1 class="text-sm font-bold tracking-tight text-foreground">TRANSIT</h1>
        <p class="text-[11px] font-medium text-muted-foreground">Afrikedge Logistics</p>
      </div>
    </div>

    <!-- Navigation List -->
    <div class="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      <div>
        <h2 class="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          Opérations
        </h2>
        <nav class="mt-2 space-y-1">
          <router-link
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            class="group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all"
            :class="[
              isActive(item.to)
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            ]"
          >
            <div class="flex items-center gap-3">
              <component
                :is="item.icon"
                class="h-4 w-4 shrink-0 transition-colors"
                :class="isActive(item.to) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'"
              />
              <span>{{ item.name }}</span>
            </div>
            <ChevronRight
              class="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
              :class="{ 'opacity-100 text-primary': isActive(item.to) }"
            />
          </router-link>
        </nav>
      </div>
    </div>

    <!-- Bottom User Section -->
    <div class="border-t border-border p-4">
      <div class="flex items-center justify-between rounded-xl bg-accent/50 p-2.5">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-xs text-primary-foreground shadow-sm">
            {{ userStore.currentUser.initials }}
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-foreground leading-none">{{ userStore.currentUser.name }}</span>
              <ShieldCheck v-if="userStore.isLogisticsManager" class="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span class="text-[10px] text-muted-foreground leading-none">{{ userStore.currentUser.role }}</span>
          </div>
        </div>

        <router-link
          to="/select-user"
          title="Changer d'utilisateur"
          class="rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition"
        >
          <LogOut class="h-4 w-4" />
        </router-link>
      </div>
    </div>
  </aside>
</template>

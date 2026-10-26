<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useLayoutStore } from '@/stores/layout'
import {
  ClipboardList,
  Truck,
  Boxes,
  LogOut,
  X,
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const layoutStore = useLayoutStore()

const navigation = [
  {
    name: 'Commandes à planifier',
    to: '/sales-orders',
    icon: ClipboardList,
  },
  {
    name: 'Ordres de transport',
    to: '/transport-orders',
    icon: Truck,
  },
]

function isActive(path: string) {
  if (path === '/transport-orders') {
    return route.path.startsWith('/transport-orders')
  }
  return route.path === path
}

function handleNavClick() {
  layoutStore.closeSidebar()
}

function handleLogout() {
  userStore.clearUser()
  layoutStore.closeSidebar()
  router.push('/select-user')
}
</script>

<template>
  <!-- Mobile Backdrop Overlay -->
  <div
    v-if="layoutStore.isSidebarOpen"
    class="fixed inset-0 z-90 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
    @click="layoutStore.closeSidebar()"
  />

  <aside
    class="w-62 h-dvh md:h-screen bg-Msurfacesurfacesecondary border-r border-Mborderborderprimary! fixed z-99 top-0 px-3 py-6 transition-all duration-300 lg:left-0 flex flex-col justify-between"
    :class="[layoutStore.isSidebarOpen ? 'left-0 shadow-2xl' : '-left-100']"
  >
    <!-- Top Branding & Navigation -->
    <div class="flex flex-col flex-1 min-h-0">
      <!-- Top Branding -->
      <div class="flex items-center justify-between pb-4 px-2">
        <div class="flex items-center gap-2.5">
          <Boxes class="h-8 w-auto text-Mmaincolorgreen" />
          <div>
            <h1 class="text-base font-bold tracking-tight text-foreground">TRANSIT</h1>
            <p class="text-sm font-medium text-muted-foreground">Afrikedge Logistics</p>
          </div>
        </div>

        <!-- Mobile Close Button -->
        <button
          type="button"
          @click="layoutStore.closeSidebar()"
          class="lg:hidden rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
          aria-label="Fermer le menu"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Navigation List -->
      <div class="flex-1 overflow-y-auto py-4">
        <h2 class="px-3 pb-2 text-[10px] font-bold tracking-wider text-Mtexttextsecondary uppercase">
          OPÉRATIONS
        </h2>
        <div class="grid grid-cols-1 gap-2">
          <router-link
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            @click="handleNavClick"
            class="pl-3 pr-4 py-2 flex items-center gap-3 transition-colors rounded-r-md cursor-pointer"
            :class="[
              isActive(item.to)
                ? 'bg-white dark:bg-card border-l-2 border-Mmaincolorgreen text-Mtexttextprimary font-medium'
                : 'text-Mtexttextsecondary hover:text-foreground hover:bg-white/40 dark:hover:bg-accent/40 font-medium',
            ]"
          >
            <div class="text-Mtexttextsecondary">
              <component :is="item.icon" class="h-5 w-5 shrink-0" />
            </div>
            <p class="font-medium text__16">{{ item.name }}</p>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Bottom Action (Logout) -->
    <div class="pt-3">
      <div
        @click="handleLogout"
        class="cursor-pointer pl-3 pr-4 py-2 flex items-center gap-3 text-Mtexttextprimary hover:bg-white/40 dark:hover:bg-accent/40 rounded-r-md transition-colors"
      >
        <div class="text-Mtexttextsecondary">
          <LogOut class="h-5 w-5 shrink-0" />
        </div>
        <p class="font-medium text__16">Se déconnecter</p>
      </div>
    </div>
  </aside>
</template>

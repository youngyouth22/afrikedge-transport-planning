<script setup lang="ts">
import UserSwitcher from './UserSwitcher.vue'
import { Menu } from '@lucide/vue'
import { useLayoutStore } from '@/stores/layout'

defineProps<{
  title?: string
  breadcrumbs?: { label: string; to?: string }[]
}>()

const layoutStore = useLayoutStore()
</script>

<template>
  <header
    class="fixed w-full lg:w-[calc(100%-248px)] h-17.5 z-80 right-0 top-0 bg-white dark:bg-card border-b border-Mborderborderprimary! flex items-center transition-all duration-300 px-4 sm:px-6 lg:px-8 justify-between"
  >
    <!-- Left: Mobile menu toggle + Title / Breadcrumbs -->
    <div class="flex items-center gap-3">
      <!-- Mobile hamburger toggle -->
      <button
        type="button"
        @click="layoutStore.toggleSidebar()"
        class="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu class="h-5 w-5" />
      </button>

      <!-- Breadcrumbs or Title -->
      <div v-if="breadcrumbs && breadcrumbs.length > 0" class="flex items-center gap-2 text-xs text-muted-foreground">
        <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
          <router-link v-if="crumb.to" :to="crumb.to" class="hover:text-foreground transition-colors">
            {{ crumb.label }}
          </router-link>
          <span v-else class="font-semibold text-foreground">{{ crumb.label }}</span>
          <span v-if="idx < breadcrumbs.length - 1" class="text-muted-foreground/60">/</span>
        </template>
      </div>
      <h1 v-else-if="title" class="text-base sm:text-lg font-bold tracking-tight text-foreground truncate max-w-50 sm:max-w-xs md:max-w-md">
        {{ title }}
      </h1>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-3 sm:gap-4">
      <!-- <div class="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
        <Truck class="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        <span>Transport ERP SEFS1026</span>
      </div> -->

      <UserSwitcher />
    </div>
  </header>
</template>

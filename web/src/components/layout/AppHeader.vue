<script setup lang="ts">
import UserSwitcher from './UserSwitcher.vue'
import { Truck } from '@lucide/vue'

defineProps<{
  title?: string
  breadcrumbs?: { label: string; to?: string }[]
}>()
</script>

<template>
  <header class="flex h-16 w-full items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-8 sticky top-0 z-30">
    <!-- Title / Breadcrumbs -->
    <div class="flex items-center gap-3">
      <div v-if="breadcrumbs && breadcrumbs.length > 0" class="flex items-center gap-2 text-xs text-muted-foreground">
        <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
          <router-link v-if="crumb.to" :to="crumb.to" class="hover:text-foreground transition-colors">
            {{ crumb.label }}
          </router-link>
          <span v-else class="font-semibold text-foreground">{{ crumb.label }}</span>
          <span v-if="idx < breadcrumbs.length - 1" class="text-muted-foreground/60">/</span>
        </template>
      </div>
      <h1 v-else-if="title" class="text-lg font-bold tracking-tight text-foreground">
        {{ title }}
      </h1>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-4">
      <div class="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
        <Truck class="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        <span>Transport ERP SEFS1026</span>
      </div>

      <UserSwitcher />
    </div>
  </header>
</template>

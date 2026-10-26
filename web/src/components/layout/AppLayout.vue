<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

defineProps<{
  title?: string
  breadcrumbs?: { label: string; to?: string }[]
}>()
</script>

<template>
  <div class="min-h-screen w-full bg-background text-foreground">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main Content Area (Offset by fixed sidebar width and fixed header height) -->
    <div class="flex min-h-screen flex-col lg:pl-62 pt-17.5 transition-all duration-300">
      <AppHeader :title="title" :breadcrumbs="breadcrumbs" />
      <main class="flex-1 p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

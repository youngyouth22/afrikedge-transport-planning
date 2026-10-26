<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

defineProps<{
  title?: string
  breadcrumbs?: { label: string; to?: string }[]
}>()
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-background text-foreground">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div class="flex flex-1 flex-col overflow-y-auto">
      <AppHeader :title="title" :breadcrumbs="breadcrumbs" />
      <main class="flex-1 p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

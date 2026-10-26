<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <div class="min-h-screen bg-background font-sans antialiased text-foreground">
    <router-view />
    <Toaster position="top-right" richColors />
  </div>
</template>

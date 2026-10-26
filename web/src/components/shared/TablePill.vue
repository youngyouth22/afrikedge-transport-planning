<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon?: Component
  iconClass?: string
  textClass?: string
}>()
</script>

<template>
  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-Msurfacesurfacesecondary border border-Mborderborderprimary! text__14 font-medium">
    <component :is="icon" v-if="icon" class="h-3.5 w-3.5 shrink-0" :class="iconClass || 'text-Mtexttextsecondary'" />
    <span :class="textClass || 'text-Mtexttextprimary'">
      <slot />
    </span>
  </div>
</template>

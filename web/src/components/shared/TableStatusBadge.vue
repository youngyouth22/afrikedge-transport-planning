<script setup lang="ts">
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'warning' | 'success' | 'error' | 'info' | 'neutral'
    icon?: Component
  }>(),
  {
    variant: 'neutral',
  }
)

const variantClasses: Record<string, string> = {
  warning:
    'text-Malertswarning !border-[#FFF5CC] bg-[#FFFAE5] dark:bg-amber-950/40 dark:!border-amber-900/50 dark:text-amber-400',
  success:
    'text-Malertssucces !border-[#D6F4DE] bg-[#EFFBF2] dark:bg-emerald-950/40 dark:!border-emerald-900/50 dark:text-emerald-400',
  error:
    'text-Malertserror !border-[#FFEBEA] bg-[#FFEFEE] dark:bg-red-950/40 dark:!border-red-900/50 dark:text-red-400',
  info:
    'text-blue-600 !border-[#D6E6FF] bg-[#EFF6FF] dark:bg-blue-950/40 dark:!border-blue-900/50 dark:text-blue-400',
  neutral:
    'text-Mtexttextsecondary !border-Mborderborderprimary bg-Msurfacesurfacesecondary dark:bg-accent/40',
}
</script>

<template>
  <div
    class="text__14 px-2.5 py-1 inline-flex items-center gap-1.5 rounded-[4px] border font-medium whitespace-nowrap"
    :class="variantClasses[props.variant]"
  >
    <component :is="icon" v-if="icon" class="h-3.5 w-3.5 shrink-0" />
    <span>
      <slot />
    </span>
  </div>
</template>

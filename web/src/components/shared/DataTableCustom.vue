<script setup lang="ts">
defineProps<{
  minWidth?: string
}>()
</script>

<template>
  <div class="w-full overflow-hidden border !border-Mborderborderprimary bg-card shadow-xs">
    <div class="w-full overflow-x-auto">
      <div :style="minWidth ? { minWidth } : undefined" class="w-full">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-[#F9FAFB] dark:bg-muted/40 border-b !border-Mborderborderprimary text-Mtexttextsecondary">
            <slot name="header" />
          </thead>
          <tbody class="divide-y !divide-Mborderborderprimary/60">
            <slot />
          </tbody>
        </table>
      </div>
    </div>
    <div v-if="$slots.footer" class="bg-[#F9FAFB] dark:bg-muted/40 border-t !border-Mborderborderprimary px-4 py-3">
      <slot name="footer" />
    </div>
  </div>
</template>

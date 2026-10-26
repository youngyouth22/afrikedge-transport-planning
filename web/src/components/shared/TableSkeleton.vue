<script setup lang="ts">
defineProps<{
  rows?: number
  cols?: number
}>()
</script>

<template>
  <div class="space-y-3 p-4">
    <div
      v-for="r in rows || 5"
      :key="r"
      class="flex items-center gap-4 animate-pulse"
    >
      <div
        v-for="c in cols || 6"
        :key="c"
        class="h-8 rounded-lg bg-muted flex-1"
        :class="{ 'max-w-[40px]': c === 1 }"
      />
    </div>
  </div>
</template>

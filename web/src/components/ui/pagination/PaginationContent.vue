<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from 'cn'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <ul
    data-slot="pagination-content"
    :class="cn('flex flex-row items-center gap-1.5', props.class)"
  >
    <slot />
  </ul>
</template>

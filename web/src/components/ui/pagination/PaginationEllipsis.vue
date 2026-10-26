<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { MoreHorizontalIcon } from '@lucide/vue'
import { cn } from 'cn'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <span
    data-slot="pagination-ellipsis"
    aria-hidden="true"
    :class="cn('flex h-9 w-9 items-center justify-center text-muted-foreground select-none', props.class)"
  >
    <slot>
      <MoreHorizontalIcon class="h-4 w-4" />
      <span class="sr-only">Plus de pages</span>
    </slot>
  </span>
</template>

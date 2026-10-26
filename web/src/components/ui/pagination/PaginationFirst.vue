<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { ChevronsLeftIcon } from '@lucide/vue'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<{
  href?: string
  size?: ButtonVariants['size']
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  size: 'icon',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    v-if="!href || href === '#'"
    type="button"
    data-slot="pagination-first"
    :disabled="disabled"
    :aria-disabled="disabled"
    :class="cn(
      buttonVariants({ variant: 'ghost', size }),
      'cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none',
      props.class,
    )"
    @click="emit('click', $event)"
  >
    <slot>
      <ChevronsLeftIcon class="h-4 w-4" />
      <span class="sr-only">Première page</span>
    </slot>
  </button>
  <a
    v-else
    :href="href"
    data-slot="pagination-first"
    :class="cn(
      buttonVariants({ variant: 'ghost', size }),
      'cursor-pointer select-none',
      disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
      props.class,
    )"
    @click="emit('click', $event)"
  >
    <slot>
      <ChevronsLeftIcon class="h-4 w-4" />
      <span class="sr-only">Première page</span>
    </slot>
  </a>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { ChevronRightIcon } from '@lucide/vue'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<{
  href?: string
  size?: ButtonVariants['size']
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  size: 'default',
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
    data-slot="pagination-next"
    :disabled="disabled"
    :aria-disabled="disabled"
    :class="cn(
      buttonVariants({ variant: 'ghost', size }),
      'gap-1.5 pr-2.5 cursor-pointer disabled:pointer-events-none disabled:opacity-50 select-none text-sm font-medium',
      props.class,
    )"
    @click="emit('click', $event)"
  >
    <slot>
      <span class="hidden sm:inline">Suivant</span>
      <ChevronRightIcon class="h-4 w-4" />
    </slot>
  </button>
  <a
    v-else
    :href="href"
    data-slot="pagination-next"
    :class="cn(
      buttonVariants({ variant: 'ghost', size }),
      'gap-1.5 pr-2.5 cursor-pointer select-none text-sm font-medium',
      disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
      props.class,
    )"
    @click="emit('click', $event)"
  >
    <slot>
      <span class="hidden sm:inline">Suivant</span>
      <ChevronRightIcon class="h-4 w-4" />
    </slot>
  </a>
</template>

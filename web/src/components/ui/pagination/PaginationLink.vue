<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<{
  href?: string
  size?: ButtonVariants['size']
  isActive?: boolean
  disabled?: boolean
  class?: HTMLAttributes['class']
}>(), {
  size: 'icon',
  isActive: false,
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
    data-slot="pagination-link"
    :data-active="isActive ? '' : undefined"
    :aria-current="isActive ? 'page' : undefined"
    :disabled="disabled"
    :class="cn(
      buttonVariants({
        variant: isActive ? 'default' : 'ghost',
        size,
      }),
      'cursor-pointer transition-colors select-none font-medium text-sm',
      isActive && 'bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white border-emerald-600 shadow-sm font-semibold',
      disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
      props.class,
    )"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
  <a
    v-else
    :href="href"
    data-slot="pagination-link"
    :data-active="isActive ? '' : undefined"
    :aria-current="isActive ? 'page' : undefined"
    :class="cn(
      buttonVariants({
        variant: isActive ? 'default' : 'ghost',
        size,
      }),
      'cursor-pointer transition-colors select-none font-medium text-sm',
      isActive && 'bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white border-emerald-600 shadow-sm font-semibold',
      disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
      props.class,
    )"
    @click="emit('click', $event)"
  >
    <slot />
  </a>
</template>

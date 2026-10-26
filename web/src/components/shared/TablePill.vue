<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { Component, HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cn } from 'cn'
import { Primitive } from 'reka-ui'

interface TablePillProps extends PrimitiveProps {
  icon?: Component
  iconClass?: string
  textClass?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<TablePillProps>(), {
  as: 'div',
})

const delegatedProps = reactiveOmit(props, 'class', 'icon', 'iconClass', 'textClass')
</script>

<template>
  <Primitive
    data-slot="table-pill"
    :class="
      cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-Msurfacesurfacesecondary border border-Mborderborderprimary text__14 font-medium',
        props.class,
      )
    "
    v-bind="delegatedProps"
  >
    <component
      :is="icon"
      v-if="icon"
      :class="cn('h-3.5 w-3.5 shrink-0 text-Mtexttextsecondary', iconClass)"
    />
    <span :class="cn('text-Mtexttextprimary', textClass)">
      <slot />
    </span>
  </Primitive>
</template>

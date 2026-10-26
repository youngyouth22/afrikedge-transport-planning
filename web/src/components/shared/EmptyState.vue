<script setup lang="ts">
import type { Component } from 'vue'
import { Inbox } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    actionLabel?: string
    icon?: Component
  }>(),
  {
    title: 'Aucune donnée disponible',
    description: 'Aucun élément ne correspond aux filtres appliqués.',
    icon: Inbox,
  },
)

defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <Empty class="border border-dashed p-10">
    <EmptyHeader>
      <EmptyMedia variant="icon" class="size-18 rounded-2xl mb-3">
        <component :is="icon" class="size-7 text-muted-foreground" />
      </EmptyMedia>
      <EmptyTitle>{{ title }}</EmptyTitle>
      <EmptyDescription>
        {{ description }}
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="actionLabel || $slots.action">
      <slot name="action">
        <Button
          v-if="actionLabel"
          variant="outline"
          class="h-[46px] hover:cursor-pointer"
          @click="$emit('action')"
        >
          {{ actionLabel }}
        </Button>
      </slot>
    </EmptyContent>
  </Empty>
</template>


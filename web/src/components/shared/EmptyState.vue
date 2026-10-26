<script setup lang="ts">
import type { Component } from 'vue'
import { Inbox } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    actionLabel?: string
    icon?: Component
  }>(),
  {
    icon: Inbox,
  },
)

defineEmits<{
  (e: 'action'): void
}>()

const { t } = useI18n()
</script>

<template>
  <Empty class="border border-dashed p-10">
    <EmptyHeader>
      <EmptyMedia variant="icon" class="size-18 rounded-2xl mb-3">
        <component :is="icon" class="size-7 text-muted-foreground" />
      </EmptyMedia>
      <EmptyTitle>{{ title || t('common.noData') }}</EmptyTitle>
      <EmptyDescription>
        {{ description || t('common.noDataDesc') }}
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="actionLabel || $slots.action">
      <slot name="action">
        <Button
          v-if="actionLabel"
          variant="outline"
          class="h-11.5 hover:cursor-pointer"
          @click="$emit('action')"
        >
          {{ actionLabel }}
        </Button>
      </slot>
    </EmptyContent>
  </Empty>
</template>

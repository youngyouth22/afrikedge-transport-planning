<script setup lang="ts">
import { computed } from 'vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from '@lucide/vue'
import type { ConfirmVariant, ButtonVariant } from '@/composables/useConfirmDialog'
import { useI18n } from 'vue-i18n'

export interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  confirmVariant?: ButtonVariant
  loading?: boolean
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  variant: 'default',
  confirmVariant: 'default',
  loading: false,
})

const { t } = useI18n()

const displayTitle = computed(() => props.title || t('common.confirm'))
const displayConfirmText = computed(() => props.confirmText || t('common.confirm'))
const displayCancelText = computed(() => props.cancelText || t('common.cancel'))

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

let isConfirmed = false

function onConfirm() {
  isConfirmed = true
  emit('confirm')
}

function onCancel() {
  isConfirmed = false
  emit('cancel')
}

function onOpenChange(val: boolean) {
  emit('update:open', val)
  if (!val) {
    if (!isConfirmed) {
      emit('cancel')
    }
    isConfirmed = false
  }
}
</script>

<template>
  <AlertDialog :open="open" @update:open="onOpenChange">
    <AlertDialogContent class="sm:max-w-115 p-6">
      <AlertDialogHeader class="space-y-2">
        <AlertDialogTitle class="text-lg font-bold text-foreground">
          {{ displayTitle }}
        </AlertDialogTitle>
        <AlertDialogDescription v-if="description" class="text-sm text-muted-foreground leading-relaxed">
          {{ description }}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter class="mt-6 flex flex-row items-center justify-end gap-3">
        <AlertDialogCancel
          :disabled="loading"
          variant="outline"
          class="h-11.5 px-5 hover:cursor-pointer"
          @pointerdown="isConfirmed = false"
          @click="onCancel"
        >
          {{ displayCancelText }}
        </AlertDialogCancel>

        <AlertDialogAction
          :variant="variant === 'destructive' || confirmVariant === 'destructive' ? 'destructive' : 'default'"
          :disabled="loading"
          class="h-11.5 px-5 hover:cursor-pointer inline-flex items-center justify-center gap-2"
          @pointerdown="isConfirmed = true"
          @click="onConfirm"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <span>{{ displayConfirmText }}</span>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

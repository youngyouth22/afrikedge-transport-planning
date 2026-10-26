<script setup lang="ts">
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
  title: 'Êtes-vous absolument sûr ?',
  description: 'Cette action ne peut pas être annulée.',
  confirmText: 'Continuer',
  cancelText: 'Annuler',
  variant: 'default',
  confirmVariant: 'default',
  loading: false,
})

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
          {{ title }}
        </AlertDialogTitle>
        <AlertDialogDescription class="text-sm text-muted-foreground leading-relaxed">
          {{ description }}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter class="mt-6 flex flex-row items-center justify-end gap-3">
        <AlertDialogCancel
          :disabled="loading"
          variant="outline"
          class="h-11.5 px-5  cursor-pointer "
          @pointerdown="isConfirmed = false"
          @click="onCancel"
        >
          {{ cancelText }}
        </AlertDialogCancel>

        <AlertDialogAction
          :variant="variant === 'destructive' || confirmVariant === 'destructive' ? 'destructive' : 'default'"
          :disabled="loading"
          class="h-11.5 px-5 cursor-pointer inline-flex items-center justify-center gap-2"
          @pointerdown="isConfirmed = true"
          @click="onConfirm"
        >
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <span>{{ confirmText }}</span>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

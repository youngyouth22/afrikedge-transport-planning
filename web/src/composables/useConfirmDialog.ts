import { ref, computed } from 'vue'
import type { Component } from 'vue'

export type ConfirmVariant = 'default' | 'destructive' | 'warning' | 'info'
export type ButtonVariant = 'default' | 'outline' | 'destructive' | 'secondary'

export interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  confirmVariant?: ButtonVariant
  icon?: Component
}

export function useConfirmDialog() {
  const isOpen = ref(false)
  const isLoading = ref(false)
  const options = ref<ConfirmOptions>({
    title: '',
    description: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    variant: 'default',
    confirmVariant: 'default',
  })

  let resolvePromise: ((value: boolean) => void) | null = null

  function confirm(opts: ConfirmOptions): Promise<boolean> {
    options.value = {
      confirmText: 'Confirmer',
      cancelText: 'Annuler',
      variant: 'default',
      confirmVariant: opts.variant === 'destructive' ? 'destructive' : 'default',
      ...opts,
    }
    isOpen.value = true
    isLoading.value = false

    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function handleConfirm() {
    isOpen.value = false
    if (resolvePromise) {
      const fn = resolvePromise
      resolvePromise = null
      fn(true)
    }
  }

  function handleCancel() {
    isOpen.value = false
    if (resolvePromise) {
      const fn = resolvePromise
      resolvePromise = null
      fn(false)
    }
  }

  const confirmDialogProps = computed(() => ({
    open: isOpen.value,
    title: options.value.title,
    description: options.value.description,
    confirmText: options.value.confirmText,
    cancelText: options.value.cancelText,
    variant: options.value.variant,
    confirmVariant: options.value.confirmVariant,
    icon: options.value.icon,
    loading: isLoading.value,
  }))

  return {
    isOpen,
    isLoading,
    options,
    confirm,
    handleConfirm,
    handleCancel,
    confirmDialogProps,
  }
}

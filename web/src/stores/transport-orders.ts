import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  transportOrdersApi,
  type TransportOrderSummary,
} from '../api/transport-orders.api'

export const useTransportOrdersStore = defineStore('transportOrders', () => {
  const orders = ref<TransportOrderSummary[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const statusFilter = ref<string>('all')
  const dateFilter = ref<string>('')

  const filteredOrders = computed(() => {
    return orders.value
  })

  async function fetchOrders() {
    isLoading.value = true
    error.value = null
    try {
      const statusParam =
        statusFilter.value !== 'all' ? parseInt(statusFilter.value, 10) : undefined
      const dateParam = dateFilter.value ? dateFilter.value : undefined

      orders.value = await transportOrdersApi.getAll({
        status: statusParam,
        date: dateParam,
      })
    } catch (err: any) {
      error.value = err.message || 'Impossible de charger les ordres de transport.'
    } finally {
      isLoading.value = false
    }
  }

  function setStatusFilter(status: string) {
    statusFilter.value = status
    fetchOrders()
  }

  function setDateFilter(date: string) {
    dateFilter.value = date
    fetchOrders()
  }

  function resetFilters() {
    statusFilter.value = 'all'
    dateFilter.value = ''
    fetchOrders()
  }

  return {
    orders,
    isLoading,
    error,
    statusFilter,
    dateFilter,
    filteredOrders,
    fetchOrders,
    setStatusFilter,
    setDateFilter,
    resetFilters,
  }
})

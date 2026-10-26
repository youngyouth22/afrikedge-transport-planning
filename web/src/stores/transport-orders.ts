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

  // Pagination
  const page = ref<number>(1)
  const limit = ref<number>(10)
  const total = ref<number>(0)
  const totalPages = ref<number>(0)

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

      const res = await transportOrdersApi.getAll({
        status: statusParam,
        date: dateParam,
        page: page.value,
        limit: limit.value,
      })

      orders.value = res.data
      total.value = res.total
      totalPages.value = res.totalPages
      page.value = res.page
    } catch (err: any) {
      error.value = err.message || 'Impossible de charger les ordres de transport.'
    } finally {
      isLoading.value = false
    }
  }

  function setStatusFilter(status: string) {
    statusFilter.value = status
    page.value = 1
    fetchOrders()
  }

  function setDateFilter(date: string) {
    dateFilter.value = date
    page.value = 1
    fetchOrders()
  }

  function resetFilters() {
    statusFilter.value = 'all'
    dateFilter.value = ''
    page.value = 1
    fetchOrders()
  }

  function setPage(newPage: number) {
    if (newPage >= 1 && (totalPages.value === 0 || newPage <= totalPages.value)) {
      page.value = newPage
      fetchOrders()
    }
  }

  function setLimit(newLimit: number) {
    limit.value = newLimit
    page.value = 1
    fetchOrders()
  }

  function prevPage() {
    if (page.value > 1) {
      setPage(page.value - 1)
    }
  }

  function nextPage() {
    if (page.value < totalPages.value) {
      setPage(page.value + 1)
    }
  }

  return {
    orders,
    isLoading,
    error,
    page,
    limit,
    total,
    totalPages,
    statusFilter,
    dateFilter,
    filteredOrders,
    fetchOrders,
    setStatusFilter,
    setDateFilter,
    resetFilters,
    setPage,
    setLimit,
    prevPage,
    nextPage,
  }
})


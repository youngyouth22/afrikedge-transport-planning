import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { salesOrdersApi, type SalesOrderToPlan } from '../api/sales-orders.api'

export const useSalesOrdersStore = defineStore('salesOrders', () => {
  const orders = ref<SalesOrderToPlan[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const cityFilter = ref<string>('all')
  const searchQuery = ref<string>('')
  const selectedOrderNos = ref<Set<string>>(new Set())

  // Récupérer les villes uniques disponibles dans les commandes
  const availableCities = computed(() => {
    const cities = new Set<string>()
    orders.value.forEach((order) => {
      if (order.deliveryCity) cities.add(order.deliveryCity)
    })
    return Array.from(cities).sort()
  })

  // Commandes filtrées côté client par recherche textuelle
  const filteredOrders = computed(() => {
    let result = orders.value

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      result = result.filter(
        (o) =>
          o.salesOrderNo.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.deliveryCity.toLowerCase().includes(q),
      )
    }

    return result
  })

  // Commandes sélectionnées
  const selectedOrders = computed(() =>
    orders.value.filter((o) => selectedOrderNos.value.has(o.salesOrderNo)),
  )

  const selectedCount = computed(() => selectedOrderNos.value.size)

  const selectedTotalWeight = computed(() => {
    const total = selectedOrders.value.reduce((sum, o) => sum + o.totalWeightKg, 0)
    return Math.round(total * 100) / 100
  })

  async function fetchOrders() {
    isLoading.value = true
    error.value = null
    try {
      orders.value = await salesOrdersApi.getToPlan(
        cityFilter.value === 'all' ? undefined : cityFilter.value,
      )
      // Nettoyer les sélections qui ne sont plus dans les résultats
      const validNos = new Set(orders.value.map((o) => o.salesOrderNo))
      selectedOrderNos.value = new Set(
        Array.from(selectedOrderNos.value).filter((no) => validNos.has(no)),
      )
    } catch (err: any) {
      error.value = err.message || 'Impossible de charger les commandes à planifier.'
    } finally {
      isLoading.value = false
    }
  }

  function toggleSelection(salesOrderNo: string) {
    const next = new Set(selectedOrderNos.value)
    if (next.has(salesOrderNo)) {
      next.delete(salesOrderNo)
    } else {
      next.add(salesOrderNo)
    }
    selectedOrderNos.value = next
  }

  function selectAllCurrent(select: boolean) {
    if (!select) {
      selectedOrderNos.value = new Set()
      return
    }
    const next = new Set(selectedOrderNos.value)
    filteredOrders.value.forEach((o) => next.add(o.salesOrderNo))
    selectedOrderNos.value = next
  }

  function clearSelection() {
    selectedOrderNos.value = new Set()
  }

  function setCityFilter(city: string) {
    cityFilter.value = city
    fetchOrders()
  }

  return {
    orders,
    isLoading,
    error,
    cityFilter,
    searchQuery,
    selectedOrderNos,
    availableCities,
    filteredOrders,
    selectedOrders,
    selectedCount,
    selectedTotalWeight,
    fetchOrders,
    toggleSelection,
    selectAllCurrent,
    clearSelection,
    setCityFilter,
  }
})

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { salesOrdersApi, type SalesOrderToPlan } from '../api/sales-orders.api'
import { getLocalizedErrorMessage } from '@/lib/error-translator'

const KNOWN_CITIES = ['Bafoussam', 'Douala', 'Edéa', 'Kribi', 'Limbé', 'Yaoundé']

export const useSalesOrdersStore = defineStore('salesOrders', () => {
  const orders = ref<SalesOrderToPlan[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Pagination
  const page = ref<number>(1)
  const limit = ref<number>(10)
  const total = ref<number>(0)
  const totalPages = ref<number>(0)

  // Filtres
  const cityFilter = ref<string>('all')
  const searchQuery = ref<string>('')

  // Map persistant pour conserver les sélections à travers toutes les pages
  const selectedOrdersMap = ref<Map<string, SalesOrderToPlan>>(new Map())

  // Liste des villes disponibles pour le filtre
  const availableCities = computed(() => {
    const cities = new Set<string>(KNOWN_CITIES)
    orders.value.forEach((order) => {
      if (order.deliveryCity) cities.add(order.deliveryCity)
    })
    return Array.from(cities).sort()
  })

  // Commandes filtrées côté client par recherche textuelle sur la page courante
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

  // Commandes sélectionnées (toutes pages confondues)
  const selectedOrders = computed(() => Array.from(selectedOrdersMap.value.values()))
  const selectedOrderNos = computed(() => new Set(selectedOrdersMap.value.keys()))
  const selectedCount = computed(() => selectedOrdersMap.value.size)

  const selectedTotalWeight = computed(() => {
    const sum = selectedOrders.value.reduce((total, o) => total + o.totalWeightKg, 0)
    return Math.round(sum * 100) / 100
  })

  async function fetchOrders() {
    isLoading.value = true
    error.value = null
    try {
      const res = await salesOrdersApi.getToPlan(
        cityFilter.value === 'all' ? undefined : cityFilter.value,
        page.value,
        limit.value,
      )
      orders.value = res.data
      total.value = res.total
      totalPages.value = res.totalPages
      page.value = res.page
    } catch (err: any) {
      error.value = getLocalizedErrorMessage(err)
    } finally {
      isLoading.value = false
    }
  }

  function toggleSelection(order: SalesOrderToPlan) {
    const next = new Map(selectedOrdersMap.value)
    if (next.has(order.salesOrderNo)) {
      next.delete(order.salesOrderNo)
    } else {
      next.set(order.salesOrderNo, order)
    }
    selectedOrdersMap.value = next
  }

  function selectAllCurrent(select: boolean) {
    const next = new Map(selectedOrdersMap.value)
    if (select) {
      filteredOrders.value.forEach((o) => next.set(o.salesOrderNo, o))
    } else {
      filteredOrders.value.forEach((o) => next.delete(o.salesOrderNo))
    }
    selectedOrdersMap.value = next
  }

  function clearSelection() {
    selectedOrdersMap.value = new Map()
  }

  function setCityFilter(city: string) {
    cityFilter.value = city
    page.value = 1 // Réinitialisation de la page lors du changement de filtre ville
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
    cityFilter,
    searchQuery,
    selectedOrdersMap,
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
    setPage,
    setLimit,
    prevPage,
    nextPage,
  }
})


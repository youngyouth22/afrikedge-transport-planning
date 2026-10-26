import { apiFetch } from './client'

export interface SalesOrderToPlan {
  salesOrderNo: string
  customerNo: string
  customerName: string
  deliveryCity: string
  totalWeightKg: number
  status: number
}

export const salesOrdersApi = {
  async getToPlan(city?: string, page?: number, limit?: number): Promise<SalesOrderToPlan[]> {
    const params = new URLSearchParams()
    if (city && city !== 'all') params.set('city', city)
    if (page) params.set('page', String(page))
    if (limit) params.set('limit', String(limit))

    const queryString = params.toString() ? `?${params.toString()}` : ''
    return apiFetch<SalesOrderToPlan[]>(`/sales-orders/to-plan${queryString}`)
  },
}

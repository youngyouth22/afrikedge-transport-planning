import { apiFetch } from './client'

export interface SalesOrderToPlan {
  salesOrderNo: string
  customerNo: string
  customerName: string
  deliveryCity: string
  totalWeightKg: number
  status: number
}

export interface PaginatedSalesOrdersResponse {
  data: SalesOrderToPlan[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const salesOrdersApi = {
  async getToPlan(
    city?: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedSalesOrdersResponse> {
    const params = new URLSearchParams()
    if (city && city !== 'all') params.set('city', city)
    if (page) params.set('page', String(page))
    if (limit) params.set('limit', String(limit))

    const queryString = params.toString() ? `?${params.toString()}` : ''
    return apiFetch<PaginatedSalesOrdersResponse>(`/sales-orders/to-plan${queryString}`)
  },
}


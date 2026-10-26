import { apiFetch } from './client'

export interface TransportOrderSummary {
  no: string
  vehicleCode: string
  vehiclePlateNo: string
  vehicleCapacityKg: number
  deliveryDate: string
  status: number
  createdBy: string
  validatedBy: string | null
  ordersCount: number
  totalWeightKg: number
}

export interface TransportOrderLineDetail {
  salesOrderNo: string
  customerNo: string
  customerName: string
  deliveryCity: string
  totalWeightKg: number
  status: number
}

export interface TransportOrderDetail {
  no: string
  vehicleCode: string
  vehiclePlateNo: string
  vehicleCapacityKg: number
  deliveryDate: string
  status: number
  createdBy: string
  validatedBy: string | null
  totalWeightKg: number
  orders: TransportOrderLineDetail[]
}

export const transportOrdersApi = {
  async getAll(filters?: {
    status?: number
    date?: string
    page?: number
    limit?: number
  }): Promise<TransportOrderSummary[]> {
    const params = new URLSearchParams()
    if (filters?.status !== undefined && filters.status !== null) {
      params.set('status', String(filters.status))
    }
    if (filters?.date) {
      params.set('date', filters.date)
    }
    if (filters?.page) {
      params.set('page', String(filters.page))
    }
    if (filters?.limit) {
      params.set('limit', String(filters.limit))
    }

    const queryString = params.toString() ? `?${params.toString()}` : ''
    return apiFetch<TransportOrderSummary[]>(`/transport-orders${queryString}`)
  },

  async getOne(no: string): Promise<TransportOrderDetail> {
    return apiFetch<TransportOrderDetail>(`/transport-orders/${encodeURIComponent(no)}`)
  },

  async create(data: { vehicleCode: string; deliveryDate: string }): Promise<{ no: string }> {
    return apiFetch<{ no: string }>('/transport-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async addLines(
    no: string,
    salesOrderNos: string[],
  ): Promise<{ success: boolean; added: number; totalWeightKg: number }> {
    return apiFetch<{ success: boolean; added: number; totalWeightKg: number }>(
      `/transport-orders/${encodeURIComponent(no)}/lines`,
      {
        method: 'POST',
        body: JSON.stringify({ salesOrderNos }),
      },
    )
  },

  async removeLine(no: string, salesOrderNo: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(
      `/transport-orders/${encodeURIComponent(no)}/lines/${encodeURIComponent(salesOrderNo)}`,
      {
        method: 'DELETE',
      },
    )
  },

  async validate(no: string): Promise<{ success: boolean; status: number }> {
    return apiFetch<{ success: boolean; status: number }>(
      `/transport-orders/${encodeURIComponent(no)}/validate`,
      {
        method: 'POST',
      },
    )
  },

  async depart(no: string): Promise<{ success: boolean; status: number }> {
    return apiFetch<{ success: boolean; status: number }>(
      `/transport-orders/${encodeURIComponent(no)}/depart`,
      {
        method: 'POST',
      },
    )
  },
}

import { apiFetch } from './client'

export interface Vehicle {
  code: string
  plateNo: string
  capacityKg: number
  active: boolean
}

export const vehiclesApi = {
  async getActive(): Promise<Vehicle[]> {
    return apiFetch<Vehicle[]>('/vehicles')
  },
}

import { api } from './api'
import { CableColor, PaginatedResponse } from '@/types'

export const cableColorsService = {
  async getAll(params?: {
    page?: number
    per_page?: number
  }): Promise<PaginatedResponse<CableColor>> {
    const response = await api.get('/cable_colors', { params })
    const data = response.data
    
    return {
      data: data.cable_colors || data.data || [],
      total: data.total || 0,
      page: data.page || 1,
      per_page: data.per_page || 20,
      total_pages: Math.ceil((data.total || 0) / (data.per_page || 20)),
    }
  },

  async getById(id: number): Promise<CableColor> {
    const response = await api.get(`/cable_colors/${id}`)
    return response.data
  },

  async create(data: { name: string; hex_code: string }): Promise<CableColor> {
    const response = await api.post('/cable_colors', data)
    return response.data
  },

  async update(id: number, data: { name?: string; hex_code?: string }): Promise<CableColor> {
    const response = await api.put(`/cable_colors/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/cable_colors/${id}`)
  },
}
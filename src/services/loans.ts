import { api } from './api'
import { Loan, PaginatedResponse } from '@/types'

export const loansService = {
  async getAll(params?: {
    page?: number
    per_page?: number
    search?: string
    status?: 'active' | 'returned'
    item_id?: string
    student_number?: string
  }): Promise<PaginatedResponse<Loan>> {
    const response = await api.get('/loans', { params })
    const data = response.data
    
    // Transform API response to match our PaginatedResponse interface
    return {
      data: data.loans || data.items || data || [],
      total: data.total || 0,
      page: data.page || 1,
      per_page: data.per_page || 20,
      total_pages: Math.ceil((data.total || 0) / (data.per_page || 20)),
    }
  },

  async getById(id: number): Promise<Loan> {
    const response = await api.get(`/loans/${id}`)
    return response.data
  },

  async create(data: Omit<Loan, 'id' | 'created_at' | 'updated_at' | 'item'>): Promise<Loan> {
    const response = await api.post('/loans', data)
    return response.data
  },

  async returnItem(id: number, data: { remarks?: string }): Promise<Loan> {
    const response = await api.post(`/loans/${id}/return`, data)
    return response.data
  },

  async getActiveByItemId(itemId: string): Promise<Loan | null> {
    const response = await api.get(`/items/${itemId}/active-loan`)
    return response.data
  },

  async getHistory(params?: {
    page?: number
    per_page?: number
    item_id?: string
    student_number?: string
  }): Promise<PaginatedResponse<Loan>> {
    const response = await api.get('/loans/history', { params })
    return response.data
  },
}
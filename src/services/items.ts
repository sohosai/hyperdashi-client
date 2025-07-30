import { api } from './api'
import { Item, PaginatedResponse } from '@/types'

export const itemsService = {
  async getAll(params?: {
    page?: number
    per_page?: number
    search?: string
    status?: 'available' | 'on_loan' | 'disposed'
    container_id?: string
    storage_type?: string
  }): Promise<PaginatedResponse<Item>> {
    // Transform status parameter to backend field names
    const apiParams: any = { ...params }
    if (params?.status) {
      delete apiParams.status
      switch (params.status) {
        case 'available':
          apiParams.is_on_loan = false
          apiParams.is_disposed = false
          break
        case 'on_loan':
          apiParams.is_on_loan = true
          break
        case 'disposed':
          apiParams.is_disposed = true
          break
      }
    }
    
    const response = await api.get('/items', { params: apiParams })
    const data = response.data
    
    // Transform API response to match our PaginatedResponse interface
    return {
      data: data.items || [],
      total: data.total || 0,
      page: data.page || 1,
      per_page: data.per_page || 20,
      total_pages: Math.ceil((data.total || 0) / (data.per_page || 20)),
    }
  },

  async getById(id: number): Promise<Item> {
    const response = await api.get(`/items/${id}`)
    return response.data
  },

  async create(data: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item> {
    const response = await api.post('/items', data)
    return response.data
  },

  async update(id: number, data: Partial<Omit<Item, 'id' | 'created_at' | 'updated_at'>>): Promise<Item> {
    const response = await api.put(`/items/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/items/${id}`)
  },

  async uploadImage(id: number, file: File): Promise<{ image_url: string }> {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await api.post(`/items/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async dispose(id: number): Promise<Item> {
    const response = await api.post(`/items/${id}/dispose`)
    return response.data
  },

  async undispose(id: number): Promise<Item> {
    const response = await api.post(`/items/${id}/undispose`)
    return response.data
  },

  async getByLabelId(labelId: string): Promise<Item> {
    const response = await api.get(`/items/by-label/${labelId}`)
    return response.data
  },

  async getSuggestions(field: 'connection_names' | 'cable_color_pattern' | 'storage_location'): Promise<string[]> {
    try {
      // Try to get suggestions from a dedicated endpoint if available
      // Note: backend uses plural for storage_locations endpoint
      const endpoint = field === 'storage_location' ? 'storage_locations' : field
      const response = await api.get(`/items/suggestions/${endpoint}`)
      return response.data.suggestions || []
    } catch (error) {
      // If endpoint doesn't exist, extract from all items
      const allItems = await this.getAll({ per_page: 1000 })
      const suggestions = new Set<string>()
      
      allItems.data.forEach(item => {
        const fieldValue = item[field]
        if (field === 'storage_location' && typeof fieldValue === 'string' && fieldValue) {
          // storage_location is a single string
          suggestions.add(fieldValue.trim())
        } else if (Array.isArray(fieldValue)) {
          // connection_names and cable_color_pattern are arrays
          fieldValue.forEach(value => {
            if (value && typeof value === 'string') {
              suggestions.add(value.trim())
            }
          })
        }
      })
      
      return Array.from(suggestions).sort()
    }
  },
}
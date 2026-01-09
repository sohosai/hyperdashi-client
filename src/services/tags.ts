import { api } from './api'
import { Tag, PaginatedResponse } from '@/types'

export const tagsService = {
    async getAll(params?: {
        page?: number
        per_page?: number
        search?: string
    }): Promise<PaginatedResponse<Tag>> {
        const response = await api.get('/tags', { params })
        const data = response.data

        // API returns { tags: [], total: ... } but we need { data: [], total: ... }
        return {
            data: data.tags || [],
            total: data.total || 0,
            page: data.page || 1,
            per_page: data.per_page || 100,
            total_pages: Math.ceil((data.total || 0) / (data.per_page || 100)),
        }
    },

    async getById(id: number): Promise<Tag> {
        const response = await api.get(`/tags/${id}`)
        return response.data
    },

    async create(data: Omit<Tag, 'id' | 'created_at' | 'updated_at'>): Promise<Tag> {
        const response = await api.post('/tags', data)
        return response.data
    },

    async update(id: number, data: Partial<Omit<Tag, 'id' | 'created_at' | 'updated_at'>>): Promise<Tag> {
        const response = await api.put(`/tags/${id}`, data)
        return response.data
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/tags/${id}`)
    },

    // Item-Tag Associations
    async getItemTags(itemId: string): Promise<Tag[]> {
        const response = await api.get(`/items/${itemId}/tags`)
        return response.data
    },

    async setItemTags(itemId: string, tagIds: number[]): Promise<Tag[]> {
        const response = await api.put(`/items/${itemId}/tags`, { tag_ids: tagIds })
        return response.data
    }
}

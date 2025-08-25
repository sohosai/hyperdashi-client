import { api } from './api'

export interface Container {
  id: string
  name: string
  description?: string
  location: string
  created_at: string
  updated_at: string
  is_disposed: boolean
  image_url?: string
}

export interface ContainerWithItemCount extends Container {
  item_count: number
}

export interface CreateContainerRequest {
  id?: string
  name: string
  description?: string
  location: string
  image_url?: string
}

export interface UpdateContainerRequest {
  id?: string
  name?: string
  description?: string
  location?: string
  is_disposed?: boolean
  image_url?: string
}

export interface BulkDeleteContainersRequest {
  ids: string[]
}

export interface BulkUpdateContainersDisposedStatusRequest {
  ids: string[]
  is_disposed: boolean
}

export interface ListContainersQuery {
  location?: string
  include_disposed?: boolean
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface CreateContainerResponse {
  container: Container
}

export interface GetContainerResponse {
  container: Container
}

export interface ListContainersResponse {
  containers: ContainerWithItemCount[]
}

export interface UpdateContainerResponse {
  container: Container
}

export const containerService = {
  async createContainer(data: CreateContainerRequest): Promise<CreateContainerResponse> {
    const response = await api.post<CreateContainerResponse>('/containers', data)
    return response.data
  },

  async checkContainerId(id: string): Promise<{ exists: boolean }> {
    const response = await api.get<{ exists: boolean }>(`/containers/check/${id}`)
    return response.data
  },

  async getContainer(id: string): Promise<GetContainerResponse> {
    const response = await api.get<GetContainerResponse>(`/containers/${id}`)
    return response.data
  },

  async listContainers(query?: ListContainersQuery): Promise<ListContainersResponse> {
    const params = new URLSearchParams()
    if (query?.location) params.append('location', query.location)
    if (query?.include_disposed !== undefined) params.append('include_disposed', query.include_disposed.toString())
    if (query?.search) params.append('search', query.search)
    if (query?.sort_by) params.append('sort_by', query.sort_by)
    if (query?.sort_order) params.append('sort_order', query.sort_order)

    const url = params.toString() ? `/containers?${params.toString()}` : '/containers'
    const response = await api.get<ListContainersResponse>(url)
    return response.data
  },

  async updateContainer(id: string, data: UpdateContainerRequest): Promise<UpdateContainerResponse> {
    const response = await api.put<UpdateContainerResponse>(`/containers/${id}`, data)
    return response.data
  },

  async deleteContainer(id: string): Promise<void> {
    await api.delete(`/containers/${id}`)
  },

  async getContainersByLocation(location: string): Promise<ListContainersResponse> {
    const response = await api.get<ListContainersResponse>(`/containers/by-location/${encodeURIComponent(location)}`)
    return response.data
  },

  async bulkDeleteContainers(data: BulkDeleteContainersRequest): Promise<void> {
    await api.delete('/containers/bulk', { data })
  },

  async bulkUpdateContainersDisposedStatus(data: BulkUpdateContainersDisposedStatusRequest): Promise<void> {
    await api.put('/containers/bulk/disposed', data)
  },
}
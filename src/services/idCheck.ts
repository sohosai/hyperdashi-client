import { api } from './api'

export interface DuplicateItem {
  name: string
  item_type: string // "container" or "item"
}

export interface GlobalIdCheckResponse {
  exists: boolean
  found_in: string[] // "containers", "items"
  duplicates: DuplicateItem[]
}

export const idCheckService = {
  async checkGlobalId(id: string): Promise<GlobalIdCheckResponse> {
    const response = await api.get<GlobalIdCheckResponse>(`/ids/check/${id}`)
    return response.data
  }
}
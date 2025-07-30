import { api } from './api'

export interface GenerateLabelsRequest {
  quantity: number
  record_type: 'qr' | 'barcode' | 'nothing'
}

export interface GenerateLabelsResponse {
  visible_ids: string[]
}

export interface LabelInfo {
  id: string
  used: boolean
  item_name?: string
}

export const labelService = {
  async generateLabels(data: GenerateLabelsRequest): Promise<GenerateLabelsResponse> {
    const response = await api.post<GenerateLabelsResponse>('/labels/generate', data)
    return response.data
  },

  async getLabelInfo(): Promise<LabelInfo[]> {
    const response = await api.get<LabelInfo[]>('/labels')
    return response.data
  }
}
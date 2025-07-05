import { api } from './api'

export const healthService = {
  async check(): Promise<{ status: string; message: string }> {
    try {
      const response = await api.get('/health')
      return response.data
    } catch (error) {
      throw error
    }
  },

  async ping(): Promise<boolean> {
    try {
      await this.check()
      return true
    } catch (error) {
      return false
    }
  },
}
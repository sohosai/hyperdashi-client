import { api } from './api'

export const imagesService = {
  async upload(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async delete(filename: string): Promise<void> {
    await api.delete(`/images/${filename}`)
  },
}
import { api } from './api'

export const imagesService = {
  async upload(file: File): Promise<{ url: string; filename: string; size: number }> {
    const formData = new FormData()
    formData.append('image', file)  // API仕様に合わせてフィールド名を'image'に変更
    
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
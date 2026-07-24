import { api } from './api'

export interface BackendVersion {
  version: string
  revision: string
}

export async function getBackendVersion(): Promise<BackendVersion> {
  const response = await api.get<BackendVersion>('/version')
  return response.data
}

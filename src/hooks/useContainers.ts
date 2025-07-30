import { useState, useEffect } from 'react'
import { containerService, Container, ContainerWithItemCount, CreateContainerRequest, UpdateContainerRequest, ListContainersQuery } from '../services'

export function useContainers(query?: ListContainersQuery) {
  const [containers, setContainers] = useState<ContainerWithItemCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContainers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await containerService.listContainers(query)
      setContainers(response.containers)
    } catch (err) {
      setError(err instanceof Error ? err.message : '容器の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContainers()
  }, [query?.location, query?.include_disposed])

  const createContainer = async (data: CreateContainerRequest) => {
    try {
      setError(null)
      const response = await containerService.createContainer(data)
      await fetchContainers() // リストを更新
      return response.container
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '容器の作成に失敗しました'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }

  const updateContainer = async (id: string, data: UpdateContainerRequest) => {
    try {
      setError(null)
      const response = await containerService.updateContainer(id, data)
      await fetchContainers() // リストを更新
      return response.container
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '容器の更新に失敗しました'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }

  const deleteContainer = async (id: string) => {
    try {
      setError(null)
      await containerService.deleteContainer(id)
      await fetchContainers() // リストを更新
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '容器の削除に失敗しました'
      setError(errorMsg)
      throw new Error(errorMsg)
    }
  }

  return {
    containers,
    loading,
    error,
    refetch: fetchContainers,
    createContainer,
    updateContainer,
    deleteContainer
  }
}

export function useContainer(id: string | null) {
  const [container, setContainer] = useState<Container | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContainer = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await containerService.getContainer(id)
      setContainer(response.container)
    } catch (err) {
      setError(err instanceof Error ? err.message : '容器の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContainer()
  }, [id])

  return {
    container,
    loading,
    error,
    refetch: fetchContainer
  }
}

export function useContainersByLocation(location: string | null) {
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContainers = async () => {
    if (!location) {
      setContainers([])
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      const response = await containerService.getContainersByLocation(location)
      setContainers(response.containers)
    } catch (err) {
      setError(err instanceof Error ? err.message : '容器の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContainers()
  }, [location])

  return {
    containers,
    loading,
    error,
    refetch: fetchContainers
  }
}
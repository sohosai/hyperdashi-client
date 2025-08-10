import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { containerService } from '@/services'
import {
  CreateContainerRequest,
  UpdateContainerRequest,
  BulkDeleteContainersRequest,
  BulkUpdateContainersDisposedStatusRequest,
} from '@/services'

export function useContainers(params?: {
  location?: string
  include_disposed?: boolean
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}) {
  return useQuery({
    queryKey: ['containers', params],
    queryFn: () => containerService.listContainers(params),
  })
}

export function useContainer(id: string | null) {
  return useQuery({
    queryKey: ['containers', id],
    // Unwrap the { container } shape so consumers get Container directly
    queryFn: async () => {
      if (!id) return null
      const res = await containerService.getContainer(id)
      return res.container
    },
    enabled: !!id,
  })
}

export function useCreateContainer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateContainerRequest) => containerService.createContainer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

export function useUpdateContainer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateContainerRequest> }) =>
      containerService.updateContainer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      queryClient.invalidateQueries({ queryKey: ['containers', id] })
    },
  })
}

export function useDeleteContainer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => containerService.deleteContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

export function useBulkDeleteContainers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkDeleteContainersRequest) => containerService.bulkDeleteContainers(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

export function useBulkUpdateContainersDisposedStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkUpdateContainersDisposedStatusRequest) =>
      containerService.bulkUpdateContainersDisposedStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

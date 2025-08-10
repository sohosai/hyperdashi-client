import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { itemsService } from '@/services'
import { Item } from '@/types'

export function useItems(params?: {
  page?: number
  per_page?: number
  search?: string
  status?: 'available' | 'on_loan' | 'disposed'
  container_id?: string
  storage_type?: string
}) {
  return useQuery({
    queryKey: ['items', params],
    queryFn: () => itemsService.getAll(params),
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => itemsService.getById(id),
    enabled: !!id && id.length > 0,
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: itemsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Item, 'id' | 'created_at' | 'updated_at'>> }) =>
      itemsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['items', id] })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: itemsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useUploadItemImage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      itemsService.uploadImage(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['items', id] })
    },
  })
}

export function useDisposeItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: itemsService.dispose,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['items', id] })
    },
  })
}

export function useUndisposeItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: itemsService.undispose,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['items', id] })
    },
  })
}

export function useItemSuggestions(field: 'connection_names' | 'cable_color_pattern' | 'storage_location') {
  return useQuery({
    queryKey: ['items', 'suggestions', field],
    queryFn: () => itemsService.getSuggestions(field),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useBulkDeleteItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: itemsService.bulkDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useBulkUpdateItemsDisposedStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, is_disposed }: { ids: string[]; is_disposed: boolean }) =>
      itemsService.bulkUpdateDisposedStatus(ids, is_disposed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useBulkMoveToContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, containerId }: { ids: string[]; containerId: string }) =>
      itemsService.bulkMoveToContainer(ids, containerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useBulkUpdateStorageLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ids, storageLocation }: { ids: string[]; storageLocation: string }) =>
      itemsService.bulkUpdateStorageLocation(ids, storageLocation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
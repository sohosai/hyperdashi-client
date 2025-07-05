import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cableColorsService } from '@/services/cableColors'

export function useCableColors(params?: {
  page?: number
  per_page?: number
}) {
  return useQuery({
    queryKey: ['cableColors', params],
    queryFn: () => cableColorsService.getAll(params),
  })
}

export function useCableColor(id: number) {
  return useQuery({
    queryKey: ['cableColors', id],
    queryFn: () => cableColorsService.getById(id),
    enabled: !!id && id > 0,
  })
}

export function useCreateCableColor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: cableColorsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cableColors'] })
    },
  })
}

export function useUpdateCableColor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; hex_code?: string } }) =>
      cableColorsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cableColors'] })
      queryClient.invalidateQueries({ queryKey: ['cableColors', id] })
    },
  })
}

export function useDeleteCableColor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: cableColorsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cableColors'] })
    },
  })
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { loansService } from '@/services'

export function useLoans(params?: {
  page?: number
  per_page?: number
  search?: string
  status?: 'active' | 'returned'
  item_id?: number
  student_number?: string
}) {
  return useQuery({
    queryKey: ['loans', params],
    queryFn: () => loansService.getAll(params),
  })
}

export function useLoan(id: number) {
  return useQuery({
    queryKey: ['loans', id],
    queryFn: () => loansService.getById(id),
    enabled: !!id,
  })
}

export function useCreateLoan() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: loansService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useReturnItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { remarks?: string } }) =>
      loansService.returnItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useActiveLoan(itemId: number) {
  return useQuery({
    queryKey: ['loans', 'active', itemId],
    queryFn: () => loansService.getActiveByItemId(itemId),
    enabled: !!itemId,
  })
}

export function useLoanHistory(params?: {
  page?: number
  per_page?: number
  item_id?: number
  student_number?: string
}) {
  return useQuery({
    queryKey: ['loans', 'history', params],
    queryFn: () => loansService.getHistory(params),
  })
}
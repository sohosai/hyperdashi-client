import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tagsService } from '@/services/tags'
import { Tag } from '@/types'

export function useTags(params?: { page?: number; per_page?: number; search?: string }) {
    return useQuery({
        queryKey: ['tags', params],
        queryFn: () => tagsService.getAll(params),
    })
}

export function useTag(id: number | null) {
    return useQuery({
        queryKey: ['tag', id],
        queryFn: () => (id ? tagsService.getById(id) : null),
        enabled: !!id,
    })
}

export function useCreateTag() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: tagsService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] })
        },
    })
}

export function useUpdateTag() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Tag, 'id' | 'created_at' | 'updated_at'>> }) => tagsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] })
        },
    })
}

export function useDeleteTag() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: tagsService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] })
        },
    })
}

export function useItemTags(itemId: string) {
    return useQuery({
        queryKey: ['items', itemId, 'tags'],
        queryFn: () => tagsService.getItemTags(itemId),
        enabled: !!itemId,
    })
}

export function useSetItemTags() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ itemId, tagIds }: { itemId: string; tagIds: number[] }) => tagsService.setItemTags(itemId, tagIds),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['items', variables.itemId, 'tags'] })
            queryClient.invalidateQueries({ queryKey: ['items'] })
        },
    })
}

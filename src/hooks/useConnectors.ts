import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Connector } from '@/types'

interface ConnectorsResponse {
    connectors: Connector[]
    total: number
    page: number
    per_page: number
}

interface ConnectorParams {
    page?: number
    per_page?: number
}

export function useConnectors(params: ConnectorParams = {}) {
    return useQuery({
        queryKey: ['connectors', params],
        queryFn: async () => {
            const searchParams = new URLSearchParams()
            if (params.page) searchParams.set('page', params.page.toString())
            if (params.per_page) searchParams.set('per_page', params.per_page.toString())

            const response = await api.get<ConnectorsResponse>(`/connectors?${searchParams.toString()}`)
            return {
                data: response.data.connectors,
                total: response.data.total,
                page: response.data.page,
                per_page: response.data.per_page,
            }
        },
    })
}

export function useConnector(id: number | null) {
    return useQuery({
        queryKey: ['connector', id],
        queryFn: async () => {
            if (!id) return null
            const response = await api.get<Connector>(`/connectors/${id}`)
            return response.data
        },
        enabled: !!id,
    })
}

export function useCreateConnector() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: { name: string; gender?: string; description?: string }) => {
            const response = await api.post<Connector>('/connectors', data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connectors'] })
        },
    })
}

export function useUpdateConnector() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: { name?: string; gender?: string; description?: string } }) => {
            const response = await api.put<Connector>(`/connectors/${id}`, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connectors'] })
        },
    })
}

export function useDeleteConnector() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/connectors/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connectors'] })
        },
    })
}

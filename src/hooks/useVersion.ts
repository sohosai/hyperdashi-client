import { useQuery } from '@tanstack/react-query'
import { getBackendVersion } from '@/services/version'

export function useBackendVersion() {
  return useQuery({
    queryKey: ['backend-version'],
    queryFn: getBackendVersion,
    staleTime: Infinity,
    retry: 1,
  })
}

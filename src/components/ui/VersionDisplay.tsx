import { useBackendVersion } from '@/hooks/useVersion'

const frontendRevision = import.meta.env.VITE_GIT_SHA ?? 'local'

export function VersionDisplay() {
  const { data, isError } = useBackendVersion()

  return (
    <div className="text-xs text-foreground-500">
      Frontend {__APP_VERSION__} ({frontendRevision})
      {' | '}
      Backend{' '}
      {isError
        ? 'unavailable'
        : `${data?.version ?? '...'} (${data?.revision ?? '...'})`}
    </div>
  )
}

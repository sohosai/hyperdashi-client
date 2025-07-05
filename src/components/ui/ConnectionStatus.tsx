import { useEffect, useState } from 'react'
import { Chip } from '@heroui/react'
import { Wifi, WifiOff } from 'lucide-react'
import { healthService } from '@/services'

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      const connected = await healthService.ping()
      setIsConnected(connected)
    } catch (error) {
      setIsConnected(false)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isConnected === null) {
    return (
      <Chip
        size="sm"
        variant="flat"
        color="default"
        startContent={<Wifi size={14} />}
      >
        接続確認中...
      </Chip>
    )
  }

  return (
    <Chip
      size="sm"
      variant="flat"
      color={isConnected ? 'success' : 'danger'}
      startContent={isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
      className="cursor-pointer"
      onClick={checkConnection}
    >
      {isChecking ? '確認中...' : isConnected ? 'API接続済み' : 'API未接続'}
    </Chip>
  )
}
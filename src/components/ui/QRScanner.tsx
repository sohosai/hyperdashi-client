import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button, Card, CardBody } from '@heroui/react'
import { Camera, CameraOff } from 'lucide-react'

interface QRScannerProps {
  onScan: (labelId: string) => void
  onError?: (error: string) => void
  isActive: boolean
  onToggle: (active: boolean) => void
}

export function QRScanner({ onScan, onError, isActive, onToggle }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isActive && elementRef.current && !scannerRef.current) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
      }

      scannerRef.current = new Html5QrcodeScanner('qr-reader', config, false)
      
      scannerRef.current.render(
        (decodedText: string) => {
          console.log('QR Code scanned:', decodedText)
          onScan(decodedText)
        },
        (error: string) => {
          // Ignore frequent scanning errors - they're normal
          if (!error.includes('NotFoundException')) {
            console.error('QR scan error:', error)
            onError?.(error)
          }
        }
      )
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear()
        } catch (error) {
          console.error('Error clearing scanner:', error)
        }
        scannerRef.current = null
      }
    }
  }, [isActive, onScan, onError])

  const handleToggle = () => {
    const newActive = !isActive
    onToggle(newActive)
  }

  return (
    <Card>
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">QRコードスキャナー</h3>
            <p className="text-sm text-gray-600">
              {isActive ? 'カメラでQRコードを読み取ってください' : 'スキャンを開始するにはボタンを押してください'}
            </p>
          </div>
          <Button
            color={isActive ? 'danger' : 'primary'}
            variant="flat"
            startContent={isActive ? <CameraOff size={16} /> : <Camera size={16} />}
            onPress={handleToggle}
          >
            {isActive ? 'スキャン停止' : 'スキャン開始'}
          </Button>
        </div>

        {isActive && (
          <div className="border rounded-lg overflow-hidden">
            <div id="qr-reader" ref={elementRef} style={{ width: '100%' }}></div>
          </div>
        )}

        {!isActive && (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <div className="text-center text-gray-500">
              <Camera size={48} className="mx-auto mb-2" />
              <p>スキャンを開始してください</p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
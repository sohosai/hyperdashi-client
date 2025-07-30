import React, { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Card, CardBody } from '@heroui/react'

interface QRCodeDisplayProps {
  value: string
  size?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  title?: string
  className?: string
  showCard?: boolean
}

export function QRCodeDisplay({ 
  value, 
  size = 256, 
  errorCorrectionLevel = 'M',
  title,
  className = '',
  showCard = true
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!value || !canvasRef.current) return

    const generateQRCode = async () => {
      try {
        const canvas = canvasRef.current!
        // canvasのサイズを明示的に設定
        canvas.width = size
        canvas.height = size
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
        
        // 背景を白で塗りつぶし
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, size, size)
        }
        
        await QRCode.toCanvas(canvas, value, {
          width: size,
          margin: 2,
          errorCorrectionLevel: errorCorrectionLevel,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setError('')
      } catch (err) {
        console.error('QR Code generation error:', err)
        setError('QRコードの生成に失敗しました')
      }
    }

    // DOMが準備されてから実行
    generateQRCode()
  }, [value, size, errorCorrectionLevel])

  if (!value) {
    if (!showCard) {
      return (
        <div className="text-center text-gray-500">
          <div className="text-sm">QRコードを生成できません</div>
        </div>
      )
    }
    return (
      <Card className={className}>
        <CardBody className="flex items-center justify-center p-4">
          <div className="text-center text-gray-500">
            <div className="text-sm">QRコードを生成できません</div>
          </div>
        </CardBody>
      </Card>
    )
  }

  if (error) {
    if (!showCard) {
      return (
        <div className="text-center text-red-500">
          <div className="text-sm">{error}</div>
        </div>
      )
    }
    return (
      <Card className={className}>
        <CardBody className="flex items-center justify-center p-4">
          <div className="text-center text-red-500">
            <div className="text-sm">{error}</div>
          </div>
        </CardBody>
      </Card>
    )
  }

  const content = (
    <>
      {title && showCard && (
        <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
      )}
      <div className={showCard ? "bg-white p-4 rounded-lg border" : ""}>
        <canvas 
          ref={canvasRef} 
          width={size}
          height={size}
          style={{ 
            maxWidth: '100%', 
            height: 'auto',
            display: 'block'
          }}
        />
      </div>
      {showCard && (
        <div className="text-xs text-gray-500 mt-2 text-center">
          {value}
        </div>
      )}
    </>
  )

  if (!showCard) {
    return <div className={`flex flex-col items-center ${className}`}>{content}</div>
  }

  return (
    <Card className={className}>
      <CardBody className="flex flex-col items-center p-4">
        {content}
      </CardBody>
    </Card>
  )
}
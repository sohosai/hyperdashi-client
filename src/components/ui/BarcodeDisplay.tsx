import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { Card, CardBody } from '@heroui/react'

interface BarcodeDisplayProps {
  value: string
  format?: 'CODE128' | 'CODE39' | 'EAN13'
  width?: number
  height?: number
  title?: string
  className?: string
  showCard?: boolean
}

export function BarcodeDisplay({ 
  value, 
  format = 'CODE128',
  width = 2,
  height = 80,
  title,
  className = '',
  showCard = true
}: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: format,
          width: width,
          height: height,
          displayValue: false,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000'
        })
      } catch (error) {
        console.error('Barcode generation error:', error)
      }
    }
  }, [value, format, width, height])

  if (!value) {
    if (!showCard) {
      return (
        <div className="text-center text-gray-500">
          <div className="text-sm">バーコードを生成できません</div>
        </div>
      )
    }
    return (
      <Card className={className}>
        <CardBody className="flex items-center justify-center p-4">
          <div className="text-center text-gray-500">
            <div className="text-sm">バーコードを生成できません</div>
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
        <svg 
          ref={svgRef}
          style={{ 
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
        ></svg>
      </div>
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
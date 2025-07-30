import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, Tabs, Tab, Select, SelectItem } from '@heroui/react'
import { Download, Printer, QrCode, BarChart3 } from 'lucide-react'
import { QRCodeDisplay } from './QRCodeDisplay'
import { BarcodeDisplay } from './BarcodeDisplay'

interface LabelGeneratorProps {
  item: {
    id: number
    label_id: string
    name: string
    model_number?: string
  }
  labelType?: 'qr' | 'barcode'
  onPrint?: () => void
  onDownload?: () => void
  className?: string
}

export function LabelGenerator({ 
  item, 
  labelType = 'qr',
  onPrint,
  onDownload,
  className = ''
}: LabelGeneratorProps) {
  const [selectedType, setSelectedType] = useState<'qr' | 'barcode'>(labelType)
  const [qrSize, setQrSize] = useState(200)
  const [barcodeFormat, setBarcodeFormat] = useState<'CODE128' | 'CODE39' | 'EAN13'>('CODE128')

  const handlePrint = () => {
    const printContent = document.getElementById('label-print-area')
    if (printContent) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>ラベル印刷 - ${item.name}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                .label-container {
                  text-align: center;
                  border: 2px solid #333;
                  padding: 20px;
                  border-radius: 8px;
                  background: white;
                }
                .label-title {
                  font-size: 16px;
                  font-weight: bold;
                  margin-bottom: 10px;
                }
                .label-id {
                  font-size: 14px;
                  margin-bottom: 15px;
                  color: #666;
                }
                @media print {
                  body { margin: 0; }
                  .label-container { border: 1px solid #333; }
                }
              </style>
            </head>
            <body>
              <div class="label-container">
                <div class="label-title">${item.name}</div>
                <div class="label-id">${item.label_id}</div>
                ${printContent.innerHTML}
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
    onPrint?.()
  }

  const handleDownload = async () => {
    try {
      // SVGをキャンバスに描画してPNG画像としてダウンロード
      const labelElement = document.getElementById('label-print-area')
      if (labelElement) {
        // html2canvasが利用可能な場合の処理
        // 現在は簡易実装として、SVGを直接ダウンロード
        const svgElement = labelElement.querySelector('svg')
        if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement)
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
          const svgUrl = URL.createObjectURL(svgBlob)
          
          const downloadLink = document.createElement('a')
          downloadLink.href = svgUrl
          downloadLink.download = `label_${item.label_id}_${selectedType}.svg`
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
          URL.revokeObjectURL(svgUrl)
        }
      }
    } catch (error) {
      console.error('Download error:', error)
    }
    onDownload?.()
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {selectedType === 'qr' ? <QrCode size={20} /> : <BarChart3 size={20} />}
            ラベル生成
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<Download size={16} />}
              onPress={handleDownload}
            >
              ダウンロード
            </Button>
            <Button
              size="sm"
              color="primary"
              startContent={<Printer size={16} />}
              onPress={handlePrint}
            >
              印刷
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex gap-4">
          <Select
            label="ラベルタイプ"
            selectedKeys={[selectedType]}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as 'qr' | 'barcode'
              setSelectedType(key)
            }}
            size="sm"
            className="w-32"
          >
            <SelectItem key="qr">QRコード</SelectItem>
            <SelectItem key="barcode">バーコード</SelectItem>
          </Select>

          {selectedType === 'qr' && (
            <Select
              label="サイズ"
              selectedKeys={[qrSize.toString()]}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as string
                setQrSize(parseInt(key))
              }}
              size="sm"
              className="w-24"
            >
              <SelectItem key="150">小</SelectItem>
              <SelectItem key="200">中</SelectItem>
              <SelectItem key="300">大</SelectItem>
            </Select>
          )}

          {selectedType === 'barcode' && (
            <Select
              label="形式"
              selectedKeys={[barcodeFormat]}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as 'CODE128' | 'CODE39' | 'EAN13'
                setBarcodeFormat(key)
              }}
              size="sm"
              className="w-32"
            >
              <SelectItem key="CODE128">CODE128</SelectItem>
              <SelectItem key="CODE39">CODE39</SelectItem>
              <SelectItem key="EAN13">EAN13</SelectItem>
            </Select>
          )}
        </div>

        <div id="label-print-area" className="flex justify-center">
          {selectedType === 'qr' ? (
            <QRCodeDisplay 
              value={item.label_id}
              size={qrSize}
              title={`${item.name} ${item.model_number ? `(${item.model_number})` : ''}`}
            />
          ) : (
            <BarcodeDisplay 
              value={item.label_id}
              format={barcodeFormat}
              title={`${item.name} ${item.model_number ? `(${item.model_number})` : ''}`}
            />
          )}
        </div>

        <div className="text-sm text-gray-600 text-center">
          <div><strong>備品名:</strong> {item.name}</div>
          {item.model_number && <div><strong>型番:</strong> {item.model_number}</div>}
          <div><strong>ラベルID:</strong> {item.label_id}</div>
        </div>
      </CardBody>
    </Card>
  )
}
import { useState } from 'react'
import { Card, CardBody, CardHeader, Input, Select, SelectItem, Button, Spinner } from '@heroui/react'
import { QrCode, Barcode, FileText, Download, RefreshCw } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { labelService, GenerateLabelsRequest } from '../../services'
import QRCode from 'react-qr-code'
import { ReactBarcode } from 'react-jsbarcode'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'


export function LabelGenerator() {
  const [quantity, setQuantity] = useState(49)
  const [recordType, setRecordType] = useState<'qr' | 'barcode' | 'nothing'>('qr')
  const [generatedLabels, setGeneratedLabels] = useState<string[]>([])

  const generateMutation = useMutation({
    mutationFn: (data: GenerateLabelsRequest) => labelService.generateLabels(data),
    onSuccess: (data) => {
      setGeneratedLabels(data.visible_ids)
    }
  })

  const handleGenerate = () => {
    generateMutation.mutate({
      quantity,
      record_type: recordType
    })
  }

  const handleDownloadPDF = async () => {
    try {
      const labelsPerPage = 49 // 7x7 grid
      const totalPages = Math.ceil(generatedLabels.length / labelsPerPage)

      const pdf: jsPDF = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      })

      // 各ページごとに処理
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const startIndex = pageIndex * labelsPerPage
        const endIndex = Math.min(startIndex + labelsPerPage, generatedLabels.length)
        const pageLabels = generatedLabels.slice(startIndex, endIndex)

        // 一時的なコンテナを作成（画面外に配置）
        const tempContainer = document.createElement('div')
        tempContainer.style.cssText = `
          width: 1050px;
          height: 1485px;
          background-color: #ffffff;
          border: 1px solid black;
          position: absolute;
          left: -9999px;
          top: 0;
          z-index: -1;
          font-family: monospace;
        `

        // QRコードとバーコードを事前に生成
        const qrCanvases = new Map<string, HTMLCanvasElement>()
        const barcodeCanvases = new Map<string, HTMLCanvasElement>()
        
        if (recordType === 'qr') {
          const QRCode = await import('qrcode')
          for (const labelId of pageLabels) {
            const qrCanvas = document.createElement('canvas')
            qrCanvas.width = 100
            qrCanvas.height = 100
            qrCanvas.style.width = '100px'
            qrCanvas.style.height = '100px'
            
            try {
              await QRCode.toCanvas(qrCanvas, labelId, {
                width: 100,
                margin: 0,
                color: {
                  dark: '#ED6D1F',
                  light: '#FFFFFF'
                }
              })
            } catch (error) {
              console.error('QR code generation failed for', labelId, error)
              const ctx = qrCanvas.getContext('2d')
              if (ctx) {
                ctx.fillStyle = '#FFFFFF'
                ctx.fillRect(0, 0, 100, 100)
                ctx.fillStyle = '#ED6D1F'
                ctx.fillRect(10, 10, 80, 80)
              }
            }
            qrCanvases.set(labelId, qrCanvas)
          }
        } else if (recordType === 'barcode') {
          const JsBarcode = await import('jsbarcode')
          for (const labelId of pageLabels) {
            const barcodeCanvas = document.createElement('canvas')
            barcodeCanvas.width = 150
            barcodeCanvas.height = 35
            barcodeCanvas.style.width = '150px'
            barcodeCanvas.style.height = '35px'
            
            try {
              JsBarcode.default(barcodeCanvas, labelId, {
                format: 'code128',
                height: 35,
                displayValue: false,
                lineColor: '#ED6D1F',
                margin: 0,
                background: '#FFFFFF'
              })
            } catch (error) {
              console.error('Barcode generation failed for', labelId, error)
              const ctx = barcodeCanvas.getContext('2d')
              if (ctx) {
                ctx.fillStyle = '#FFFFFF'
                ctx.fillRect(0, 0, 150, 35)
                ctx.fillStyle = '#ED6D1F'
                for (let i = 0; i < 30; i += 3) {
                  ctx.fillRect(i * 5, 0, 2, 35)
                }
              }
            }
            barcodeCanvases.set(labelId, barcodeCanvas)
          }
        }

        // 各ラベルのDOM要素を作成
        for (const labelId of pageLabels) {
          const labelWrapper = document.createElement('div')
          
          if (recordType === 'qr') {
            labelWrapper.style.cssText = `
              display: inline-block;
              margin: 38.25px 0 0 10px;
              padding: 17.4285714px 17.4285714px 0 17.4285714px;
              height: 168.433px;
              border: 2px solid rgb(0, 0, 0);
              vertical-align: top;
            `
            
            // 事前に生成したQRコードを使用
            const qrContainer = document.createElement('div')
            qrContainer.style.cssText = 'display: flex; justify-content: center; margin-bottom: 5px;'
            
            const qrCanvas = qrCanvases.get(labelId)
            if (qrCanvas) {
              qrContainer.appendChild(qrCanvas)
            }
            
            // テキスト部分
            const textElement = document.createElement('p')
            textElement.style.cssText = `
              margin: 0;
              padding: 0;
              text-align: center;
              font-size: 27px;
              font-family: monospace;
              font-weight: bold;
              line-height: 1;
            `
            textElement.textContent = labelId
            
            labelWrapper.appendChild(qrContainer)
            labelWrapper.appendChild(textElement)
            
          } else if (recordType === 'barcode') {
            labelWrapper.style.cssText = `
              display: inline-block;
              margin: 58.6363636px 0 0 15px;
              padding: 15px 15px 5px 15px;
              height: 84px;
              width: 192px;
              border: 2px solid rgb(0, 0, 0);
              vertical-align: top;
            `
            
            // 事前に生成したバーコードを使用
            const barcodeContainer = document.createElement('div')
            barcodeContainer.style.cssText = 'display: flex; justify-content: center;'
            
            const barcodeCanvas = barcodeCanvases.get(labelId)
            if (barcodeCanvas) {
              barcodeContainer.appendChild(barcodeCanvas)
            }
            
            // テキスト部分（PDFでのずれを考慮して上に調整）
            const textElement = document.createElement('p')
            textElement.style.cssText = `
              margin: -8px 0 0 0;
              padding: 0;
              text-align: center;
              font-size: 18px;
              font-family: monospace;
              font-weight: bold;
              line-height: 1;
            `
            textElement.textContent = labelId
            
            labelWrapper.appendChild(barcodeContainer)
            labelWrapper.appendChild(textElement)
            
          } else { // nothing
            labelWrapper.style.cssText = `
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin: 38.25px 0 0 10px;
              padding: 17.4285714px 17.4285714px 0 17.4285714px;
              height: 168.433px;
              width: 134px;
              border: 2px solid rgb(0, 0, 0);
              vertical-align: top;
            `
            
            const textElement = document.createElement('p')
            textElement.style.cssText = `
              margin: 0;
              padding: 0;
              text-align: center;
              font-size: 16px;
              font-family: monospace;
              font-weight: bold;
              overflow: hidden;
              word-wrap: break-word;
              line-height: 1;
            `
            textElement.textContent = labelId
            
            labelWrapper.appendChild(textElement)
          }
          
          tempContainer.appendChild(labelWrapper)
        }

        document.body.appendChild(tempContainer)

        // DOMの更新とフォントロードを待つ
        await new Promise(resolve => setTimeout(resolve, 500))

        // キャプチャ
        const canvas: HTMLCanvasElement = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        })

        // 一時的なコンテナを削除
        document.body.removeChild(tempContainer)

        // 2ページ目以降は新しいページを追加
        if (pageIndex > 0) {
          pdf.addPage()
        }

        // PDFに画像を追加
        const pdfWidth: number = pdf.internal.pageSize.getWidth()
        const pdfHeight: number = (canvas.height * pdfWidth) / canvas.width

        pdf.addImage({
          imageData: canvas,
          x: 0,
          y: 0,
          width: pdfWidth,
          height: pdfHeight,
        })
      }

      pdf.save(`labels_${recordType}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (e) {
      console.error(e)
    }
  }



  const renderLabel = (labelId: string) => {
    switch (recordType) {
      case 'qr':
        return (
          <div key={labelId} style={{
            display: 'inline-block',
            margin: '38.25px 0 0 10px',
            padding: '17.4285714px 17.4285714px 0 17.4285714px',
            height: '168.433px',
            border: '2px solid rgb(0, 0, 0)'
          }}>
            <QRCode size={100} value={labelId} bgColor={'#FFFFFF'} fgColor={'#ED6D1F'} />
            <p style={{
              margin: '0',
              padding: '0',
              textAlign: 'center',
              fontSize: '27px',
              fontFamily: 'monospace',
              fontWeight: 'bold'
            }}>{labelId}</p>
          </div>
        )
      case 'barcode':
        return (
          <div key={labelId} style={{
            display: 'inline-block',
            margin: '58.6363636px 0 0 15px',
            padding: '15px 15px 5px 15px',
            height: '84px',
            width: '192px',
            border: '2px solid rgb(0, 0, 0)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ReactBarcode
                value={labelId}
                options={{
                  format: 'code128',
                  height: 35,
                  displayValue: false,
                  lineColor: '#ED6D1F',
                  margin: 0,
                }}
              />
            </div>

            <p style={{
              margin: '-3px 0 0 0',
              padding: '0',
              textAlign: 'center',
              fontSize: '18px',
              fontFamily: 'monospace',
              fontWeight: 'bold'
            }}>{labelId}</p>
          </div>
        )
      case 'nothing':
        return (
          <div key={labelId} style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '38.25px 0 0 10px',
            padding: '17.4285714px 17.4285714px 0 17.4285714px',
            height: '168.433px',
            width: '134px',
            border: '2px solid rgb(0, 0, 0)',
            backgroundColor: '#ffffff',
            boxSizing: 'border-box'
          }}>
            <p style={{
              margin: 0,
              padding: 0,
              textAlign: 'center',
              fontSize: '16px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              overflow: 'hidden',
              wordWrap: 'break-word'
            }}>{labelId}</p>
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-6xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">ラベル生成</h1>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg sm:text-xl font-semibold">生成設定</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="number"
              label="生成数"
              value={quantity.toString()}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min={1}
              max={1000}
              endContent={<span className="text-small text-default-400">個</span>}
            />
            <Select
              label="ラベルタイプ"
              selectedKeys={[recordType]}
              onSelectionChange={(keys) => setRecordType(Array.from(keys)[0] as typeof recordType)}
            >
              <SelectItem key="qr" startContent={<QrCode size={16} />}>
                QRコード
              </SelectItem>
              <SelectItem key="barcode" startContent={<Barcode size={16} />}>
                バーコード
              </SelectItem>
              <SelectItem key="nothing" startContent={<FileText size={16} />}>
                テキストのみ
              </SelectItem>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              color="primary"
              startContent={generateMutation.isPending ? <Spinner size="sm" /> : <RefreshCw size={16} />}
              onPress={handleGenerate}
              isDisabled={generateMutation.isPending}
              size="sm"
              className="text-xs sm:text-sm"
            >
              {generateMutation.isPending ? '生成中...' : 'ラベル生成'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {generatedLabels.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2">
              <h2 className="text-lg sm:text-xl font-semibold">生成結果</h2>
              <Button
                size="sm"
                color="primary"
                startContent={<Download size={16} />}
                onPress={handleDownloadPDF}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">PDF</span>保存
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {/* プレビュー用のスクロールエリア */}
            <div style={{
              width: '100%',
              maxWidth: '1200px',
              height: '300px',
              margin: '0 auto',
              padding: 0,
              overflowX: 'scroll',
              overflowY: 'scroll',
              border: '1px solid black'
            }}>
              {/* PDF変換対象エリア（A4サイズ固定） */}
              <div id="pdf-target-area" style={{
                width: '1050px',
                height: '1485px',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                border: '1px solid black'
              }}>
                {generatedLabels.map((labelId) => renderLabel(labelId))}
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
import { Card, CardBody, CardHeader, Chip, Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input } from '@heroui/react'
import { Link, useNavigate } from 'react-router-dom'
import { useItems, useLoans, useContainers } from '@/hooks'
import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { QrCode } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

export function Dashboard() {
  const navigate = useNavigate()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [searchId, setSearchId] = useState('')
  const [searchError, setSearchError] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const qrScannerElementId = 'qr-scanner-container'

  // データ取得
  const { data: itemsData, isLoading: isLoadingItems } = useItems({ 
    page: 1, 
    per_page: 1000 
  })
  const { data: loansData, isLoading: isLoadingLoans } = useLoans({ 
    page: 1, 
    per_page: 1000 
  })
  const { containers } = useContainers()

  const items = itemsData?.data || []
  const loans = Array.isArray(loansData?.data) ? loansData.data : []

  // 統計データの計算
  const stats = useMemo(() => {
    if (isLoadingItems || isLoadingLoans) {
      return [
        { label: '総備品数', value: '-', color: 'primary' },
        { label: '貸出中', value: '-', color: 'warning' },
        { label: '今月の新規貸出', value: '-', color: 'success' },
        { label: '廃棄済み', value: '-', color: 'danger' },
      ]
    }

    // 総備品数
    const totalItems = items.length

    // 貸出中の備品数
    const onLoanItems = items.filter(item => item.is_on_loan).length

    // 廃棄済み備品数
    const disposedItems = items.filter(item => item.is_disposed).length

    // 今月の新規貸出数
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const thisMonthLoans = Array.isArray(loans) ? loans.filter(loan => {
      const loanDate = new Date(loan.loan_date)
      return loanDate.getMonth() === currentMonth && loanDate.getFullYear() === currentYear
    }).length : 0

    return [
      { label: '総備品数', value: totalItems.toString(), color: 'primary' },
      { label: '貸出中', value: onLoanItems.toString(), color: 'warning' },
      { label: '今月の新規貸出', value: thisMonthLoans.toString(), color: 'success' },
      { label: '廃棄済み', value: disposedItems.toString(), color: 'danger' },
    ]
  }, [items, loans, isLoadingItems, isLoadingLoans])

  // 最近の貸出活動
  const recentLoans = useMemo(() => {
    if (!Array.isArray(loans)) return []
    return loans
      .sort((a, b) => new Date(b.loan_date).getTime() - new Date(a.loan_date).getTime())
      .slice(0, 5)
  }, [loans])

  // カメラ停止（Html5Qrcode用）
  const stopCamera = useCallback(() => {
    console.log('Html5Qrcode スキャナー停止処理開始')
    
    // Html5Qrcodeを停止
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        console.log('Html5Qrcode スキャナー停止成功')
        html5QrCodeRef.current?.clear()
        html5QrCodeRef.current = null
      }).catch((error) => {
        console.warn('Html5Qrcode スキャナー停止エラー:', error)
        // エラーでも強制的にクリア
        try {
          html5QrCodeRef.current?.clear()
          html5QrCodeRef.current = null
        } catch (clearError) {
          console.warn('Html5Qrcode クリアエラー:', clearError)
        }
      })
    }
    
    setIsScanning(false)
    console.log('Html5Qrcode 停止処理完了')
  }, [])

  // IDで備品を検索またはコンテナでフィルタリング
  const searchItemById = useCallback((id: string) => {
    const trimmedId = id.trim()
    if (!trimmedId) {
      setSearchError('IDを入力してください')
      return
    }

    // ラベルIDで検索
    const item = items.find(item => item.label_id === trimmedId)
    if (item) {
      stopCamera()
      navigate(`/items/${item.id}`)
      onOpenChange()
      setSearchId('')
      setSearchError('')
      return
    }

    // コンテナのQRコードの可能性があるので確認
    const container = containers.find(c => c.id === trimmedId)
    if (container) {
      stopCamera()
      // コンテナ内の備品一覧を表示（フィルタ付きで備品一覧ページに移動）
      navigate(`/items?container_id=${trimmedId}&storage_type=container`)
      onOpenChange()
      setSearchId('')
      setSearchError('')
      return
    }

    setSearchError('該当する備品またはコンテナが見つかりません')
  }, [items, containers, navigate, onOpenChange, stopCamera])

  // QRコード読み取り成功時のハンドラ
  const handleCodeDetected = useCallback((result: string) => {
    console.log('QRコード読み取り成功:', result)
    setSearchId(result)
    searchItemById(result)
  }, [searchItemById])

  // カメラ開始（Html5Qrcode使用）
  const startCamera = async () => {
    try {
      setIsScanning(true)
      setSearchError('')
      console.log('Html5Qrcode スキャナー開始...')

      // Html5Qrcode を初期化
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrScannerElementId)
      }
      
      // スキャン設定
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      }
      
      // コールバック関数
      const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
        console.log('コード読み取り成功:', {
          text: decodedText,
          format: decodedResult.result?.format?.formatName || 'Unknown'
        })
        handleCodeDetected(decodedText)
      }
      
      const qrCodeErrorCallback = () => {
        // エラーは静かに無視してスキャンを継続
      }
      
      // カメラスキャンを開始（後面カメラ優先）
      try {
        await html5QrCodeRef.current.start(
          { facingMode: 'environment' },
          config,
          qrCodeSuccessCallback,
          qrCodeErrorCallback
        )
        console.log('Html5Qrcode スキャン開始成功')
        
        // スキャナー開始後、スタイルを調整
        setTimeout(() => {
          const scanRegion = document.querySelector(`#${qrScannerElementId} > div`) as HTMLElement
          if (scanRegion) {
            scanRegion.style.position = 'relative'
            scanRegion.style.border = 'none'
            scanRegion.style.padding = '0'
          }
        }, 100)
      } catch (cameraError) {
        // 後面カメラに失敗した場合、前面カメラを試行
        try {
          await html5QrCodeRef.current.start(
            { facingMode: 'user' },
            config,
            qrCodeSuccessCallback,
            qrCodeErrorCallback
          )
          console.log('Html5Qrcode スキャン開始成功 (前面カメラ)')
          
          // スキャナー開始後、スタイルを調整
          setTimeout(() => {
            const scanRegion = document.querySelector(`#${qrScannerElementId} > div`) as HTMLElement
            if (scanRegion) {
              scanRegion.style.position = 'relative'
              scanRegion.style.border = 'none'
              scanRegion.style.padding = '0'
            }
          }, 100)
        } catch (fallbackError) {
          throw new Error('カメラの起動に失敗しました: ' + fallbackError)
        }
      }

    } catch (error) {
      console.error('カメラの起動に失敗しました:', error)
      
      let errorMessage = 'カメラの起動に失敗しました。'
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'カメラのアクセス許可が拒否されました。ブラウザの設定でカメラを許可してください。'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'カメラが見つかりません。'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'カメラが他のアプリで使用中です。'
        } else {
          errorMessage += ` エラー: ${error.message}`
        }
      }
      
      setSearchError(errorMessage)
      setIsScanning(false)
    }
  }

  // モーダルが閉じられた時の処理
  const handleModalClose = useCallback(() => {
    stopCamera()
    setSearchId('')
    setSearchError('')
    onOpenChange()
  }, [stopCamera, onOpenChange])

  // コンポーネントのアンマウント時の処理
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <img 
          src="/hyperdashi.svg" 
          alt="HyperDashi" 
          className="h-16 w-16" 
        />
        <div>
          <h1 className="text-3xl font-bold">HyperDashi</h1>
          <p className="text-gray-600">物品管理システム</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm">
            <CardBody className="p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
              <p className={`text-xl sm:text-3xl font-bold text-${stat.color}`}>{stat.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <h2 className="text-lg sm:text-xl font-semibold">クイックアクション</h2>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-3">
              <Link
                to="/items/new"
                className="block p-3 sm:p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-sm sm:text-base font-medium">新規備品登録</h3>
                <p className="text-xs sm:text-sm text-gray-600">新しい備品を登録します</p>
              </Link>
              <Link
                to="/items"
                className="block p-3 sm:p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-sm sm:text-base font-medium">備品一覧</h3>
                <p className="text-xs sm:text-sm text-gray-600">すべての備品を確認・管理します</p>
              </Link>
              <Link
                to="/loans"
                className="block p-3 sm:p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-sm sm:text-base font-medium">貸出管理</h3>
                <p className="text-xs sm:text-sm text-gray-600">貸出履歴と返却管理を行います</p>
              </Link>
              <button
                onClick={onOpen}
                className="block w-full p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left"
              >
                <h3 className="font-medium flex items-center gap-2">
                  <QrCode size={20} />
                  QR/バーコード読み取り
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">QRコードやバーコードから備品を検索します</p>
              </button>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <h2 className="text-xl font-semibold">最近の貸出</h2>
          </CardHeader>
          <CardBody className="pt-0">
            {isLoadingLoans ? (
              <div className="flex justify-center items-center py-8">
                <Spinner label="読み込み中..." />
              </div>
            ) : recentLoans.length > 0 ? (
              <div className="space-y-3">
                {recentLoans.map((loan) => (
                  <div key={loan.id} className="flex justify-between items-center p-3 rounded-lg border">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">
                        {loan.item?.name || `備品ID: ${loan.item_id}`}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {loan.student_name} ({loan.student_number})
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(loan.loan_date).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Chip 
                        color={loan.return_date ? 'success' : 'warning'} 
                        size="sm"
                        variant="flat"
                      >
                        {loan.return_date ? '返却済み' : '貸出中'}
                      </Chip>
                    </div>
                  </div>
                ))}
                <Link
                  to="/loans"
                  className="block text-center text-sm text-primary hover:underline mt-4"
                >
                  すべての貸出を見る
                </Link>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">最近の貸出はありません</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* QR/バーコード読み取りモーダル */}
      <Modal isOpen={isOpen} onOpenChange={handleModalClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                QR/バーコード読み取り
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  {/* 手動入力 */}
                  <div>
                    <Input
                      label="ラベルID"
                      placeholder="備品のラベルIDを入力してください"
                      value={searchId}
                      onValueChange={setSearchId}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          searchItemById(searchId)
                        }
                      }}
                      errorMessage={searchError}
                      isInvalid={!!searchError}
                    />
                  </div>

                  {/* カメラ読み取り */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        color="primary"
                        variant="flat"
                        onPress={startCamera}
                        isDisabled={isScanning}
                      >
                        カメラで読み取り
                      </Button>
                      {isScanning && (
                        <Button
                          color="danger"
                          variant="flat"
                          onPress={stopCamera}
                        >
                          停止
                        </Button>
                      )}
                    </div>
                    
                    {/* html5-qrcode用のコンテナ */}
                    <div 
                      className="relative"
                      style={{
                        minHeight: isScanning ? '300px' : '0'
                      }}
                    >
                      <div
                        id={qrScannerElementId}
                        className={`w-full ${
                          isScanning ? 'block' : 'hidden'
                        }`}
                        style={{
                          position: 'relative',
                          width: '100%',
                          maxWidth: '500px',
                          margin: '0 auto'
                        }}
                      />
                      {isScanning && (
                        <>
                          <p className="text-sm text-gray-600 mt-2 text-center">
                            QRコード・バーコードをカメラに向けてください
                          </p>
                          <p className="text-xs text-gray-500 text-center">
                            対応形式: QR, データマトリックス, CODE128, CODE39, EAN, UPC等
                          </p>
                          <p className="text-xs text-gray-500 text-center">
                            読み取りが成功すると自動的に検索されます
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>• 備品のラベルIDを直接入力するか、カメラでQRコード/バーコードを読み取ってください</p>
                    <p>• コンテナのQRコードを読み取ると、そのコンテナ内の備品一覧を表示します</p>
                    <p>• 多種類のバーコード形式に対応しています（QR, CODE128, EAN等）</p>
                    <p>• 読み取り後、該当する備品の詳細画面またはコンテナ内備品一覧に移動します</p>
                    {location.protocol !== 'https:' && location.hostname !== 'localhost' && (
                      <p className="text-warning mt-2">⚠️ カメラ機能を使用するにはHTTPS環境が必要です</p>
                    )}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  キャンセル
                </Button>
                <Button
                  color="primary"
                  onPress={() => searchItemById(searchId)}
                  isDisabled={!searchId.trim()}
                >
                  検索
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
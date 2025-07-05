import { Card, CardBody, CardHeader, Chip, Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input } from '@heroui/react'
import { Link, useNavigate } from 'react-router-dom'
import { useItems, useLoans } from '@/hooks'
import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { QrCode } from 'lucide-react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

export function Dashboard() {
  const navigate = useNavigate()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [searchId, setSearchId] = useState('')
  const [searchError, setSearchError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)

  // データ取得
  const { data: itemsData, isLoading: isLoadingItems } = useItems({ 
    page: 1, 
    per_page: 1000 
  })
  const { data: loansData, isLoading: isLoadingLoans } = useLoans({ 
    page: 1, 
    per_page: 1000 
  })

  const items = itemsData?.data || []
  const loans = loansData?.data || []

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
    const thisMonthLoans = loans.filter(loan => {
      const loanDate = new Date(loan.loan_date)
      return loanDate.getMonth() === currentMonth && loanDate.getFullYear() === currentYear
    }).length

    return [
      { label: '総備品数', value: totalItems.toString(), color: 'primary' },
      { label: '貸出中', value: onLoanItems.toString(), color: 'warning' },
      { label: '今月の新規貸出', value: thisMonthLoans.toString(), color: 'success' },
      { label: '廃棄済み', value: disposedItems.toString(), color: 'danger' },
    ]
  }, [items, loans, isLoadingItems, isLoadingLoans])

  // 最近の貸出活動
  const recentLoans = useMemo(() => {
    return loans
      .sort((a, b) => new Date(b.loan_date).getTime() - new Date(a.loan_date).getTime())
      .slice(0, 5)
  }, [loans])

  // IDで備品を検索
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
    } else {
      setSearchError('該当する備品が見つかりません')
    }
  }, [items, navigate, onOpenChange])

  // QRコード読み取り成功時のハンドラ
  const handleCodeDetected = useCallback((result: string) => {
    console.log('QRコード読み取り成功:', result)
    setSearchId(result)
    searchItemById(result)
  }, [searchItemById])

  // カメラ開始
  const startCamera = async () => {
    try {
      setIsScanning(true)
      setSearchError('')
      console.log('カメラ起動開始...')

      const videoElement = videoRef.current
      if (!videoElement) {
        throw new Error('Video element not found')
      }

      // HTTPS環境かチェック
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('カメラアクセスにはHTTPS環境が必要です')
      }

      // navigator.mediaDevices が利用可能かチェック
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('このブラウザはカメラアクセスをサポートしていません')
      }

      // まず基本的なカメラアクセスを試行
      console.log('カメラアクセス許可を要求中...')
      let stream: MediaStream
      
      try {
        // 後面カメラを優先
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        })
      } catch (backCameraError) {
        console.warn('後面カメラの取得に失敗、前面カメラを試行:', backCameraError)
        // 前面カメラまたは任意のカメラを試行
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        })
      }
      
      console.log('カメラアクセス成功、ビデオ要素にストリームを設定中...')
      videoElement.srcObject = stream
      
      // ビデオが再生可能になるまで待機
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          console.log('ビデオメタデータ読み込み完了')
          resolve(void 0)
        }
      })

      // ZXing code reader を初期化
      console.log('ZXing code reader を初期化中...')
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader()
      }

      // QRコード読み取り開始
      console.log('QRコード読み取り開始...')
      
      // 継続的な読み取りのためのループ
      const scan = () => {
        if (!isScanning || !codeReaderRef.current || !videoElement.srcObject) return
        
        try {
          // ビデオの準備ができているかチェック
          if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            return // ビデオがまだ準備できていない
          }

          // キャンバスを使用してビデオフレームをキャプチャ
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (!context) return
          
          canvas.width = videoElement.videoWidth
          canvas.height = videoElement.videoHeight
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
          
          // Canvas から直接読み取り
          const result = codeReaderRef.current.decode(canvas)
          
          if (result) {
            console.log('QRコード読み取り成功:', result.getText())
            handleCodeDetected(result.getText())
            return
          }
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            console.warn('QRコード読み取りエラー:', error)
          }
        }
        
        // 継続的に読み取りを試行
        if (isScanning) {
          setTimeout(scan, 100)
        }
      }
      
      // ビデオが再生されてから読み取り開始
      videoElement.addEventListener('playing', () => {
        console.log('ビデオ再生開始、スキャン開始')
        scan()
      })

      console.log('カメラ起動完了')

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

  // カメラ停止
  const stopCamera = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }, [])

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
      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm">
            <CardBody>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className={`text-3xl font-bold text-${stat.color}`}>{stat.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <h2 className="text-xl font-semibold">クイックアクション</h2>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-3">
              <Link
                to="/items/new"
                className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">新規備品登録</h3>
                <p className="text-sm text-gray-600">新しい備品を登録します</p>
              </Link>
              <Link
                to="/items"
                className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">備品一覧</h3>
                <p className="text-sm text-gray-600">すべての備品を確認・管理します</p>
              </Link>
              <Link
                to="/loans"
                className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium">貸出管理</h3>
                <p className="text-sm text-gray-600">貸出履歴と返却管理を行います</p>
              </Link>
              <button
                onClick={onOpen}
                className="block w-full p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left"
              >
                <h3 className="font-medium flex items-center gap-2">
                  <QrCode size={20} />
                  QR/バーコード読み取り
                </h3>
                <p className="text-sm text-gray-600">QRコードやバーコードから備品を検索します</p>
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
      <Modal isOpen={isOpen} onOpenChange={handleModalClose} size="lg">
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
                    
                    {isScanning && (
                      <div className="relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-64 bg-black rounded-lg"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 text-center">
                          QRコードまたはバーコードを枠内に合わせてください
                        </p>
                        <p className="text-xs text-gray-500 text-center">
                          読み取りが成功すると自動的に検索されます
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>• 備品のラベルIDを直接入力するか、カメラでQRコード/バーコードを読み取ってください</p>
                    <p>• 読み取り後、該当する備品の詳細画面に移動します</p>
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
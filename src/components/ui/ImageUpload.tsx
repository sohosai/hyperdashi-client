import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button, Card, CardBody, Image, Progress } from '@heroui/react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { imagesService } from '@/services/images'

interface ImageUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string | null) => void
  maxSize?: number // MB
}

export function ImageUpload({ 
  currentImageUrl, 
  onImageChange, 
  maxSize = 10 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const currentBlobUrlRef = useRef<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Create a local URL for immediate preview
      const localUrl = URL.createObjectURL(file)
      
      // Clean up previous blob URL if exists
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current)
      }
      currentBlobUrlRef.current = localUrl
      
      // Show preview immediately
      onImageChange(localUrl)
      
      try {
        // Upload to API
        const response = await imagesService.upload(file)
        
        // Complete progress
        setUploadProgress(100)
        
        // Replace blob URL with server URL
        setTimeout(() => {
          URL.revokeObjectURL(localUrl)
          currentBlobUrlRef.current = null
          onImageChange(response.url)
          setIsUploading(false)
          setUploadProgress(0)
        }, 500)
        
      } catch (uploadError) {
        console.error('Upload failed:', uploadError)
        // Keep the blob URL for preview, but show error
        setError('アップロードに失敗しました。プレビューのみ表示されています。')
        setUploadProgress(100)
        setIsUploading(false)
        throw uploadError
      }

    } catch (error) {
      setError('画像のアップロードに失敗しました')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [onImageChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
    onDropRejected: (rejectedFiles) => {
      const rejection = rejectedFiles[0]?.errors[0]
      if (rejection?.code === 'file-too-large') {
        setError(`ファイルサイズが${maxSize}MBを超えています`)
      } else if (rejection?.code === 'file-invalid-type') {
        setError('対応していないファイル形式です')
      } else {
        setError('ファイルの処理に失敗しました')
      }
    }
  })

  const removeImage = () => {
    // Clean up blob URL if exists
    if (currentBlobUrlRef.current && currentImageUrl === currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current)
      currentBlobUrlRef.current = null
    }
    onImageChange(null)
    setError(null)
  }

  // Cleanup blob URLs on unmount or when currentImageUrl changes
  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // If currentImageUrl changes and it's not our current blob URL, clean up the old blob URL
    if (currentBlobUrlRef.current && currentImageUrl !== currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current)
      currentBlobUrlRef.current = null
    }
  }, [currentImageUrl])

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">備品画像</label>
      
      {currentImageUrl ? (
        <Card className="relative">
          <CardBody className="p-4">
            <div className="relative">
              <Image
                src={currentImageUrl}
                alt="備品画像"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                isIconOnly
                color="danger"
                variant="flat"
                size="sm"
                className="absolute top-2 right-2"
                onPress={removeImage}
              >
                <X size={16} />
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed cursor-pointer transition-colors rounded-lg ${
            isDragActive ? 'border-primary bg-primary-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <div className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                {isUploading ? (
                  <Upload className="animate-bounce" size={24} />
                ) : (
                  <ImageIcon size={24} />
                )}
              </div>
              
              {isUploading ? (
                <div className="w-full space-y-2">
                  <p className="text-sm">アップロード中...</p>
                  <Progress 
                    value={uploadProgress} 
                    color="primary"
                    className="w-full"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-lg font-medium">
                      {isDragActive ? 'ここにドロップ' : '画像をアップロード'}
                    </p>
                    <p className="text-sm text-gray-500">
                      ドラッグ&ドロップ または クリックして選択
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    JPEG, PNG, GIF, WebP (最大{maxSize}MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-danger text-sm">{error}</p>
      )}
    </div>
  )
}
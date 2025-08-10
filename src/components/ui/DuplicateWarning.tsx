import { Alert, Button } from '@heroui/react'
import { AlertTriangle } from 'lucide-react'

interface DuplicateWarningProps {
  isOpen: boolean
  title: string
  message: string
  onCancel: () => void
  onConfirm: () => void
  cancelText?: string
  confirmText?: string
}

export function DuplicateWarning({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm,
  cancelText = 'キャンセル',
  confirmText = '強制実行'
}: DuplicateWarningProps) {
  if (!isOpen) return null

  return (
    <div className="mb-4">
      <Alert color="warning" variant="faded" className="border-2 border-warning-300">
        <AlertTriangle className="h-4 w-4" />
        <div className="ml-2">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-sm mt-1">
            {message}
          </div>
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              variant="light" 
              color="default"
              onPress={onCancel}
            >
              {cancelText}
            </Button>
            <Button 
              size="sm" 
              color="warning" 
              variant="solid"
              onPress={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  )
}
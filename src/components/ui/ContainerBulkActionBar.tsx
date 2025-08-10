import { Button } from '@heroui/react'
import { Trash2, X, RotateCcw } from 'lucide-react'

interface ContainerBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDispose: () => void;
  onUndispose: () => void;
}

export function ContainerBulkActionBar({
  selectedCount,
  onClearSelection,
  onDispose,
  onUndispose,
}: ContainerBulkActionBarProps) {
  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3">
        <div className="text-sm font-semibold whitespace-nowrap">
          {selectedCount}件選択中
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="flat"
            color="danger"
            startContent={<Trash2 size={16} />}
            onPress={onDispose}
          >
            廃棄
          </Button>
          
          <Button
            size="sm"
            variant="flat"
            color="success"
            startContent={<RotateCcw size={16} />}
            onPress={onUndispose}
          >
            復元
          </Button>
        </div>

        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={onClearSelection}
          aria-label="選択を解除"
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  )
}
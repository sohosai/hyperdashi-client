import { Button, Select, SelectItem } from '@heroui/react'
import { Trash2, X, RotateCcw } from 'lucide-react'
import { Container } from '@/types'

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDispose: () => void;
  onUndispose: () => void;
  onMoveToContainer: (containerId: string) => void;
  containers: Container[];
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onDispose,
  onUndispose,
  onMoveToContainer,
  containers,
}: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-3 flex items-center gap-3 max-w-screen-xl overflow-x-auto">
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
          
          <Select
            placeholder="コンテナに移動"
            size="sm"
            className="min-w-[160px]"
            aria-label="コンテナ選択"
            onSelectionChange={(keys) => {
              const containerId = Array.from(keys)[0] as string
              if (containerId) {
                onMoveToContainer(containerId)
              }
            }}
          >
            {containers.map((container) => (
              <SelectItem key={container.id}>
                {container.name} - {container.location || '場所未設定'}
              </SelectItem>
            ))}
          </Select>
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
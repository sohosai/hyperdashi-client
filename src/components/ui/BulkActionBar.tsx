import { Button, Select, SelectItem } from '@heroui/react'
import { Trash2, X, RotateCcw, Package } from 'lucide-react'
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
      <div className="bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-300 dark:border-primary-700 rounded-xl shadow-xl p-4 flex items-center gap-4 max-w-screen-xl overflow-x-auto animate-in slide-in-from-bottom duration-200">
        {/* Selection count badge */}
        <div className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
          {selectedCount}件選択中
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="flat"
            color="danger"
            startContent={<Trash2 size={16} />}
            onPress={onDispose}
            className="font-medium"
          >
            一括廃棄
          </Button>

          <Button
            size="sm"
            variant="flat"
            color="success"
            startContent={<RotateCcw size={16} />}
            onPress={onUndispose}
            className="font-medium"
          >
            一括復元
          </Button>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

          <div className="flex items-center gap-2">
            <Package size={16} className="text-gray-500 dark:text-gray-400" />
            <Select
              placeholder="コンテナに移動..."
              size="sm"
              className="min-w-[180px]"
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
        </div>

        {/* Close button */}
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={onClearSelection}
          aria-label="選択を解除"
          className="ml-2"
        >
          <X size={18} />
        </Button>
      </div>
    </div>
  )
}
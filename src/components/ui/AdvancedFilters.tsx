import { useState } from 'react'
import {
  Button,
  Input,
  Select,
  SelectItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Chip,
} from '@heroui/react'
import { Filter, X } from 'lucide-react'
import { Container } from '@/types'

export interface FilterState {
  name?: string
  label_id?: string
  model_number?: string
  storage_location?: string
  container_id?: string
  status?: 'available' | 'on_loan' | 'disposed' | 'all'
  purchase_year_from?: string
  purchase_year_to?: string
  purchase_amount_from?: string
  purchase_amount_to?: string
  storage_type?: 'location' | 'container' | 'all'
  is_depreciation_target?: boolean | null
  connection_names?: string
  cable_color_pattern?: string
  qr_code_type?: 'qr' | 'barcode' | 'none' | 'all'
}

interface AdvancedFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  containers: Container[]
  uniqueValues: {
    storageLocations: string[]
    connectionNames: string[]
    cableColors: string[]
  }
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  containers,
  uniqueValues,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    setIsOpen(false)
  }

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key as keyof FilterState] !== undefined && filters[key as keyof FilterState] !== ''
  ).length

  return (
    <div className="flex items-center gap-2">
      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="bottom-start"
        shouldCloseOnScroll={false}
      >
        <PopoverTrigger>
          <Button
            variant="bordered"
            size="sm"
            startContent={<Filter size={16} />}
            className="relative"
          >
            フィルタ
            {activeFiltersCount > 0 && (
              <Chip
                size="sm"
                color="primary"
                className="absolute -top-1 -right-1 min-w-5 h-5 text-xs"
              >
                {activeFiltersCount}
              </Chip>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">詳細フィルタ</h3>
              <Button
                size="sm"
                variant="light"
                onPress={clearAllFilters}
                startContent={<X size={16} />}
              >
                すべてクリア
              </Button>
            </div>

            <div className="space-y-3">
              <Input
                label="名称"
                placeholder="名称で検索"
                size="sm"
                value={filters.name || ''}
                onValueChange={(value) => updateFilter('name', value)}
                isClearable
                onClear={() => clearFilter('name')}
              />

              <Input
                label="ラベルID"
                placeholder="ラベルIDで検索"
                size="sm"
                value={filters.label_id || ''}
                onValueChange={(value) => updateFilter('label_id', value)}
                isClearable
                onClear={() => clearFilter('label_id')}
              />

              <Input
                label="型番"
                placeholder="型番で検索"
                size="sm"
                value={filters.model_number || ''}
                onValueChange={(value) => updateFilter('model_number', value)}
                isClearable
                onClear={() => clearFilter('model_number')}
              />

              <Select
                label="状態"
                placeholder="状態を選択"
                size="sm"
                selectedKeys={filters.status ? new Set([filters.status]) : new Set()}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string
                  updateFilter('status', value === 'all' ? undefined : value)
                }}
              >
                <SelectItem key="all">すべて</SelectItem>
                <SelectItem key="available">利用可能</SelectItem>
                <SelectItem key="on_loan">貸出中</SelectItem>
                <SelectItem key="disposed">廃棄済み</SelectItem>
              </Select>

              <Select
                label="保管場所"
                placeholder="保管場所を選択"
                size="sm"
                selectedKeys={filters.storage_location ? new Set([filters.storage_location]) : new Set()}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string
                  updateFilter('storage_location', value === 'all' ? undefined : value)
                }}
              >
                <SelectItem key="all">すべて</SelectItem>
                {uniqueValues.storageLocations.map((location) => (
                  <SelectItem key={location}>{location}</SelectItem>
                )) as any}
              </Select>

              <Select
                label="コンテナ"
                placeholder="コンテナを選択"
                size="sm"
                selectedKeys={filters.container_id ? new Set([filters.container_id]) : new Set()}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string
                  updateFilter('container_id', value === 'all' ? undefined : value)
                }}
              >
                <SelectItem key="all">すべて</SelectItem>
                {containers.map((container) => (
                  <SelectItem key={container.id}>
                    {container.name} - {container.location || '場所未設定'}
                  </SelectItem>
                )) as any}
              </Select>

              <Select
                label="保管方法"
                placeholder="保管方法を選択"
                size="sm"
                selectedKeys={filters.storage_type ? new Set([filters.storage_type]) : new Set()}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string
                  updateFilter('storage_type', value === 'all' ? undefined : value)
                }}
              >
                <SelectItem key="all">すべて</SelectItem>
                <SelectItem key="location">保管場所</SelectItem>
                <SelectItem key="container">コンテナ</SelectItem>
              </Select>

              <div className="flex gap-2">
                <Input
                  label="購入年（開始）"
                  placeholder="YYYY"
                  type="number"
                  size="sm"
                  value={filters.purchase_year_from || ''}
                  onValueChange={(value) => updateFilter('purchase_year_from', value)}
                  className="flex-1"
                />
                <Input
                  label="購入年（終了）"
                  placeholder="YYYY"
                  type="number"
                  size="sm"
                  value={filters.purchase_year_to || ''}
                  onValueChange={(value) => updateFilter('purchase_year_to', value)}
                  className="flex-1"
                />
              </div>

              <div className="flex gap-2">
                <Input
                  label="購入金額（最小）"
                  placeholder="0"
                  type="number"
                  size="sm"
                  value={filters.purchase_amount_from || ''}
                  onValueChange={(value) => updateFilter('purchase_amount_from', value)}
                  className="flex-1"
                />
                <Input
                  label="購入金額（最大）"
                  placeholder="999999"
                  type="number"
                  size="sm"
                  value={filters.purchase_amount_to || ''}
                  onValueChange={(value) => updateFilter('purchase_amount_to', value)}
                  className="flex-1"
                />
              </div>

              <Select
                label="減価償却対象"
                placeholder="減価償却対象を選択"
                size="sm"
                selectedKeys={
                  filters.is_depreciation_target === null || filters.is_depreciation_target === undefined
                    ? new Set()
                    : new Set([filters.is_depreciation_target.toString()])
                }
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string
                  if (value === 'all' || !value) {
                    updateFilter('is_depreciation_target', null)
                  } else {
                    updateFilter('is_depreciation_target', value === 'true')
                  }
                }}
              >
                <SelectItem key="all">すべて</SelectItem>
                <SelectItem key="true">対象</SelectItem>
                <SelectItem key="false">対象外</SelectItem>
              </Select>

              <Input
                label="接続名称"
                placeholder="接続名称で検索"
                size="sm"
                value={filters.connection_names || ''}
                onValueChange={(value) => updateFilter('connection_names', value)}
                isClearable
                onClear={() => clearFilter('connection_names')}
              />

              <Input
                label="ケーブル色"
                placeholder="ケーブル色で検索"
                size="sm"
                value={filters.cable_color_pattern || ''}
                onValueChange={(value) => updateFilter('cable_color_pattern', value)}
                isClearable
                onClear={() => clearFilter('cable_color_pattern')}
              />

              <Select
                label="QR/バーコード種別"
                placeholder="QR/バーコード種別を選択"
                size="sm"
                selectedKeys={filters.qr_code_type ? new Set([filters.qr_code_type]) : new Set()}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string
                  updateFilter('qr_code_type', value === 'all' ? undefined : value)
                }}
              >
                <SelectItem key="all">すべて</SelectItem>
                <SelectItem key="qr">QRコード</SelectItem>
                <SelectItem key="barcode">バーコード</SelectItem>
                <SelectItem key="none">なし</SelectItem>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === '') return null

            const getFilterLabel = (key: string, value: any) => {
              switch (key) {
                case 'status':
                  return `状態: ${value === 'available' ? '利用可能' : value === 'on_loan' ? '貸出中' : '廃棄済み'}`
                case 'storage_type':
                  return `保管方法: ${value === 'location' ? '保管場所' : 'コンテナ'}`
                case 'is_depreciation_target':
                  return `減価償却: ${value ? '対象' : '対象外'}`
                case 'qr_code_type':
                  return `QR種別: ${value === 'qr' ? 'QRコード' : value === 'barcode' ? 'バーコード' : 'なし'}`
                case 'container_id':
                  const container = containers.find(c => c.id === value)
                  return `コンテナ: ${container?.name || value}`
                default:
                  return `${key}: ${value}`
              }
            }

            return (
              <Chip
                key={key}
                size="sm"
                variant="flat"
                onClose={() => clearFilter(key as keyof FilterState)}
              >
                {getFilterLabel(key, value)}
              </Chip>
            )
          })}
        </div>
      )}
    </div>
  )
}
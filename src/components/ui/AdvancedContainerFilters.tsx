import React, { useState } from 'react'
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

export interface ContainerFilterState {
  name?: string
  location?: string
  remarks?: string
  status?: 'active' | 'disposed' | 'all'
  item_count_from?: string
  item_count_to?: string
  created_at_from?: string
  created_at_to?: string
  updated_at_from?: string
  updated_at_to?: string
}

interface AdvancedContainerFiltersProps {
  filters: ContainerFilterState
  onFiltersChange: (filters: ContainerFilterState) => void
  uniqueValues: {
    locations: string[]
  }
}

export function AdvancedContainerFilters({
  filters,
  onFiltersChange,
  uniqueValues,
}: AdvancedContainerFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = (key: keyof ContainerFilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilter = (key: keyof ContainerFilterState) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    onFiltersChange({})
    setIsOpen(false)
  }

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key as keyof ContainerFilterState] !== undefined && filters[key as keyof ContainerFilterState] !== ''
  ).length

  return (
    <div className="flex items-center gap-2">
      <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
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

              <Select
                label="場所"
                placeholder="場所を選択"
                size="sm"
                selectedKeys={filters.location ? new Set([filters.location]) : new Set()}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string
                  updateFilter('location', value === 'all' ? undefined : value)
                }}
              >
                <SelectItem key="all">すべて</SelectItem>
                {uniqueValues.locations.map((location) => (
                  <SelectItem key={location}>{location}</SelectItem>
                ))}
              </Select>

              <Input
                label="備考"
                placeholder="備考で検索"
                size="sm"
                value={filters.remarks || ''}
                onValueChange={(value) => updateFilter('remarks', value)}
                isClearable
                onClear={() => clearFilter('remarks')}
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
                <SelectItem key="active">使用中</SelectItem>
                <SelectItem key="disposed">廃棄済み</SelectItem>
              </Select>

              <div className="flex gap-2">
                <Input
                  label="備品数（最小）"
                  placeholder="0"
                  type="number"
                  size="sm"
                  value={filters.item_count_from || ''}
                  onValueChange={(value) => updateFilter('item_count_from', value)}
                  className="flex-1"
                />
                <Input
                  label="備品数（最大）"
                  placeholder="999"
                  type="number"
                  size="sm"
                  value={filters.item_count_to || ''}
                  onValueChange={(value) => updateFilter('item_count_to', value)}
                  className="flex-1"
                />
              </div>

              <div className="flex gap-2">
                <Input
                  label="作成日（開始）"
                  placeholder="YYYY-MM-DD"
                  type="date"
                  size="sm"
                  value={filters.created_at_from || ''}
                  onValueChange={(value) => updateFilter('created_at_from', value)}
                  className="flex-1"
                />
                <Input
                  label="作成日（終了）"
                  placeholder="YYYY-MM-DD"
                  type="date"
                  size="sm"
                  value={filters.created_at_to || ''}
                  onValueChange={(value) => updateFilter('created_at_to', value)}
                  className="flex-1"
                />
              </div>

              <div className="flex gap-2">
                <Input
                  label="更新日（開始）"
                  placeholder="YYYY-MM-DD"
                  type="date"
                  size="sm"
                  value={filters.updated_at_from || ''}
                  onValueChange={(value) => updateFilter('updated_at_from', value)}
                  className="flex-1"
                />
                <Input
                  label="更新日（終了）"
                  placeholder="YYYY-MM-DD"
                  type="date"
                  size="sm"
                  value={filters.updated_at_to || ''}
                  onValueChange={(value) => updateFilter('updated_at_to', value)}
                  className="flex-1"
                />
              </div>
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
                  return `状態: ${value === 'active' ? '使用中' : '廃棄済み'}`
                default:
                  return `${key}: ${value}`
              }
            }

            return (
              <Chip
                key={key}
                size="sm"
                variant="flat"
                onClose={() => clearFilter(key as keyof ContainerFilterState)}
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
import { Input, Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react'
import { Download, Search, Settings } from 'lucide-react'
import { AdvancedFilters, FilterState } from '@/components/ui/AdvancedFilters'
import { Container, Item } from '@/types'
import { ColumnDef } from '@/components/ui/EnhancedList'
import { ColumnSettingsContent } from './ColumnSettingsModal'

interface ItemsFilterBarProps {
    searchTerm: string
    setSearchTerm: (term: string) => void
    setPage: (page: number) => void
    filters: FilterState
    onFiltersChange: (filters: FilterState) => void
    containers: Container[]
    uniqueValues: {
        storageLocations: string[]
        connectionNames: string[]
        cableColors: string[]
    }
    // Column settings props
    allColumnDefs: ColumnDef<Item>[]
    visibleColumnKeys: string[]
    setVisibleColumnKeys: (keys: string[]) => void
    columnOrder: string[]
    setColumnOrder: (order: string[]) => void
    columnOrderStorageKey: string
    columnVisibilityStorageKey: string
    orderedVisibleColumnKeys: string[]
    onExportCsv: () => void
    isExportingCsv?: boolean
}

export function ItemsFilterBar({
    searchTerm,
    setSearchTerm,
    setPage,
    filters,
    onFiltersChange,
    containers,
    uniqueValues,
    allColumnDefs,
    visibleColumnKeys,
    setVisibleColumnKeys,
    columnOrder,
    setColumnOrder,
    columnOrderStorageKey,
    columnVisibilityStorageKey,
    orderedVisibleColumnKeys,
    onExportCsv,
    isExportingCsv = false,
}: ItemsFilterBarProps) {
    return (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
            <Input
                isClearable
                className="w-full lg:max-w-md"
                placeholder="名称・ラベル・型番で検索..."
                startContent={<Search />}
                value={searchTerm}
                onClear={() => {
                    setSearchTerm('')
                    setPage(1)
                }}
                onValueChange={(value) => {
                    setSearchTerm(value)
                    setPage(1)
                }}
                />
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="bordered"
                    aria-label="備品一覧CSV出力"
                    startContent={<Download size={16} />}
                    onPress={onExportCsv}
                    isLoading={isExportingCsv}
                >
                    CSV出力
                </Button>

                <AdvancedFilters
                    filters={filters}
                    onFiltersChange={(newFilters) => {
                        onFiltersChange(newFilters)
                        setPage(1)
                    }}
                    containers={containers}
                    uniqueValues={uniqueValues}
                />

                <Popover placement="bottom-end" shouldCloseOnScroll={false}>
                    <PopoverTrigger>
                        <Button
                            size="sm"
                            variant="bordered"
                            aria-label="カラム設定"
                            startContent={<Settings size={16} />}
                        >
                            カラム設定
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <ColumnSettingsContent
                            allColumnDefs={allColumnDefs}
                            visibleColumnKeys={visibleColumnKeys}
                            setVisibleColumnKeys={setVisibleColumnKeys}
                            columnOrder={columnOrder}
                            setColumnOrder={setColumnOrder}
                            columnOrderStorageKey={columnOrderStorageKey}
                            columnVisibilityStorageKey={columnVisibilityStorageKey}
                            orderedVisibleColumnKeys={orderedVisibleColumnKeys}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}

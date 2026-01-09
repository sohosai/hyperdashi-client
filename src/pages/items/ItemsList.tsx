import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SortDescriptor, Selection } from '@heroui/react'
import { Item, Container } from '@/types'
import {
  useItems,
  useCreateItem,
  useBulkUpdateItemsDisposedStatus,
  useBulkMoveToContainer,
  useContainers,
} from '@/hooks'
import { ColumnDef } from '@/components/ui/EnhancedList'
import { BulkActionBar } from '@/components/ui/BulkActionBar'
import { FilterState } from '@/components/ui/AdvancedFilters'

// Components
import { ItemsFilterBar } from './components/ItemsFilterBar'
import { ItemsTable } from './components/ItemsTable'
import { ItemInlineCreator } from './components/ItemInlineCreator'


// Constants
import {
  allColumnDefs,
  defaultVisibleColumnKeys,
  defaultColumnOrder,
} from './constants'

export function ItemsList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [perPage, setPerPage] = useState(Number(searchParams.get('per_page')) || 20)
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: searchParams.get('sort_by') || 'created_at',
    direction: searchParams.get('sort_order') === 'asc' ? 'ascending' : 'descending',
  })

  // Advanced filters state
  const [filters, setFilters] = useState<FilterState>(() => {
    const initialFilters: FilterState = {}

    const statusParam = searchParams.get('status')
    if (statusParam && statusParam !== 'all') {
      initialFilters.status = statusParam as 'available' | 'on_loan' | 'disposed'
    }

    const containerParam = searchParams.get('container_id')
    if (containerParam) {
      initialFilters.container_id = containerParam
    }

    const storageTypeParam = searchParams.get('storage_type')
    if (storageTypeParam) {
      initialFilters.storage_type = storageTypeParam as 'location' | 'container'
    }

    const storageLocationParam = searchParams.get('storage_location')
    if (storageLocationParam) {
      initialFilters.storage_location = storageLocationParam
    }

    return initialFilters
  })

  // Column selection state
  const columnOrderStorageKey = 'itemsListColumnOrder'
  const columnVisibilityStorageKey = 'itemsListColumnVisibility'
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(columnOrderStorageKey)
      if (saved) return JSON.parse(saved)
    }
    return defaultColumnOrder
  })
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(columnVisibilityStorageKey)
      if (saved) return JSON.parse(saved)
    }
    return defaultVisibleColumnKeys
  })

  // Sync visibleColumnKeys order with columnOrder when either changes
  const orderedVisibleColumnKeys = useMemo(() => {
    return columnOrder.filter(key => visibleColumnKeys.includes(key))
  }, [columnOrder, visibleColumnKeys])



  // Selection state
  const [selectionKeys, setSelectionKeys] = useState<Selection>(new Set([]))

  // Update URL params when pagination/search/sort changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (perPage !== 20) params.set('per_page', perPage.toString())
    if (searchTerm) params.set('search', searchTerm)
    if (sortDescriptor.column) params.set('sort_by', sortDescriptor.column as string)
    if (sortDescriptor.direction) params.set('sort_order', sortDescriptor.direction === 'ascending' ? 'asc' : 'desc')
    if (filters.status) params.set('status', filters.status)
    if (filters.container_id) params.set('container_id', filters.container_id)
    if (filters.storage_type) params.set('storage_type', filters.storage_type)
    if (filters.storage_location) params.set('storage_location', filters.storage_location)

    setSearchParams(params, { replace: true })
  }, [page, perPage, searchTerm, sortDescriptor, filters, setSearchParams])

  // Calculate dynamic columns based on visibility
  const columns: ColumnDef<Item>[] = useMemo(() => {
    return allColumnDefs.filter(
      col => col.key === 'actions' || orderedVisibleColumnKeys.includes(col.key as string)
    ).sort((a, b) => {
      // Always keep actions at the end
      if (a.key === 'actions') return 1
      if (b.key === 'actions') return -1
      return orderedVisibleColumnKeys.indexOf(a.key as string) - orderedVisibleColumnKeys.indexOf(b.key as string)
    })
  }, [orderedVisibleColumnKeys])

  const { data: containersData } = useContainers()
  const containers = useMemo(() => containersData?.containers || [], [containersData])

  const queryParams = useMemo(() => {
    const params: any = {
      page,
      per_page: perPage,
      search: searchTerm || undefined,
      sort_by: sortDescriptor.column as string,
      sort_order: sortDescriptor.direction === 'ascending' ? 'asc' : 'desc',
    }

    // Add filters to query params
    if (filters.status) params.status = filters.status
    if (filters.container_id) params.container_id = filters.container_id
    if (filters.storage_type) params.storage_type = filters.storage_type
    if (filters.storage_location) params.storage_location = filters.storage_location

    return params
  }, [page, perPage, searchTerm, sortDescriptor, filters])

  const { data, isLoading, error } = useItems(queryParams)
  let items = data?.data || []

  // Extract unique values for filter options
  const uniqueValues = useMemo(() => {
    const storageLocations = new Set<string>()
    const connectionNames = new Set<string>()
    const cableColors = new Set<string>()

    items.forEach(item => {
      if (item.storage_location) {
        storageLocations.add(item.storage_location)
      }
      if (item.connection_names) {
        item.connection_names.forEach(name => connectionNames.add(name))
      }
      if (item.cable_color_pattern) {
        item.cable_color_pattern.forEach(color => cableColors.add(color))
      }
    })

    return {
      storageLocations: Array.from(storageLocations).sort(),
      connectionNames: Array.from(connectionNames).sort(),
      cableColors: Array.from(cableColors).sort(),
    }
  }, [items])

  const createItemMutation = useCreateItem()
  const bulkUpdateDisposedMutation = useBulkUpdateItemsDisposedStatus()
  const bulkMoveToContainerMutation = useBulkMoveToContainer()

  // アイテム作成ハンドラー
  const handleCreateItem = async (itemData: {
    name: string
    label_id: string
  }) => {
    try {
      await createItemMutation.mutateAsync({
        ...itemData,
        storage_type: 'location'
      })
    } catch (error) {
      console.error('Failed to create item:', error)
    }
  }

  const handleBulkDispose = async () => {
    if (selectionKeys !== 'all') {
      await bulkUpdateDisposedMutation.mutateAsync({
        ids: Array.from(selectionKeys) as string[],
        is_disposed: true,
      })
    }
    setSelectionKeys(new Set([]))
  }

  const handleBulkUndispose = async () => {
    if (selectionKeys !== 'all') {
      await bulkUpdateDisposedMutation.mutateAsync({
        ids: Array.from(selectionKeys) as string[],
        is_disposed: false,
      })
    }
    setSelectionKeys(new Set([]))
  }

  const handleBulkMoveToContainer = async (containerId: string) => {
    if (selectionKeys !== 'all') {
      await bulkMoveToContainerMutation.mutateAsync({
        ids: Array.from(selectionKeys) as string[],
        containerId,
      })
    }
    setSelectionKeys(new Set([]))
  }

  if (error) return <div>備品の読み込み中にエラーが発生しました: {error.message}</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">備品管理</h1>

      <ItemsFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setPage={setPage}
        filters={filters}
        onFiltersChange={setFilters}
        containers={containers}
        uniqueValues={uniqueValues}
        allColumnDefs={allColumnDefs}
        visibleColumnKeys={visibleColumnKeys}
        setVisibleColumnKeys={setVisibleColumnKeys}
        columnOrder={columnOrder}
        setColumnOrder={setColumnOrder}
        columnOrderStorageKey={columnOrderStorageKey}
        columnVisibilityStorageKey={columnVisibilityStorageKey}
        orderedVisibleColumnKeys={orderedVisibleColumnKeys}
      />

      <ItemsTable
        items={items}
        columns={columns}
        isLoading={isLoading}
        sortDescriptor={sortDescriptor}
        onSortChange={(descriptor) => {
          setSortDescriptor(descriptor)
          setPage(1)
        }}
        selectionKeys={selectionKeys}
        onSelectionChange={setSelectionKeys}
        containers={containers}
        total={data?.total || 0}
        page={page}
        perPage={perPage}
        setPage={setPage}
        setPerPage={setPerPage}
        totalPages={data?.total_pages || 0}
      />

      <div className="bg-content1 border border-default-200 rounded-lg shadow-md p-2 mb-4 transition-colors duration-200">
        <ItemInlineCreator
          onSave={handleCreateItem}
        />
      </div>

      <BulkActionBar
        selectedCount={selectionKeys === 'all' ? data?.total || 0 : selectionKeys.size}
        onClearSelection={() => setSelectionKeys(new Set([]))}
        onDispose={handleBulkDispose}
        onUndispose={handleBulkUndispose}
        onMoveToContainer={handleBulkMoveToContainer}
        containers={containers}
      />
    </div>
  )
}
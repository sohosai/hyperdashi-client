import React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Button,
  Input,
  Chip,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
  SortDescriptor,
  Selection,
} from '@heroui/react'
import { Search, Plus, Trash2, RotateCcw, Eye, Edit, Users, Undo, GripVertical, Package } from 'lucide-react'
import { Item, Container } from '@/types'
import {
  useItems,
  useUpdateItem,
  useCreateItem,
  // useBulkDeleteItems,
  useBulkUpdateItemsDisposedStatus,
  useBulkMoveToContainer,
  // useBulkUpdateStorageLocation,
  useContainers,
  useDisposeItem,
  useUndisposeItem,
  // useReturnItem,
} from '@/hooks'
import { EnhancedList, ColumnDef } from '@/components/ui/EnhancedList'
import { EditableCell } from '@/components/ui/EditableCell'
import { BulkActionBar } from '@/components/ui/BulkActionBar'
// import { InlineCreatorRow } from '@/components/ui/InlineCreatorRow'
import { AdvancedFilters, FilterState } from '@/components/ui/AdvancedFilters'

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function ItemsList() {
  // Move sensors hook to top-level to avoid conditional hook call
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [page] = useState(Number(searchParams.get('page')) || 1)
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
    
    return initialFilters
  })

  // Column selection
  // All possible columns for Item
  const allColumnDefs: ColumnDef<Item>[] = [
      { key: 'name', label: '名称', sortable: true },
      { key: 'label_id', label: 'ラベルID', sortable: true },
      { key: 'model_number', label: '型番', sortable: true },
      { key: 'storage_location', label: '保管場所' },
      { key: 'container_id', label: 'コンテナ', sortable: true },
      { key: 'is_disposed', label: '状態' },
      { key: 'purchase_year', label: '購入年', sortable: true },
      { key: 'remarks', label: '備考' },
      { key: 'purchase_amount', label: '購入金額', sortable: true },
      { key: 'durability_years', label: '耐用年数', sortable: true },
      { key: 'is_depreciation_target', label: '減価償却対象' },
      { key: 'connection_names', label: '接続名称' },
      { key: 'cable_color_pattern', label: 'ケーブル色' },
      { key: 'storage_type', label: '保管方法' },
      { key: 'qr_code_type', label: 'QR/バーコード種別' },
      { key: 'image_url', label: '画像' },
      { key: 'created_at', label: '登録日', sortable: true },
      { key: 'updated_at', label: '更新日', sortable: true },
      { key: 'actions', label: '操作', align: 'end' },
  ]
  // const columnStorageKey = 'itemsListColumns'
  const defaultColumnKeys = allColumnDefs.map(col => col.key).filter(key => key !== 'actions')
  // New: maintain full order and visibility separately
  const columnOrderStorageKey = 'itemsListColumnOrder'
  const columnVisibilityStorageKey = 'itemsListColumnVisibility'
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(columnOrderStorageKey)
      if (saved) return JSON.parse(saved)
    }
    // Default order as requested
    return [
      'label_id', // ラベルID
      'name',     // 名称
      'connection_names', // 接続端子
      'cable_color_pattern', // ケーブル色
      'is_disposed', // 状態
      'storage_location', // 保管場所
      'container_id', // コンテナ
      // Add the rest of the columns in their original order, except 'actions'
      ...defaultColumnKeys.filter(
        key =>
          ![
            'label_id',
            'name',
            'connection_names',
            'cable_color_pattern',
            'is_disposed',
            'storage_location',
            'container_id',
          ].includes(key)
      ),
    ]
  })
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(columnVisibilityStorageKey)
      if (saved) return JSON.parse(saved)
    }
    // Use user-specified default visible columns
    return [
      'label_id', // ラベルID
      'name',     // 名称
      'connection_names', // 接続端子
      'cable_color_pattern', // ケーブル色
      'is_disposed', // 状態
      'storage_location', // 保管場所
      'container_id', // コンテナ
    ]
  })
  // Sync visibleColumnKeys order with columnOrder when either changes
  const orderedVisibleColumnKeys = useMemo(() => {
    return columnOrder.filter(key => visibleColumnKeys.includes(key))
  }, [columnOrder, visibleColumnKeys])
  // const [showColumnModal, setShowColumnModal] = useState(false)

  // (Removed previous defaultVisibleKeys logic, now handled in useState initializer above)

  // Selection state (ensure this is defined and not duplicated)
  const [selectionKeys, setSelectionKeys] = useState<Selection>(new Set([]))

  const handleToggleColumn = (key: string) => {
    let next: string[]
    if (visibleColumnKeys.includes(key)) {
      next = visibleColumnKeys.filter(k => k !== key)
    } else {
      next = [...visibleColumnKeys, key]
    }
    setVisibleColumnKeys(next)
    localStorage.setItem(columnVisibilityStorageKey, JSON.stringify(next))
  }

  // Always show actions column
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
      per_page: 20,
      search: searchTerm || undefined,
      sort_by: sortDescriptor.column as string,
      sort_order: sortDescriptor.direction === 'ascending' ? 'asc' : 'desc',
    }

    // Add filters to query params
    if (filters.status) {
      params.status = filters.status
    }
    if (filters.container_id) {
      params.container_id = filters.container_id
    }
    if (filters.storage_type) {
      params.storage_type = filters.storage_type
    }
    if (filters.storage_location) {
      params.storage_location = filters.storage_location
    }

    return params
  }, [page, searchTerm, sortDescriptor, filters])

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

  // Extract location suggestions from current items
  const locationSuggestions = useMemo(() => {
    return Array.from(uniqueValues.storageLocations)
  }, [uniqueValues.storageLocations])

  const updateItemMutation = useUpdateItem()
  const createItemMutation = useCreateItem()
  // const bulkDeleteMutation = useBulkDeleteItems()
  const bulkUpdateDisposedMutation = useBulkUpdateItemsDisposedStatus()
  const bulkMoveToContainerMutation = useBulkMoveToContainer()
  // const bulkUpdateStorageLocationMutation = useBulkUpdateStorageLocation()
  const disposeItemMutation = useDisposeItem()
  const undisposeItemMutation = useUndisposeItem()
  // const returnItemMutation = useReturnItem()

  const handleUpdate = async (id: string, field: keyof Item, value: any) => {
    await updateItemMutation.mutateAsync({ id, data: { [field]: value } })
  }

  // const handleCreate = async ({ name, label_id }: { name: string; label_id: string }) => {
  //   await createItemMutation.mutateAsync({ name, label_id, storage_type: "location" })
  // }

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

  
  // const handleReturnItem = async (itemId: string) => {
  //   console.log("Returning item:", itemId)
  // }

  const renderCell = useCallback((item: Item, columnKey: React.Key) => {
    const cellValue = item[columnKey as keyof Item]

    switch (columnKey) {
      case 'name':
        return (
          <EditableCell value={item.name} onSave={(value) => handleUpdate(item.id, 'name', value)}>
            <span className="font-semibold">{item.name}</span>
          </EditableCell>
        )
      case 'label_id':
        return (
          <EditableCell value={item.label_id} onSave={(value) => handleUpdate(item.id, 'label_id', value)}>
            <span className="font-mono">{item.label_id}</span>
          </EditableCell>
        )
      case 'model_number':
        return (
          <EditableCell value={item.model_number || ''} onSave={(value) => handleUpdate(item.id, 'model_number', value)}>
            <span>{item.model_number}</span>
          </EditableCell>
        )
      case 'storage_location': {
        // Disable editing if storage_type is "container"
        const isLocationEditable = item.storage_type !== "container";
        if (!isLocationEditable) {
          return (
            <Chip size="sm" variant="flat" color="default">
              {item.storage_location ? item.storage_location : '保管場所未設定'}
            </Chip>
          );
        }
        return (
          <EditableCell
            value={item.storage_location || ''}
            onSave={(value) => handleUpdate(item.id, 'storage_location', value)}
          >
            <Chip size="sm" variant="flat" color="default">
              {item.storage_location ? item.storage_location : '保管場所未設定'}
            </Chip>
          </EditableCell>
        );
      }
      case 'container_id': {
        // Disable editing if storage_type is "location"
        const isContainerEditable = item.storage_type !== "location";
        const container = containers.find(c => c.id === item.container_id)
        if (!isContainerEditable) {
          return (
            <div className="flex items-center gap-2">
              <Package size={16} className="text-gray-500" />
              {container?.name || '-'}
            </div>
          );
        }
        return (
          <EditableCell
            value={item.container_id || ''}
            onSave={(value) => handleUpdate(item.id, 'container_id', value)}
          >
            <div className="flex items-center gap-2">
              <Package size={16} className="text-gray-500" />
              {container?.name || '-'}
            </div>
          </EditableCell>
        );
      }
      case 'remarks':
        return (
          <EditableCell value={item.remarks || ''} onSave={(value) => handleUpdate(item.id, 'remarks', value)}>
            <span>{item.remarks}</span>
          </EditableCell>
        )
      case 'purchase_year':
        if (!item.purchase_year) return '-'
        // Format as yyyy/mm/dd
        const date = new Date(item.purchase_year)
        const yyyy = date.getFullYear()
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const dd = String(date.getDate()).padStart(2, '0')
        return `${yyyy}/${mm}/${dd}`
      case 'created_at':
        if (!item.created_at) return '-'
        const createdDate = new Date(item.created_at)
        const cYyyy = createdDate.getFullYear()
        const cMm = String(createdDate.getMonth() + 1).padStart(2, '0')
        const cDd = String(createdDate.getDate()).padStart(2, '0')
        return `${cYyyy}/${cMm}/${cDd}`
      case 'updated_at':
        if (!item.updated_at) return '-'
        const updatedDate = new Date(item.updated_at)
        const uYyyy = updatedDate.getFullYear()
        const uMm = String(updatedDate.getMonth() + 1).padStart(2, '0')
        const uDd = String(updatedDate.getDate()).padStart(2, '0')
        return `${uYyyy}/${uMm}/${uDd}`
      case 'image_url':
        if (!item.image_url) return '-'
        return (
          <div className="flex items-center">
            <img 
              src={item.image_url} 
              alt="Item" 
              className="w-10 h-10 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.open(item.image_url, '_blank')}
              title="クリックで拡大表示"
            />
          </div>
        )
      case 'is_disposed':
        if (item.is_disposed) return <Chip color="danger" size="sm">廃棄済み</Chip>
        return <Chip color="success" size="sm">利用可能</Chip>
      case 'actions':
        return (
          <div className="flex gap-1 justify-end">
            <Button as={Link} to={`/items/${item.id}`} isIconOnly size="sm" variant="light" title="詳細">
              <Eye size={16} />
            </Button>
            <Button as={Link} to={`/items/${item.id}/edit`} isIconOnly size="sm" variant="light" color="primary" title="編集">
              <Edit size={16} />
            </Button>
            {!item.is_disposed && !item.is_on_loan && (
              <Button as={Link} to={`/loans/new?item_id=${item.id}`} isIconOnly size="sm" variant="light" color="primary" title="貸出">
                <Users size={16} />
              </Button>
            )}
            {!item.is_disposed && item.is_on_loan && (
              <Button isIconOnly size="sm" variant="light" color="warning" title="返却" onPress={() => console.log('return item')} isLoading={false}>
                <Undo size={16} />
              </Button>
            )}
            {item.is_disposed ? (
              <Button isIconOnly size="sm" variant="light" color="success" title="復元" onPress={() => undisposeItemMutation.mutate(item.id)} isLoading={undisposeItemMutation.isPending}>
                <RotateCcw size={16} />
              </Button>
            ) : (
              <Button isIconOnly size="sm" variant="light" color="danger" title="廃棄" onPress={() => disposeItemMutation.mutate(item.id)} isLoading={disposeItemMutation.isPending}>
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        )
      default:
        return cellValue as React.ReactNode
    }
  }, [containers, updateItemMutation, disposeItemMutation, undisposeItemMutation])

  // アイテム作成ハンドラー
  const handleCreateItem = async (itemData: {
    name: string
    label_id: string
    container_id?: string
    storage_location?: string
  }) => {
    try {
      await createItemMutation.mutateAsync({
        ...itemData,
        storage_type: itemData.container_id ? 'container' : 'location'
      })
    } catch (error) {
      console.error('Failed to create item:', error)
    }
  }

  const renderCard = useCallback((item: Item) => (
    <div className="flex flex-col gap-2">
      <div className="font-bold text-lg">{item.name}</div>
      <div className="text-sm text-gray-500">{item.label_id}</div>
      <div>{renderCell(item, 'is_disposed')}</div>
      <div className="flex justify-end">
        {renderCell(item, 'actions')}
      </div>
    </div>
  ), [renderCell])

  // (moved above for persistence logic)

  if (error) return <div>備品の読み込み中にエラーが発生しました: {error.message}</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">備品管理</h1>
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
        <Input
          isClearable
          className="w-full lg:max-w-md"
          placeholder="名称・ラベル・型番で検索..."
          startContent={<Search />}
          value={searchTerm}
          onClear={() => setSearchTerm('')}
          onValueChange={setSearchTerm}
        />
        <div className="flex items-center gap-2">
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            containers={containers}
            uniqueValues={uniqueValues}
          />
          <Button
            size="sm"
            variant="bordered"
            aria-label="カラム設定"
            onClick={() => console.log('Column settings')}
          >
            カラム設定
          </Button>
        </div>
        {false && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.2)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => console.log('close modal')}
          >
            <div
              style={{
                background: 'white',
                borderRadius: 8,
                boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
                padding: 24,
                minWidth: 320,
                maxWidth: 400,
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative'
              }}
              onClick={e => { e.stopPropagation(); console.log('modal click'); }}
            >
              <h2 className="text-lg font-bold mb-2">カラム設定</h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={({ active, over }) => {
                  if (active.id !== over?.id && over?.id) {
                    const oldIndex = columnOrder.indexOf(active.id as string)
                    const newIndex = columnOrder.indexOf(over.id as string)
                    const newOrder = arrayMove(columnOrder, oldIndex, newIndex)
                    setColumnOrder(newOrder)
                    localStorage.setItem(columnOrderStorageKey, JSON.stringify(newOrder))
                  }
                }}
              >
                <SortableContext
                  items={visibleColumnKeys}
                  strategy={verticalListSortingStrategy}
                >
                  {/* Draggable for visible columns */}
                  <SortableContext
                    items={orderedVisibleColumnKeys}
                    strategy={verticalListSortingStrategy}
                  >
                    {orderedVisibleColumnKeys.map(key => {
                      const col = allColumnDefs.find(c => c.key === key)
                      if (!col) return null
                      return (
                        <SortableColumnItem
                          key={col.key}
                          id={col.key}
                          label={col.label}
                          checked={true}
                          onToggle={() => handleToggleColumn(col.key as string)}
                        />
                      )
                    })}
                  </SortableContext>
                  {/* Non-draggable for hidden columns */}
                  {columnOrder
                    .filter(key => !visibleColumnKeys.includes(key))
                    .map(key => {
                      const col = allColumnDefs.find(c => c.key === key)
                      if (!col) return null
                      return (
                        <div key={col.key} className="flex items-center gap-2 px-2 py-1 opacity-60">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleToggleColumn(col.key as string)}
                            tabIndex={-1}
                            className="accent-blue-500"
                            style={{ pointerEvents: 'auto' }}
                          />
                          <span>{col.label}</span>
                        </div>
                      )
                    })}
                </SortableContext>
              </DndContext>
              <div className="flex justify-end mt-4">
                <Button size="sm" variant="light" onClick={() => console.log('close')}>
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-300 rounded-lg shadow-md p-2 mb-4">
        <EnhancedList<Item>
          items={items}
          columns={columns}
          isLoading={isLoading}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          renderCell={renderCell}
          renderCard={renderCard}
          emptyContent={<p>備品が見つかりません</p>}
          selectionMode="multiple"
          selectedKeys={selectionKeys}
          onSelectionChange={setSelectionKeys}
        />
      </div>

      <div className="bg-white border border-gray-300 rounded-lg shadow-md p-2 mb-4">
        <ItemInlineCreator
          containers={containers}
          locationSuggestions={locationSuggestions}
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

// アイテム用インライン作成コンポーネント
function ItemInlineCreator({ containers, locationSuggestions, onSave }: {
  containers: Container[],
  locationSuggestions: string[],
  onSave: (value: { name: string; label_id: string; container_id?: string; storage_location?: string }) => Promise<void>
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [labelId, setLabelId] = useState('')
  const [containerId, setContainerId] = useState('')
  const [storageLocation, setStorageLocation] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (name.trim() && labelId.trim()) {
      setIsSaving(true)
      await onSave({
        name: name.trim(),
        label_id: labelId.trim(),
        container_id: containerId || undefined,
        storage_location: storageLocation || undefined,
      })
      setIsSaving(false)
      setName('')
      setLabelId('')
      setContainerId('')
      setStorageLocation('')
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setName('')
      setLabelId('')
      setContainerId('')
      setStorageLocation('')
      setIsCreating(false)
    }
  }

  if (isCreating) {
    return (
      <div className="flex gap-2 p-2 flex-wrap">
        <Input
          autoFocus
          aria-label="New item name"
          placeholder="名称"
          value={name}
          onValueChange={setName}
          onKeyDown={handleKeyDown}
          size="sm"
          className="flex-grow"
          disabled={isSaving}
        />
        <Input
          aria-label="Label ID"
          placeholder="ラベルID"
          value={labelId}
          onValueChange={setLabelId}
          onKeyDown={handleKeyDown}
          size="sm"
          className="flex-grow"
          disabled={isSaving}
        />
        <div className="w-36">
          <Select
            aria-label="コンテナ"
            placeholder="コンテナ"
            selectedKeys={containerId ? new Set([containerId]) : new Set()}
            onSelectionChange={keys => setContainerId(Array.from(keys)[0] as string)}
            size="sm"
            disabled={isSaving}
          >
            {containers.map(c =>
              <SelectItem key={c.id}>{c.name} - <span className="text-gray-500">{c.location}</span></SelectItem>
            )}
          </Select>
        </div>
        <div className="flex-grow">
          <Autocomplete
            aria-label="保管場所"
            placeholder="保管場所を入力または選択"
            allowsCustomValue
            value={storageLocation}
            onValueChange={setStorageLocation}
            onKeyDown={handleKeyDown}
            size="sm"
            disabled={isSaving}
          >
            {locationSuggestions.map(loc => (
              <AutocompleteItem key={loc}>{loc}</AutocompleteItem>
            ))}
          </Autocomplete>
        </div>
        <Button
          size="sm"
          color="primary"
          onPress={handleSave}
          isLoading={isSaving}
          disabled={!name.trim() || !labelId.trim()}
        >
          保存
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="light"
      color="default"
      className="w-full justify-start p-2"
      startContent={<Plus size={16} />}
      onPress={() => setIsCreating(true)}
    >
      新規備品作成...
    </Button>
  )
}

// Sortable column item for drag-and-drop
function SortableColumnItem({ id, label, checked, onToggle }: { id: string, label: string, checked: boolean, onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    background: isDragging ? '#f0f0f0' : undefined,
    borderRadius: 4,
    padding: '2px 0'
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-2 px-2 py-1">
      <GripVertical size={16} className="text-gray-400" />
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        tabIndex={-1}
        className="accent-blue-500"
        style={{ pointerEvents: 'auto' }}
      />
      <span>{label}</span>
    </div>
  )
}
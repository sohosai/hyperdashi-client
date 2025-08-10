import { useState, useMemo, useCallback, useEffect } from 'react'
import { Autocomplete, AutocompleteItem } from '@heroui/react'
import { AdvancedContainerFilters, ContainerFilterState } from '@/components/ui/AdvancedContainerFilters'

// EditableAutocompleteCell for grid editing with suggestions
function EditableAutocompleteCell({
  value,
  onSave,
  suggestions,
  children,
}: {
  value: string
  onSave: (value: string) => void
  suggestions: string[]
  children: React.ReactNode
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentValue, setCurrentValue] = useState(value)

  useEffect(() => {
    setCurrentValue(value)
  }, [value])

  const handleDoubleClick = () => setIsEditing(true)
  const handleSave = () => {
    if (currentValue !== value) onSave(currentValue)
    setIsEditing(false)
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    else if (e.key === 'Escape') {
      setCurrentValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Autocomplete
        autoFocus
        label="場所"
        placeholder="場所"
        value={currentValue}
        onValueChange={setCurrentValue}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        size="sm"
        className="min-w-[120px]"
      >
        {suggestions.map(loc => (
          <AutocompleteItem key={loc}>{loc}</AutocompleteItem>
        ))}
      </Autocomplete>
    )
  }

  return (
    <div onDoubleClick={handleDoubleClick} className="cursor-pointer w-full h-full p-2 -m-2">
      {children}
    </div>
  )
}
import { Link } from 'react-router-dom'
import {
  Button,
  Input,
  Chip,
  Checkbox,
  SortDescriptor,
  Selection,
} from '@heroui/react'
import { Plus, Search, Package, Edit, Eye, Trash2, GripVertical } from 'lucide-react'
import {
  useContainers,
  useUpdateContainer,
  useCreateContainer,
  // useBulkDeleteContainers,
  // useBulkUpdateContainersDisposedStatus,
} from '@/hooks'
import { ContainerWithItemCount } from '@/services'
import { EnhancedList, ColumnDef } from '@/components/ui/EnhancedList'
import { EditableCell } from '@/components/ui/EditableCell'
import { ContainerBulkActionBar } from '@/components/ui/ContainerBulkActionBar'

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

export function ContainersList() {
  // Move sensors hook to top-level to avoid conditional hook call
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [searchQuery, setSearchQuery] = useState('')
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending',
  })
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set())

  // Advanced filters state
  const [filters, setFilters] = useState<ContainerFilterState>({})

  // Column selection state
  // All possible columns for Container
  const allColumnDefs: ColumnDef<ContainerWithItemCount>[] = [
    { key: 'name', label: '名称', sortable: true },
    { key: 'location', label: '場所', sortable: true },
    { key: 'remarks' as keyof ContainerWithItemCount, label: '備考' },
    { key: 'image_url' as keyof ContainerWithItemCount, label: '画像' },
    { key: 'item_count', label: '備品数', sortable: true },
    { key: 'is_disposed', label: '状態', sortable: true },
    { key: 'created_at', label: '登録日', sortable: true },
    { key: 'updated_at', label: '更新日', sortable: true },
    { key: 'actions', label: '操作', align: 'end' },
  ]
  const columnStorageKey = 'containersListColumns'
  const defaultColumnKeys = allColumnDefs.map(col => col.key).filter(key => key !== 'actions')
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(columnStorageKey)
      if (saved) return JSON.parse(saved)
    }
    return defaultColumnKeys
  })
  // const [showColumnModal, setShowColumnModal] = useState(false)

  const handleToggleColumn = (key: string) => {
    let next: string[]
    if (visibleColumnKeys.includes(key)) {
      next = visibleColumnKeys.filter(k => k !== key)
    } else {
      next = [...visibleColumnKeys, key]
    }
    setVisibleColumnKeys(next)
    localStorage.setItem(columnStorageKey, JSON.stringify(next))
  }

  // Always show actions column
  const columns: ColumnDef<ContainerWithItemCount>[] = useMemo(() => {
    return allColumnDefs.filter(
      col => col.key === 'actions' || visibleColumnKeys.includes(col.key as string)
    )
  }, [visibleColumnKeys])
  
  const { data: containersData, isLoading, error } = useContainers({
    search: searchQuery,
    include_disposed: filters.status === 'disposed' || (!filters.status && true),
    location: filters.location,
    sort_by: sortDescriptor.column as string,
    sort_order: sortDescriptor.direction === 'ascending' ? 'asc' : 'desc',
  })
  let containers = containersData?.containers || []

  // Apply client-side filters
  containers = containers.filter(c => {
    // Name filter
    if (filters.name && !c.name.toLowerCase().includes(filters.name.toLowerCase())) return false
    
    // Remarks filter  
    if (filters.remarks && (!(c as any).remarks || !(c as any).remarks.toLowerCase().includes(filters.remarks.toLowerCase()))) return false
    
    // Status filter
    if (filters.status === 'active' && c.is_disposed) return false
    if (filters.status === 'disposed' && !c.is_disposed) return false
    
    // Item count filter
    const minItemCount = filters.item_count_from ? parseInt(filters.item_count_from, 10) : undefined
    const maxItemCount = filters.item_count_to ? parseInt(filters.item_count_to, 10) : undefined
    if (minItemCount !== undefined && c.item_count < minItemCount) return false
    if (maxItemCount !== undefined && c.item_count > maxItemCount) return false
    
    // Date filters
    if (filters.created_at_from) {
      const createdDate = new Date(c.created_at)
      const filterDate = new Date(filters.created_at_from)
      if (createdDate < filterDate) return false
    }
    if (filters.created_at_to) {
      const createdDate = new Date(c.created_at)
      const filterDate = new Date(filters.created_at_to)
      filterDate.setHours(23, 59, 59, 999) // End of day
      if (createdDate > filterDate) return false
    }
    if (filters.updated_at_from) {
      const updatedDate = new Date(c.updated_at)
      const filterDate = new Date(filters.updated_at_from)
      if (updatedDate < filterDate) return false
    }
    if (filters.updated_at_to) {
      const updatedDate = new Date(c.updated_at)
      const filterDate = new Date(filters.updated_at_to)
      filterDate.setHours(23, 59, 59, 999) // End of day
      if (updatedDate > filterDate) return false
    }
    
    return true
  })

  // Get unique values for filter dropdown
  const uniqueValues = useMemo(() => {
    const locations = new Set<string>()
    containersData?.containers?.forEach(c => {
      if (c.location) {
        locations.add(c.location)
      }
    })
    return {
      locations: Array.from(locations).sort(),
    }
  }, [containersData])

  const updateContainerMutation = useUpdateContainer()
  const createContainerMutation = useCreateContainer()
  // const bulkDeleteMutation = useBulkDeleteContainers()
  // const bulkUpdateDisposedMutation = useBulkUpdateContainersDisposedStatus()

  const handleUpdateContainer = (id: string, data: Partial<ContainerWithItemCount>) => {
    updateContainerMutation.mutate({ id, data })
  }

  // const handleCreateContainer = async ({ name }: { name: string; label_id?: string }) => {
  //   await createContainerMutation.mutateAsync({ id: '', name, location: 'Default Location' })
  // }

  // const handleBulkDelete = () => {
  //   if (selectedKeys !== 'all') {
  //     const ids = Array.from(selectedKeys) as string[]
  //     bulkDeleteMutation.mutate({ ids })
  //   }
  //   setSelectedKeys(new Set())
  // }

  // const handleBulkDispose = () => {
  //   if (selectedKeys !== 'all') {
  //     const ids = Array.from(selectedKeys) as string[]
  //     bulkUpdateDisposedMutation.mutate({ ids, is_disposed: true })
  //   }
  //   setSelectedKeys(new Set())
  // }

  // const handleBulkUndispose = () => {
  //   if (selectedKeys !== 'all') {
  //     const ids = Array.from(selectedKeys) as string[]
  //     bulkUpdateDisposedMutation.mutate({ ids, is_disposed: false })
  //   }
  //   setSelectedKeys(new Set())
  // }

  const renderCell = useCallback((container: ContainerWithItemCount, columnKey: React.Key) => {
    const cellValue = container[columnKey as keyof ContainerWithItemCount]

    switch (columnKey) {
      case 'name':
        return (
          <EditableCell
            value={container.name}
            onSave={(newValue) => handleUpdateContainer(container.id, { name: newValue })}
          >
            <div className="flex items-center gap-2">
              <Package size={16} className="text-gray-500" />
              {container.name}
            </div>
          </EditableCell>
        )
      case 'location':
        return (
          <EditableAutocompleteCell
            value={container.location}
            onSave={(newValue) => handleUpdateContainer(container.id, { location: newValue })}
            suggestions={uniqueValues.locations}
          >
            <Chip size="sm" variant="flat" color="default">
              {container.location}
            </Chip>
          </EditableAutocompleteCell>
        )
      case 'item_count':
        return (
          <Chip size="sm" variant={container.item_count > 0 ? 'flat' : 'bordered'}>
            {container.item_count} 個
          </Chip>
        )
      case 'is_disposed':
        return (
          <Chip
            size="sm"
            color={container.is_disposed ? 'danger' : 'success'}
            variant="flat"
          >
            {container.is_disposed ? '廃棄済み' : '使用中'}
          </Chip>
        )
      case 'remarks':
        return (
          <EditableCell
            value={(container as any).remarks || ''}
            onSave={(newValue) => handleUpdateContainer(container.id, { remarks: newValue } as any)}
          >
            <span className="text-sm">{(container as any).remarks || '-'}</span>
          </EditableCell>
        )
      case 'image_url':
        if (!container.image_url) return '-'
        return (
          <div className="flex items-center">
            <img 
              src={container.image_url} 
              alt="Container" 
              className="w-10 h-10 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.open(container.image_url, '_blank')}
              title="クリックで拡大表示"
            />
          </div>
        )
      case 'created_at':
        if (!container.created_at) return '-'
        const createdDate = new Date(container.created_at)
        const cYyyy = createdDate.getFullYear()
        const cMm = String(createdDate.getMonth() + 1).padStart(2, '0')
        const cDd = String(createdDate.getDate()).padStart(2, '0')
        return `${cYyyy}/${cMm}/${cDd}`
      case 'updated_at':
        if (!container.updated_at) return '-'
        const updatedDate = new Date(container.updated_at)
        const uYyyy = updatedDate.getFullYear()
        const uMm = String(updatedDate.getMonth() + 1).padStart(2, '0')
        const uDd = String(updatedDate.getDate()).padStart(2, '0')
        return `${uYyyy}/${uMm}/${uDd}`
      case 'actions':
        return (
          <div className="flex gap-1 justify-end">
            <Button as={Link} to={`/containers/${container.id}`} isIconOnly size="sm" variant="light" title="詳細">
              <Eye size={16} />
            </Button>
            <Button as={Link} to={`/containers/${container.id}/edit`} isIconOnly size="sm" variant="light" title="編集">
              <Edit size={16} />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              title={container.is_disposed ? "復元" : "廃棄"}
              onClick={() => handleUpdateContainer(container.id, { is_disposed: !container.is_disposed })}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )
      default:
        return <div>{cellValue as any}</div>
    }
  }, [])

  const renderCard = useCallback((container: ContainerWithItemCount) => (
    <div className="flex flex-col gap-2">
      <div className="font-bold text-lg">{container.name}</div>
      <div className="text-sm text-gray-500">{container.location}</div>
      <div>{renderCell(container, 'is_disposed')}</div>
      <div className="flex justify-end">
        {renderCell(container, 'actions')}
      </div>
    </div>
  ), [renderCell])

  // (moved to above for persistence logic)

  if (error) return <div>コンテナの読み込み中にエラーが発生しました。</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">コンテナ管理</h1>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
        <Input
          isClearable
          className="w-full lg:max-w-md"
          placeholder="名称・場所で検索..."
          startContent={<Search />}
          value={searchQuery}
          onClear={() => setSearchQuery('')}
          onValueChange={setSearchQuery}
        />
        <div className="flex items-center gap-2">
          <AdvancedContainerFilters
            filters={filters}
            onFiltersChange={setFilters}
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
              {/* Move sensors hook to top-level to avoid conditional hook call */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={({ active, over }) => {
                  if (active.id !== over?.id) {
                    const oldIndex = visibleColumnKeys.indexOf(active.id as string)
                    const newIndex = visibleColumnKeys.indexOf(over?.id as string)
                    const newOrder = arrayMove(visibleColumnKeys, oldIndex, newIndex)
                    setVisibleColumnKeys(newOrder)
                    localStorage.setItem(columnStorageKey, JSON.stringify(newOrder))
                  }
                }}
              >
                <SortableContext
                  items={visibleColumnKeys}
                  strategy={verticalListSortingStrategy}
                >
                  {visibleColumnKeys.map(key => {
                    const col = allColumnDefs.find(c => c.key === key)
                    if (!col) return null
                    return (
                      <SortableColumnItem
                        key={col.key}
                        id={col.key}
                        label={col.label}
                        checked={true}
                        onToggle={() => handleToggleColumn(col.key as string)}
                        useHeroUI
                      />
                    )
                  })}
                </SortableContext>
                {/* Non-draggable for hidden columns */}
                {allColumnDefs
                  .filter(col => col.key !== 'actions' && !visibleColumnKeys.includes(col.key))
                  .map(col => (
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
                  ))}
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
        <EnhancedList<ContainerWithItemCount>
          items={containers}
          columns={columns}
          isLoading={isLoading}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          renderCell={renderCell}
          renderCard={renderCard}
          emptyContent="コンテナが見つかりません"
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        />
      </div>

      <div className="py-4">
        <ContainerInlineCreatorRow
          locationSuggestions={uniqueValues.locations}
          onSave={async ({ name, location }) => {
            await createContainerMutation.mutateAsync({ id: '', name, location })
          }}
        />
      </div>

      <ContainerBulkActionBar
        selectedCount={selectedKeys === 'all' ? (containersData as any)?.total || 0 : selectedKeys.size}
        onClearSelection={() => setSelectedKeys(new Set([]))}
        onDispose={() => console.log('dispose')}
        onUndispose={() => console.log('undispose')}
      />
    </div>
  )
}

// Custom inline creator row for containers
function ContainerInlineCreatorRow({
  locationSuggestions,
  onSave,
}: {
  locationSuggestions: string[],
  onSave: (value: { name: string; location: string }) => Promise<void>
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (name.trim() && location.trim()) {
      setIsSaving(true)
      await onSave({
        name: name.trim(),
        location: location.trim(),
      })
      setIsSaving(false)
      setName('')
      setLocation('')
      setIsCreating(false)
    }
    
    // EditableAutocompleteCell for grid editing with suggestions
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // function EditableAutocompleteCell({
    //   value,
    //   onSave,
    //   suggestions,
    //   children,
    // }: {
    //   value: string
    //   onSave: (value: string) => void
    //   suggestions: string[]
    //   children: React.ReactNode
    // }) {
    //   const [isEditing, setIsEditing] = useState(false)
    //   const [currentValue, setCurrentValue] = useState(value)
    // 
    //   useEffect(() => {
    //     setCurrentValue(value)
    //   }, [value])
    // 
    //   const handleDoubleClick = () => setIsEditing(true)
    //   const handleSave = () => {
    //     if (currentValue !== value) onSave(currentValue)
    //     setIsEditing(false)
    //   }
    //   const handleKeyDown = (e: React.KeyboardEvent) => {
    //     if (e.key === 'Enter') handleSave()
    //     else if (e.key === 'Escape') {
    //       setCurrentValue(value)
    //       setIsEditing(false)
    //     }
    //   }
    // 
    //   if (isEditing) {
    //     return (
    //       <Autocomplete
    //         autoFocus
    //         label="場所"
    //         placeholder="場所"
    //         value={currentValue}
    //         onValueChange={setCurrentValue}
    //         onBlur={handleSave}
    //         onKeyDown={handleKeyDown}
    //         size="sm"
    //         className="min-w-[120px]"
    //       >
    //         {suggestions.map(loc => (
    //           <AutocompleteItem key={loc}>{loc}</AutocompleteItem>
    //         ))}
    //       </Autocomplete>
    //     )
    //   }
    // 
    //   return (
    //     <div onDoubleClick={handleDoubleClick} className="cursor-pointer w-full h-full p-2 -m-2">
    //       {children}
    //     </div>
    //   )
    // }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setName('')
      setLocation('')
      setIsCreating(false)
    }
  }

  if (isCreating) {
    return (
      <div className="flex gap-2 p-2 flex-wrap">
        <Input
          autoFocus
          aria-label="New container name"
          placeholder="名称"
          value={name}
          onValueChange={setName}
          onKeyDown={handleKeyDown}
          size="sm"
          className="flex-grow"
          disabled={isSaving}
        />
        <div className="w-48">
          <Autocomplete
            label="場所"
            placeholder="場所を入力または選択"
            allowsCustomValue
            value={location}
            onValueChange={setLocation}
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
          disabled={!name.trim() || !location.trim()}
        >
          Save
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
      新規コンテナ作成...
    </Button>
  )
}

// Sortable column item for drag-and-drop
function SortableColumnItem({ id, label, checked, onToggle, useHeroUI }: { id: string, label: string, checked: boolean, onToggle: () => void, useHeroUI?: boolean }) {
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
  if (useHeroUI) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-2 px-2 py-1">
        <GripVertical size={16} className="text-gray-400" />
        <Checkbox
          isSelected={checked}
          onValueChange={onToggle}
          size="sm"
          color="primary"
          className="pointer-events-auto"
        >
          {label}
        </Checkbox>
      </div>
    )
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
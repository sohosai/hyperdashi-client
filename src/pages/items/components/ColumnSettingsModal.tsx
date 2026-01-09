
import { GripVertical } from 'lucide-react'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ColumnDef } from '@/components/ui/EnhancedList'
import { Item } from '@/types'

// isOpen and onClose are no longer needed as we use Popover
// keeping the interface name for now but could simplify
export interface ColumnSettingsModalProps {
    isOpen?: boolean
    onClose?: () => void
    allColumnDefs: ColumnDef<Item>[]
    visibleColumnKeys: string[]
    setVisibleColumnKeys: (keys: string[]) => void
    columnOrder: string[]
    setColumnOrder: (order: string[]) => void
    columnOrderStorageKey: string
    columnVisibilityStorageKey: string
    orderedVisibleColumnKeys: string[]
}

export function ColumnSettingsContent({
    allColumnDefs,
    visibleColumnKeys,
    setVisibleColumnKeys,
    columnOrder,
    setColumnOrder,
    columnOrderStorageKey,
    columnVisibilityStorageKey,
    orderedVisibleColumnKeys
}: Omit<ColumnSettingsModalProps, 'isOpen' | 'onClose'>) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    )

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

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id && over?.id) {
            const oldIndex = columnOrder.indexOf(active.id as string)
            const newIndex = columnOrder.indexOf(over.id as string)
            const newOrder = arrayMove(columnOrder, oldIndex, newIndex)
            setColumnOrder(newOrder)
            localStorage.setItem(columnOrderStorageKey, JSON.stringify(newOrder))
        }
    }

    return (
        <div className="p-4 w-80">
            <h3 className="text-lg font-semibold mb-4">カラム設定</h3>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={visibleColumnKeys}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-1 max-h-[60vh] overflow-y-auto">
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
                                        id={col.key as string}
                                        label={typeof col.label === 'string' ? col.label : String(col.key)}
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
                                        <span>{typeof col.label === 'string' ? col.label : String(col.key)}</span>
                                    </div>
                                )
                            })}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
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
            <GripVertical size={16} className="text-default-500" />
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

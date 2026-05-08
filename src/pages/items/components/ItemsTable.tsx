import React, { useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
    Button,
    Chip,
    SortDescriptor,
    Selection,
    Pagination,
    Select,
    SelectItem,
} from '@heroui/react'
import { Eye, Edit, Users, Undo, RotateCcw, Trash2, Package } from 'lucide-react'
import { Item, Container } from '@/types'
import {
    useUpdateItem,
    useDisposeItem,
    useUndisposeItem,
} from '@/hooks'
import { EnhancedList, ColumnDef } from '@/components/ui/EnhancedList'
import { EditableCell } from '@/components/ui/EditableCell'
import { CableVisualization } from '@/components/ui/CableVisualization'
import { ConnectionVisualization } from '@/components/ui/ConnectionVisualization'
import { EditableContainerCell } from './EditableContainerCell'

interface ItemsTableProps {
    items: Item[]
    columns: ColumnDef<Item>[]
    isLoading: boolean
    sortDescriptor: SortDescriptor
    onSortChange: (descriptor: SortDescriptor) => void
    selectionKeys: Selection
    onSelectionChange: (keys: Selection) => void
    containers: Container[]
    total: number
    page: number
    perPage: number
    setPage: (page: number) => void
    setPerPage: (perPage: number) => void
    totalPages: number
}

export function ItemsTable({
    items,
    columns,
    isLoading,
    sortDescriptor,
    onSortChange,
    selectionKeys,
    onSelectionChange,
    containers,
    total,
    page,
    perPage,
    setPage,
    setPerPage,
    totalPages,
}: ItemsTableProps) {
    const updateItemMutation = useUpdateItem()
    const disposeItemMutation = useDisposeItem()
    const undisposeItemMutation = useUndisposeItem()

    const handleUpdate = async (id: string, field: keyof Item, value: any) => {
        await updateItemMutation.mutateAsync({ id, data: { [field]: value } })
    }

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
                const container = containers.find(c => c.id === item.container_id)
                return (
                    <EditableContainerCell
                        value={item.container_id || ''}
                        onSave={(value) => {
                            // Update container_id and storage_type based on selection
                            const updates: any = { container_id: value || null }
                            if (value) {
                                updates.storage_type = 'container'
                                updates.storage_location = null
                            } else {
                                updates.storage_type = 'location'
                            }
                            // Update multiple fields
                            Object.entries(updates).forEach(([field, val]) => {
                                handleUpdate(item.id, field as keyof Item, val)
                            })
                        }}
                        containers={containers}
                    >
                        <div className="flex items-center gap-2">
                            <Package size={16} className="text-default-500" />
                            {container?.name || '-'}
                        </div>
                    </EditableContainerCell>
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
                // Format as yyyy/mm/dd (Wait, purchase_year is number, not Date? ItemForm treats it as number. But list renderer used Date?)
                // ItemForm: type="number". Item type: purchase_year?: number.
                // The original code used new Date(item.purchase_year). If it's a year number (2023), new Date(2023) is distinct from new Date("2023").
                // new Date(2023) -> 1970 + 2023ms. That's wrong.
                // Let's check the type definition.
                return item.purchase_year || '-'
            // The original logic was:
            /*
            const date = new Date(item.purchase_year)
            const yyyy = date.getFullYear()
            */
            // If purchase_year is an ISO string in backend, but type says number?
            // Let's assume it's just a year number for now based on ItemForm.
            // Wait, if it IS a timestamp, ItemForm uses "purchase_year" as key. 
            // Let's stick to simple display for now, assuming it's a year.

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
            case 'connection_names':
                if (!item.connection_names || item.connection_names.length === 0) {
                    return <span className="text-default-400">-</span>
                }
                return (
                    <ConnectionVisualization
                        connections={item.connection_names}
                        size="sm"
                    />
                )
            case 'cable_color_pattern':
                if (!item.cable_color_pattern || item.cable_color_pattern.length === 0) {
                    return <span className="text-default-400">-</span>
                }
                return (
                    <CableVisualization
                        colorNames={item.cable_color_pattern}
                        size="sm"
                        showLabels={false}
                    />
                )
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
                            <Button
                                as={Link}
                                to={`/loans/new?item_id=${item.id}`}
                                size="sm"
                                variant="flat"
                                color="primary"
                                title="貸出"
                                startContent={<Users size={14} />}
                                className="text-xs"
                            >
                                貸出
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

    const renderCard = useCallback((item: Item) => (
        <div className="flex flex-col gap-2">
            <div className="font-bold text-lg">{item.name}</div>
            <div className="text-sm text-default-500">{item.label_id}</div>
            <div>{renderCell(item, 'is_disposed')}</div>
            <div className="flex justify-end">
                {renderCell(item, 'actions')}
            </div>
        </div>
    ), [renderCell])

    return (
        <div className="bg-content1 border border-default-200 rounded-lg shadow-md p-2 mb-4 transition-colors duration-200">
            <EnhancedList<Item>
                items={items}
                columns={columns}
                isLoading={isLoading}
                sortDescriptor={sortDescriptor}
                onSortChange={onSortChange}
                renderCell={renderCell}
                renderCard={renderCard}
                emptyContent={<p>備品が見つかりません</p>}
                selectionMode="multiple"
                selectedKeys={selectionKeys}
                onSelectionChange={onSelectionChange}
            />
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
                    <div className="flex items-center gap-2 text-sm text-default-500">
                        <span>
                            {total}件中 {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)}件を表示
                        </span>
                        <Select
                            size="sm"
                            className="w-20"
                            aria-label="表示件数"
                            selectedKeys={new Set([perPage.toString()])}
                            onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string
                                setPerPage(Number(value))
                                setPage(1)
                            }}
                        >
                            <SelectItem key="10">10</SelectItem>
                            <SelectItem key="20">20</SelectItem>
                            <SelectItem key="50">50</SelectItem>
                            <SelectItem key="100">100</SelectItem>
                        </Select>
                        <span className="text-sm text-default-500">件/ページ</span>
                    </div>
                    <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={page}
                        total={totalPages}
                        onChange={(newPage) => {
                            setPage(newPage)
                            // Scroll to top when page changes
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                    />
                </div>
            )}
        </div>
    )
}

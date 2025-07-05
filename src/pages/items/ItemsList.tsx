import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Chip,
  Pagination,
  Spinner,
  Card,
  CardBody,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Checkbox,
  Select,
  SelectItem,
  SortDescriptor,
} from '@heroui/react'
import { Search, Plus, Eye, Edit, Settings, Trash2, RotateCcw, Users, Undo } from 'lucide-react'
import { Item } from '@/types'
import { useItems, useDisposeItem, useUndisposeItem, useReturnItem } from '@/hooks'
import { CableVisualization } from '@/components/ui/CableVisualization'

export function ItemsList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [visibleColumns, setVisibleColumns] = useState(new Set([
    'label_id', 'name', 'model_number', 'purchase_year', 'cable_colors', 'storage_locations', 'status', 'actions'
  ]))
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending',
  })
  
  // フィルタ状態
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'on_loan' | 'disposed'>('all')
  const [qrCodeFilter, setQrCodeFilter] = useState<'all' | 'qr' | 'barcode' | 'none'>('all')
  const [depreciationFilter, setDepreciationFilter] = useState<'all' | 'target' | 'not_target'>('all')
  const [purchaseYearFrom, setPurchaseYearFrom] = useState('')
  const [purchaseYearTo, setPurchaseYearTo] = useState('')
  
  const disposeItemMutation = useDisposeItem()
  const undisposeItemMutation = useUndisposeItem()
  const returnItemMutation = useReturnItem()
  
  const { data, isLoading, error } = useItems({
    page: 1, // クライアント側でページネーションを行うため、全データを取得
    per_page: 1000, // 大きな値で全データを取得
    search: searchTerm || undefined,
  })

  const allItems = data?.data || []
  
  // フィルタリング処理
  const filteredItems = allItems.filter(item => {
    // ステータスフィルタ
    if (statusFilter !== 'all') {
      if (statusFilter === 'available' && (item.is_disposed || item.is_on_loan)) return false
      if (statusFilter === 'on_loan' && !item.is_on_loan) return false
      if (statusFilter === 'disposed' && !item.is_disposed) return false
    }
    
    // QRコードフィルタ
    if (qrCodeFilter !== 'all') {
      const qrType = item.qr_code_type || 'none'
      if (qrCodeFilter !== qrType) return false
    }
    
    // 減価償却フィルタ
    if (depreciationFilter !== 'all') {
      if (depreciationFilter === 'target' && !item.is_depreciation_target) return false
      if (depreciationFilter === 'not_target' && item.is_depreciation_target) return false
    }
    
    // 購入年フィルタ
    if (purchaseYearFrom && item.purchase_year && item.purchase_year < parseInt(purchaseYearFrom)) return false
    if (purchaseYearTo && item.purchase_year && item.purchase_year > parseInt(purchaseYearTo)) return false
    
    return true
  })
  
  // ソート処理
  const sortedItems = [...filteredItems].sort((a, b) => {
    const { column, direction } = sortDescriptor
    let aValue: any = a[column as keyof Item]
    let bValue: any = b[column as keyof Item]
    
    // 文字列の場合
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    // 数値の場合
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'ascending' ? aValue - bValue : bValue - aValue
    }
    
    // 日付の場合
    if (column === 'created_at' || column === 'updated_at') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
      return direction === 'ascending' ? aValue - bValue : bValue - aValue
    }
    
    // 文字列比較
    if (aValue < bValue) return direction === 'ascending' ? -1 : 1
    if (aValue > bValue) return direction === 'ascending' ? 1 : -1
    return 0
  })
  
  // ページネーション処理
  const itemsPerPage = 20
  const totalFilteredItems = sortedItems.length
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const items = sortedItems.slice(startIndex, endIndex)

  const allColumns = [
    { key: 'image', label: '画像', sortable: false },
    { key: 'label_id', label: 'ラベルID', sortable: true },
    { key: 'name', label: '備品名', sortable: true },
    { key: 'model_number', label: '型番', sortable: true },
    { key: 'purchase_info', label: '購入情報', sortable: false },
    { key: 'purchase_year', label: '購入年', sortable: true },
    { key: 'purchase_amount', label: '購入金額', sortable: true },
    { key: 'durability_years', label: '耐用年数', sortable: true },
    { key: 'connections', label: '接続', sortable: false },
    { key: 'cable_colors', label: 'ケーブル色', sortable: false },
    { key: 'storage_locations', label: '保管場所', sortable: false },
    { key: 'qr_code_type', label: 'QRコード', sortable: true },
    { key: 'depreciation', label: '減価償却', sortable: true },
    { key: 'status', label: 'ステータス', sortable: false },
    { key: 'created_at', label: '作成日', sortable: true },
    { key: 'updated_at', label: '更新日', sortable: true },
    { key: 'actions', label: '操作', sortable: false },
  ]

  const columns = allColumns.filter(col => visibleColumns.has(col.key) || col.key === 'actions')

  const toggleColumnVisibility = (columnKey: string) => {
    const newVisibleColumns = new Set(visibleColumns)
    if (newVisibleColumns.has(columnKey)) {
      newVisibleColumns.delete(columnKey)
    } else {
      newVisibleColumns.add(columnKey)
    }
    setVisibleColumns(newVisibleColumns)
  }

  const resetFilters = () => {
    setStatusFilter('all')
    setQrCodeFilter('all')
    setDepreciationFilter('all')
    setPurchaseYearFrom('')
    setPurchaseYearTo('')
    setPage(1)
  }

  const handleReturnItem = async (itemId: number) => {
    try {
      // Get active loan for this item using the loans service
      const loansResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080/api/v1'}/loans?item_id=${itemId}&status=active`)
      if (loansResponse.ok) {
        const loansData = await loansResponse.json()
        const activeLoans = loansData.loans || loansData.data || []
        const activeLoan = activeLoans.find((loan: any) => !loan.return_date)
        
        if (activeLoan?.id) {
          await returnItemMutation.mutateAsync({
            id: activeLoan.id,
            data: {
              remarks: '一覧画面から返却'
            }
          })
        }
      }
    } catch (error) {
      console.error('Return item error:', error)
    }
  }


  const renderCell = (item: Item, columnKey: React.Key) => {
    switch (columnKey) {
      case 'image':
        return item.image_url ? (
          <div className="flex justify-center">
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-12 h-12 object-cover rounded-lg"
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">画像なし</span>
            </div>
          </div>
        )
      
      case 'purchase_info':
        const purchaseInfo = []
        if (item.purchase_year) purchaseInfo.push(`${item.purchase_year}年`)
        if (item.purchase_amount) purchaseInfo.push(`¥${item.purchase_amount.toLocaleString()}`)
        return purchaseInfo.length > 0 ? (
          <div className="text-sm">
            {purchaseInfo.map((info, index) => (
              <div key={index}>{info}</div>
            ))}
          </div>
        ) : '-'
      
      case 'durability_years':
        return item.durability_years ? `${item.durability_years}年` : '-'
      
      case 'cable_colors':
        return item.cable_color_pattern?.length ? (
          <div className="flex justify-center">
            <CableVisualization 
              colorNames={item.cable_color_pattern} 
              size="sm"
            />
          </div>
        ) : '-'
      
      case 'connections':
        const connections = item.connection_names?.slice(0, 2) || []
        return connections.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {connections.map((conn, index) => (
              <Chip key={index} size="sm" variant="flat" color="primary">
                {conn}
              </Chip>
            ))}
            {(item.connection_names?.length || 0) > 2 && (
              <Chip size="sm" variant="flat">+{(item.connection_names?.length || 0) - 2}</Chip>
            )}
          </div>
        ) : '-'
      
      case 'storage_locations':
        return item.storage_locations?.length ? (
          <div className="flex flex-wrap gap-1">
            {item.storage_locations.slice(0, 2).map((location, index) => (
              <Chip key={index} size="sm" variant="flat" color="success">
                {location}
              </Chip>
            ))}
            {item.storage_locations.length > 2 && (
              <Chip size="sm" variant="flat">+{item.storage_locations.length - 2}</Chip>
            )}
          </div>
        ) : '-'
      
      case 'qr_code_type':
        if (!item.qr_code_type || item.qr_code_type === 'none') {
          return '-'
        }
        return (
          <Chip 
            color={item.qr_code_type === 'qr' ? 'primary' : 'secondary'} 
            size="sm" 
            variant="flat"
          >
            {item.qr_code_type === 'qr' ? 'QR' : 'バーコード'}
          </Chip>
        )
      
      case 'depreciation':
        return (
          <Chip 
            color={item.is_depreciation_target ? 'warning' : 'default'} 
            size="sm" 
            variant="flat"
          >
            {item.is_depreciation_target ? '対象' : '対象外'}
          </Chip>
        )
      
      case 'status':
        const statusChips = []
        
        if (item.is_disposed) {
          statusChips.push(<Chip key="disposed" color="danger" size="sm">廃棄済み</Chip>)
        } else if (item.is_on_loan) {
          statusChips.push(<Chip key="on_loan" color="warning" size="sm">貸出中</Chip>)
        } else {
          statusChips.push(<Chip key="available" color="success" size="sm">利用可能</Chip>)
        }
        
        return (
          <div className="flex flex-col gap-1">
            {statusChips}
          </div>
        )
      
      case 'purchase_year':
        return item.purchase_year || '-'
      
      case 'purchase_amount':
        return item.purchase_amount ? `¥${item.purchase_amount.toLocaleString()}` : '-'
      
      case 'created_at':
        return (
          <div className="text-xs text-gray-600">
            {new Date(item.created_at).toLocaleDateString('ja-JP')}
          </div>
        )
      
      case 'updated_at':
        return (
          <div className="text-xs text-gray-600">
            {new Date(item.updated_at).toLocaleDateString('ja-JP')}
          </div>
        )
      
      case 'dates':
        return (
          <div className="text-xs text-gray-600">
            <div>作成: {new Date(item.created_at).toLocaleDateString('ja-JP')}</div>
            <div>更新: {new Date(item.updated_at).toLocaleDateString('ja-JP')}</div>
          </div>
        )
      
      case 'actions':
        return (
          <div className="flex gap-1">
            <Button
              as={Link}
              to={`/items/${item.id}`}
              isIconOnly
              size="sm"
              variant="light"
              title="詳細"
            >
              <Eye size={16} />
            </Button>
            <Button
              as={Link}
              to={`/items/${item.id}/edit`}
              isIconOnly
              size="sm"
              variant="light"
              color="primary"
              title="編集"
            >
              <Edit size={16} />
            </Button>
            {!item.is_disposed && !item.is_on_loan && (
              <Button
                as={Link}
                to={`/loans/new?item_id=${item.id}`}
                isIconOnly
                size="sm"
                variant="light"
                color="primary"
                title="貸出"
              >
                <Users size={16} />
              </Button>
            )}
            {!item.is_disposed && item.is_on_loan && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="warning"
                title="返却"
                onPress={() => handleReturnItem(item.id)}
                isLoading={returnItemMutation.isPending}
              >
                <Undo size={16} />
              </Button>
            )}
            {item.is_disposed ? (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="success"
                title="廃棄解除"
                onPress={() => undisposeItemMutation.mutate(item.id)}
                isLoading={undisposeItemMutation.isPending}
              >
                <RotateCcw size={16} />
              </Button>
            ) : (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                title="廃棄"
                onPress={() => disposeItemMutation.mutate(item.id)}
                isLoading={disposeItemMutation.isPending}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        )
      
      default:
        return item[columnKey as keyof Item] || '-'
    }
  }

  if (error) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">備品一覧</h1>
          <Button
            as={Link}
            to="/items/new"
            color="primary"
            startContent={<Plus size={20} />}
          >
            新規登録
          </Button>
        </div>
        <Card>
          <CardBody>
            <p className="text-center text-danger">
              エラーが発生しました: {(error as any)?.message || '不明なエラー'}
            </p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">備品一覧</h1>
        <Button
          as={Link}
          to="/items/new"
          color="primary"
          startContent={<Plus size={20} />}
        >
          新規登録
        </Button>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="space-y-4">
            {/* 検索とアクション */}
            <div className="flex gap-4 items-end">
              <Input
                isClearable
                placeholder="備品名、ラベルID、型番で検索..."
                startContent={<Search size={20} />}
                value={searchTerm}
                onClear={() => setSearchTerm('')}
                onValueChange={setSearchTerm}
                className="flex-1"
              />
              
              <div className="flex gap-2">
                <Button
                  variant="flat"
                  size="sm"
                  onPress={resetFilters}
                >
                  フィルタリセット
                </Button>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      startContent={<Settings size={16} />}
                      size="sm"
                    >
                      カラム表示
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="カラム表示設定"
                    closeOnSelect={false}
                    className="max-w-[300px]"
                  >
                    {allColumns.filter(col => col.key !== 'actions').map((column) => (
                      <DropdownItem key={column.key} className="capitalize">
                        <Checkbox
                          isSelected={visibleColumns.has(column.key)}
                          onValueChange={() => toggleColumnVisibility(column.key)}
                        >
                          {column.label}
                        </Checkbox>
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
            
            {/* フィルタ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select
                label="ステータス"
                placeholder="すべて"
                selectedKeys={statusFilter ? [statusFilter] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string
                  setStatusFilter(key as any)
                  setPage(1)
                }}
                size="sm"
              >
                <SelectItem key="all">すべて</SelectItem>
                <SelectItem key="available">利用可能</SelectItem>
                <SelectItem key="on_loan">貸出中</SelectItem>
                <SelectItem key="disposed">廃棄済み</SelectItem>
              </Select>
              
              <Select
                label="QRコード"
                placeholder="すべて"
                selectedKeys={qrCodeFilter ? [qrCodeFilter] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string
                  setQrCodeFilter(key as any)
                  setPage(1)
                }}
                size="sm"
              >
                <SelectItem key="all">すべて</SelectItem>
                <SelectItem key="qr">QRコード</SelectItem>
                <SelectItem key="barcode">バーコード</SelectItem>
                <SelectItem key="none">なし</SelectItem>
              </Select>
              
              <Select
                label="減価償却"
                placeholder="すべて"
                selectedKeys={depreciationFilter ? [depreciationFilter] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string
                  setDepreciationFilter(key as any)
                  setPage(1)
                }}
                size="sm"
              >
                <SelectItem key="all">すべて</SelectItem>
                <SelectItem key="target">対象</SelectItem>
                <SelectItem key="not_target">対象外</SelectItem>
              </Select>
              
              <Input
                label="購入年（開始）"
                placeholder="2020"
                type="number"
                value={purchaseYearFrom}
                onValueChange={(value) => {
                  setPurchaseYearFrom(value)
                  setPage(1)
                }}
                size="sm"
              />
              
              <Input
                label="購入年（終了）"
                placeholder="2024"
                type="number"
                value={purchaseYearTo}
                onValueChange={(value) => {
                  setPurchaseYearTo(value)
                  setPage(1)
                }}
                size="sm"
              />
            </div>
            
            {/* フィルタ結果表示 */}
            <div className="text-sm text-gray-600">
              {totalFilteredItems}件中 {items.length}件を表示
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table
            aria-label="備品一覧"
            removeWrapper
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            bottomContent={
              totalPages > 1 && (
                <div className="flex w-full justify-center">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={totalPages}
                    onChange={setPage}
                  />
                </div>
              )
            }
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn 
                  key={column.key} 
                  align={column.key === 'actions' ? 'center' : 'start'}
                  allowsSorting={column.sortable}
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={items}
              isLoading={isLoading}
              loadingContent={<Spinner label="読み込み中..." />}
              emptyContent="備品が登録されていません"
            >
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell>
                      {renderCell(item, columnKey)}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

    </div>
  )
}
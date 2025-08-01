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
import { Search, Plus, Eye, Edit, Settings, Trash2, RotateCcw, Users, Undo, Download } from 'lucide-react'
import { Item } from '@/types'
import { useItems, useDisposeItem, useUndisposeItem, useReturnItem, useItemSuggestions, useContainers } from '@/hooks'
import { CableVisualization } from '@/components/ui/CableVisualization'

export function ItemsList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  
  // Load column visibility from cookie
  const loadColumnVisibility = () => {
    try {
      const saved = document.cookie
        .split('; ')
        .find(row => row.startsWith('itemsListColumns='))
        ?.split('=')[1]
      
      if (saved) {
        const parsed = JSON.parse(decodeURIComponent(saved))
        return new Set(parsed)
      }
    } catch (error) {
      console.error('Failed to load column visibility:', error)
    }
    
    // Check if mobile device
    const isMobile = window.innerWidth < 768
    
    // Default columns - show fewer columns on mobile
    if (isMobile) {
      return new Set([
        'name', 'status', 'actions'
      ])
    }
    
    return new Set([
      'label_id', 'name', 'model_number', 'purchase_year', 'cable_colors', 'storage_location', 'container', 'status', 'actions'
    ])
  }
  
  const [visibleColumns, setVisibleColumns] = useState(loadColumnVisibility)
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending',
  })
  
  // フィルタ状態
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'on_loan' | 'disposed'>('all')
  const [qrCodeFilter, setQrCodeFilter] = useState<'all' | 'qr' | 'barcode' | 'none'>('all')
  const [depreciationFilter, setDepreciationFilter] = useState<'all' | 'target' | 'not_target'>('all')
  const [storageLocationFilter, setStorageLocationFilter] = useState<string>('')
  const [containerFilter, setContainerFilter] = useState<string>('')
  const [storageTypeFilter, setStorageTypeFilter] = useState<'all' | 'location' | 'container'>('all')
  const [purchaseYearFrom, setPurchaseYearFrom] = useState('')
  const [purchaseYearTo, setPurchaseYearTo] = useState('')
  
  const disposeItemMutation = useDisposeItem()
  const undisposeItemMutation = useUndisposeItem()
  const returnItemMutation = useReturnItem()
  
  // 保管場所の選択肢を取得
  const { data: storageLocationSuggestions } = useItemSuggestions('storage_location')
  
  // コンテナ情報を取得
  const { containers } = useContainers()
  
  const { data, isLoading, error } = useItems({
    page: 1, // クライアント側でページネーションを行うため、全データを取得
    per_page: 1000, // 大きな値で全データを取得
    search: searchTerm || undefined,
    container_id: containerFilter && containerFilter !== 'all' ? containerFilter : undefined,
    storage_type: storageTypeFilter !== 'all' ? storageTypeFilter : undefined,
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
    
    // 保管場所フィルタ
    if (storageLocationFilter && storageLocationFilter !== 'all') {
      if (item.storage_location !== storageLocationFilter) return false
    }
    
    // コンテナフィルタ
    if (containerFilter && containerFilter !== 'all') {
      if (item.container_id !== containerFilter) return false
    }
    
    // 保管タイプフィルタ
    if (storageTypeFilter !== 'all') {
      if (storageTypeFilter === 'location' && item.storage_type !== 'location') return false
      if (storageTypeFilter === 'container' && item.storage_type !== 'container') return false
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
    { key: 'image', label: '画像', sortable: false, width: '80px' },
    { key: 'label_id', label: 'ラベルID', sortable: true },
    { key: 'name', label: '備品名', sortable: true },
    { key: 'model_number', label: '型番', sortable: true },
    { key: 'purchase_info', label: '購入情報', sortable: false },
    { key: 'purchase_year', label: '購入年', sortable: true },
    { key: 'purchase_amount', label: '購入金額', sortable: true },
    { key: 'durability_years', label: '耐用年数', sortable: true },
    { key: 'connections', label: '接続端子', sortable: false },
    { key: 'cable_colors', label: 'ケーブル色', sortable: false },
    { key: 'storage_location', label: '保管場所', sortable: false },
    { key: 'container', label: 'コンテナ', sortable: false },
    { key: 'qr_code_type', label: 'QRコード', sortable: true },
    { key: 'depreciation', label: '減価償却', sortable: true },
    { key: 'status', label: 'ステータス', sortable: false },
    { key: 'created_at', label: '作成日', sortable: true },
    { key: 'updated_at', label: '更新日', sortable: true },
    { key: 'actions', label: '操作', sortable: false, width: 'auto' },
  ]

  const columns = allColumns.filter(col => visibleColumns.has(col.key) || col.key === 'actions')

  // Save column visibility to cookie
  const saveColumnVisibility = (columns: Set<string>) => {
    try {
      const columnsArray = Array.from(columns)
      const value = encodeURIComponent(JSON.stringify(columnsArray))
      const expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1) // 1 year expiry
      document.cookie = `itemsListColumns=${value}; expires=${expires.toUTCString()}; path=/`
    } catch (error) {
      console.error('Failed to save column visibility:', error)
    }
  }

  const toggleColumnVisibility = (columnKey: string) => {
    const newVisibleColumns = new Set(visibleColumns) as Set<string>
    if (newVisibleColumns.has(columnKey)) {
      newVisibleColumns.delete(columnKey)
    } else {
      newVisibleColumns.add(columnKey)
    }
    setVisibleColumns(newVisibleColumns)
    saveColumnVisibility(newVisibleColumns)
  }

  const resetFilters = () => {
    setStatusFilter('all')
    setQrCodeFilter('all')
    setDepreciationFilter('all')
    setStorageLocationFilter('')
    setContainerFilter('')
    setStorageTypeFilter('all')
    setPurchaseYearFrom('')
    setPurchaseYearTo('')
    setPage(1)
  }

  const handleReturnItem = async (itemId: string) => {
    try {
      // Get active loan for this item using the loans service
      const loansResponse = await fetch(`/api/v1/loans?item_id=${itemId}&status=active`)
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

  const handleExportItemsCsv = async () => {
    try {
      // Create CSV content based on dashi's format
      const csvContent = generateItemsCsv(allItems)
      downloadCsv(csvContent, 'item_list.csv')
    } catch (error) {
      console.error('CSV export error:', error)
    }
  }

  const handleExportDepreciationCsv = async () => {
    try {
      // Filter items where is_depreciation_target is true
      const depreciationItems = allItems.filter(item => item.is_depreciation_target)
      const csvContent = generateDepreciationCsv(depreciationItems)
      downloadCsv(csvContent, 'depreciation.csv')
    } catch (error) {
      console.error('CSV export error:', error)
    }
  }

  const generateItemsCsv = (items: Item[]) => {
    const headers = ['型番', '物品名', '個数', '物品詳細', '保管場所', '使用用途', '使用時期', '年間必要数', '備考']
    const rows = items.map(item => [
      item.model_number || '',
      item.name || '',
      '1', // Fixed quantity as per dashi implementation
      item.remarks || '',
      item.storage_location || '仮で埋めている', // Default as per dashi
      '', // Usage - empty as per dashi
      '当日', // Duration - "Same day" as per dashi
      '1', // Required quantity - fixed as per dashi
      item.remarks || '', // Notes/remarks
    ])
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  const generateDepreciationCsv = (items: Item[]) => {
    const headers = ['物品名', '型番', '耐用年数', '購入年度', '購入金額']
    const rows = items.map(item => [
      item.name || '',
      item.model_number || '',
      item.durability_years?.toString() || '',
      item.purchase_year?.toString() || '',
      item.purchase_amount?.toString() || '',
    ])
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' }) // Add BOM for Excel
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      
      case 'label_id':
        return (
          <div className="min-w-[80px] font-mono">
            {item.label_id || '-'}
          </div>
        )
      
      case 'name':
        return (
          <div className="min-w-[150px]">
            {item.name || '-'}
          </div>
        )
      
      case 'model_number':
        return (
          <div className="min-w-[120px]">
            {item.model_number || '-'}
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
      
      case 'storage_location':
        return item.storage_location ? (
          <Chip size="sm" variant="flat" color="success">
            {item.storage_location}
          </Chip>
        ) : '-'
      
      case 'container':
        if (item.storage_type === 'container' && item.container_id) {
          const container = containers.find(c => c.id === item.container_id)
          return container ? (
            <Chip size="sm" variant="flat" color="secondary">
              {container.name} ({container.location})
            </Chip>
          ) : (
            <Chip size="sm" variant="flat">
              {item.container_id}
            </Chip>
          )
        }
        return '-'
      
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
          <div className="flex gap-1 justify-end">
            <Button
              as={Link}
              to={`/items/${item.id}`}
              isIconOnly
              size="sm"
              variant="light"
              title="詳細"
              className="min-w-unit-8 w-8 h-8"
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
              className="min-w-unit-8 w-8 h-8"
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
                className="min-w-unit-8 w-8 h-8"
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
                className="min-w-unit-8 w-8 h-8"
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
                className="min-w-unit-8 w-8 h-8"
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
                className="min-w-unit-8 w-8 h-8"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">備品一覧</h1>
          <Button
            as={Link}
            to="/items/new"
            color="primary"
            startContent={<Plus size={20} />}
            className="text-xs sm:text-sm"
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">備品一覧</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="flat"
            startContent={<Download size={16} />}
            size="sm"
            onPress={() => handleExportItemsCsv()}
            className="text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">物品リスト</span>CSV
          </Button>
          <Button
            variant="flat"
            startContent={<Download size={16} />}
            size="sm"
            onPress={() => handleExportDepreciationCsv()}
            className="text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">減価償却</span>CSV
          </Button>
          <Button
            as={Link}
            to="/items/new"
            color="primary"
            startContent={<Plus size={20} />}
            className="text-xs sm:text-sm"
          >
            新規登録
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="space-y-4">
            {/* 検索とアクション */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-end">
              <Input
                isClearable
                placeholder="備品名、ラベルID、型番で検索..."
                startContent={<Search size={20} />}
                value={searchTerm}
                onClear={() => setSearchTerm('')}
                onValueChange={setSearchTerm}
                className="flex-1"
                size="sm"
              />
              
              <div className="flex gap-2">
                <Button
                  variant="flat"
                  size="sm"
                  onPress={resetFilters}
                  className="text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">フィルタ</span>リセット
                </Button>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      startContent={<Settings size={16} />}
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">カラム</span>表示
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-4">
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
              
              <Select
                label="保管場所"
                placeholder="すべて"
                selectedKeys={storageLocationFilter ? [storageLocationFilter] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string
                  setStorageLocationFilter(key === 'all' ? '' : key)
                  setPage(1)
                }}
                size="sm"
              >
                <SelectItem key="all">すべて</SelectItem>
                {(storageLocationSuggestions || []).map((location: string) => (
                  <SelectItem key={location}>
                    {location}
                  </SelectItem>
                )) as any}
              </Select>
              
              <Select
                label="保管タイプ"
                placeholder="すべて"
                selectedKeys={storageTypeFilter ? [storageTypeFilter] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as 'all' | 'location' | 'container'
                  setStorageTypeFilter(value)
                  setPage(1)
                }}
                size="sm"
              >
                <SelectItem key="all">すべて</SelectItem>
                <SelectItem key="location">場所</SelectItem>
                <SelectItem key="container">コンテナ</SelectItem>
              </Select>
              
              <Select
                label="コンテナ"
                placeholder="すべて"
                selectedKeys={containerFilter ? [containerFilter] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string
                  setContainerFilter(value)
                  setPage(1)
                }}
                size="sm"
                isDisabled={storageTypeFilter === 'location'}
              >
                <SelectItem key="all">すべて</SelectItem>
                {(containers?.map((containerWithCount) => (
                  <SelectItem key={containerWithCount.id}>
                    {containerWithCount.name} ({containerWithCount.id})
                  </SelectItem>
                )) || []) as any}
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

      <Card className="overflow-hidden">
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <Table
              aria-label="備品一覧"
              removeWrapper
              sortDescriptor={sortDescriptor}
              onSortChange={setSortDescriptor}
              className="min-w-full"
              bottomContent={
                totalPages > 1 && (
                  <div className="flex w-full justify-center py-2">
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
              <TableHeader columns={columns} className="sticky top-0 z-10 bg-background">
                {(column) => (
                  <TableColumn 
                    key={column.key} 
                    align={column.key === 'actions' ? 'end' : 'start'}
                    allowsSorting={column.sortable}
                    width={column.width as any}
                    className={column.key === 'actions' ? 'sticky right-0 bg-background' : ''}
                  >
                    <span className="text-xs sm:text-sm">{column.label}</span>
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
                      <TableCell 
                        className={columnKey === 'actions' ? 'sticky right-0 bg-background' : ''}
                      >
                        <div className="text-xs sm:text-sm">
                          {renderCell(item, columnKey)}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

    </div>
  )
}
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
  SortDescriptor,
} from '@heroui/react'
import { Search, Plus, Filter, RotateCcw } from 'lucide-react'
import { Loan } from '@/types'
import { useLoans, useReturnItem } from '@/hooks'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export function LoansList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'returned'>('all')
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'loan_date',
    direction: 'descending',
  })

  const returnItemMutation = useReturnItem()

  const { data, isLoading, error } = useLoans({
    page,
    per_page: 20,
    search: searchTerm || undefined,
    status: filterStatus === 'all' ? undefined : filterStatus,
  })

  // APIフィルタリングが効かない場合に備えて、クライアント側でも追加フィルタリング
  const allLoans = data?.data || []
  const filteredLoans = filterStatus === 'all'
    ? allLoans
    : filterStatus === 'active'
      ? allLoans.filter(loan => !loan.return_date)
      : allLoans.filter(loan => !!loan.return_date)

  // ソート処理
  const sortedLoans = [...filteredLoans].sort((a, b) => {
    const { column, direction } = sortDescriptor
    let aValue: any = a[column as keyof Loan]
    let bValue: any = b[column as keyof Loan]

    // アイテム名でソートする場合
    if (column === 'item_name') {
      aValue = a.item?.name || ''
      bValue = b.item?.name || ''
    }

    // 日付の場合
    if (column === 'loan_date' || column === 'return_date' || column === 'created_at' || column === 'updated_at') {
      if (!aValue && !bValue) return 0
      if (!aValue) return direction === 'ascending' ? -1 : 1
      if (!bValue) return direction === 'ascending' ? 1 : -1
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
      return direction === 'ascending' ? aValue - bValue : bValue - aValue
    }

    // 文字列の場合
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    // 数値の場合
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction === 'ascending' ? aValue - bValue : bValue - aValue
    }

    // 文字列比較
    if (aValue < bValue) return direction === 'ascending' ? -1 : 1
    if (aValue > bValue) return direction === 'ascending' ? 1 : -1
    return 0
  })

  const loans = sortedLoans
  const totalPages = Math.ceil(loans.length / 20) || 1

  const handleReturnItem = async (loanId: number) => {
    try {
      await returnItemMutation.mutateAsync({
        id: loanId,
        data: {
          remarks: '貸出管理画面から返却'
        }
      })
    } catch (error) {
      console.error('Return item error:', error)
    }
  }

  const columns = [
    { key: 'loan_date', label: '貸出日', sortable: true },
    { key: 'item_name', label: '備品名', sortable: true },
    { key: 'student_name', label: '借用者', sortable: true },
    { key: 'organization', label: '所属', sortable: true },
    { key: 'return_date', label: '返却日', sortable: true },
    { key: 'status', label: 'ステータス', sortable: false },
    { key: 'actions', label: '操作', sortable: false },
  ]

  const renderCell = (loan: Loan, columnKey: React.Key) => {
    switch (columnKey) {
      case 'loan_date':
        return format(new Date(loan.loan_date), 'yyyy/MM/dd', { locale: ja })
      case 'item_name':
        return loan.item?.name || `備品ID: ${loan.item_id}`
      case 'student':
      case 'student_name':
        return (
          <div>
            <p className="font-medium">{loan.student_name}</p>
            <p className="text-sm text-gray-600">{loan.student_number}</p>
          </div>
        )
      case 'organization':
        return loan.organization || '-'
      case 'return_date':
        return loan.return_date ? format(new Date(loan.return_date), 'yyyy/MM/dd', { locale: ja }) : '-'
      case 'status':
        return loan.return_date ? (
          <Chip color="success" size="sm">返却済み</Chip>
        ) : (
          <Chip color="warning" size="sm">貸出中</Chip>
        )
      case 'actions':
        return (
          <div className="flex gap-2">
            {!loan.return_date && (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<RotateCcw size={16} />}
                onPress={() => handleReturnItem(loan.id)}
                isLoading={returnItemMutation.isPending}
                className="text-xs sm:text-sm"
              >
                返却
              </Button>
            )}
          </div>
        )
      default:
        return '-'
    }
  }

  if (error) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">貸出管理</h1>
          <Button
            as={Link}
            to="/items"
            color="primary"
            startContent={<Plus size={20} />}
          >
            備品から貸出
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
        <h1 className="text-2xl sm:text-3xl font-bold">貸出管理</h1>
        <Button
          as={Link}
          to="/items"
          color="primary"
          startContent={<Plus size={20} />}
          size="sm"
          className="text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">備品から</span>貸出
        </Button>
      </div>

      {/* 貸出方法の説明 */}
      <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardBody className="py-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>新規貸出の方法:</strong> 備品一覧画面で貸し出したい備品の「貸出」ボタンをクリックしてください。
          </p>
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Input
              isClearable
              placeholder="備品名、借用者名、学籍番号で検索..."
              startContent={<Search size={20} />}
              value={searchTerm}
              onClear={() => setSearchTerm('')}
              onValueChange={setSearchTerm}
              className="flex-1"
              size="sm"
            />
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="flat"
                  startContent={<Filter size={16} />}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">
                    {filterStatus === 'all' ? 'すべて' : filterStatus === 'active' ? '貸出中' : '返却済み'}
                  </span>
                  <span className="sm:hidden">フィルタ</span>
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="フィルター"
                selectedKeys={new Set([filterStatus])}
                selectionMode="single"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as 'all' | 'active' | 'returned'
                  setFilterStatus(selectedKey)
                  setPage(1) // フィルタ変更時にページをリセット
                }}
              >
                <DropdownItem key="all">すべて</DropdownItem>
                <DropdownItem key="active">貸出中</DropdownItem>
                <DropdownItem key="returned">返却済み</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <Table
            aria-label="貸出管理"
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
                  className="text-xs sm:text-sm"
                >
                  {column.label}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={loans}
              isLoading={isLoading}
              loadingContent={<Spinner label="読み込み中..." />}
              emptyContent="貸出記録がありません"
            >
              {(loan) => (
                <TableRow key={loan.id}>
                  {(columnKey) => (
                    <TableCell className="text-xs sm:text-sm">{renderCell(loan, columnKey)}</TableCell>
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
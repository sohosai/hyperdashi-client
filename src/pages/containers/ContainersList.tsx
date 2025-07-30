import { useState } from 'react'
import { 
  Card, 
  CardBody, 
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Spinner,
  Checkbox,
  SortDescriptor
} from '@heroui/react'
import { Plus, Search, Package, Edit, Trash2, RotateCcw } from 'lucide-react'
import { useContainers } from '../../hooks'
import { CreateContainerRequest, UpdateContainerRequest, ContainerWithItemCount } from '../../services'

export function ContainersList() {
  const [locationFilter, setLocationFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [includeDisposed, setIncludeDisposed] = useState(true)
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending',
  })
  
  const { containers, loading, error, createContainer, updateContainer, deleteContainer } = useContainers({
    location: locationFilter || undefined,
    include_disposed: includeDisposed
  })

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const [editingContainer, setEditingContainer] = useState<ContainerWithItemCount | null>(null)
  
  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // フィルタリングされたコンテナ
  const filteredContainers = containers.filter((container) => {
    const matchesSearch = !searchQuery || 
      container.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      container.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (container.description && container.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesSearch
  })

  // ソート処理
  const sortedContainers = [...filteredContainers].sort((a, b) => {
    const { column, direction } = sortDescriptor
    let aValue: any = a[column as keyof ContainerWithItemCount]
    let bValue: any = b[column as keyof ContainerWithItemCount]
    
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

  // ユニークな場所のリストを取得
  const uniqueLocations = Array.from(new Set(containers.map(c => c.location)))
  

  const handleCreateSubmit = async () => {
    if (!formData.name.trim() || !formData.location.trim()) return

    try {
      setIsSubmitting(true)
      const createData: CreateContainerRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim()
      }
      
      await createContainer(createData)
      
      // フォームをリセット
      setFormData({ name: '', description: '', location: '' })
      onCreateClose()
    } catch (err) {
      console.error('Container creation failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (containerWithCount: ContainerWithItemCount) => {
    setEditingContainer(containerWithCount)
    setFormData({
      name: containerWithCount.name,
      description: containerWithCount.description || '',
      location: containerWithCount.location
    })
    onEditOpen()
  }

  const handleEditSubmit = async () => {
    if (!editingContainer || !formData.name.trim() || !formData.location.trim()) return

    try {
      setIsSubmitting(true)
      const updateData: UpdateContainerRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim()
      }
      
      await updateContainer(editingContainer.id, updateData)
      onEditClose()
    } catch (err) {
      console.error('Container update failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = async (container: ContainerWithItemCount) => {
    if (container.item_count > 0) {
      alert('このコンテナには物品が入っているため削除できません。')
      return
    }
    
    if (!confirm(`コンテナ「${container.name}」を削除しますか？`)) return

    try {
      await deleteContainer(container.id)
    } catch (err) {
      console.error('Container deletion failed:', err)
    }
  }

  const handleDisposeToggle = async (container: ContainerWithItemCount) => {
    const action = container.is_disposed ? '廃棄解除' : '廃棄'
    if (!confirm(`コンテナ「${container.name}」を${action}しますか？`)) return

    try {
      await updateContainer(container.id, {
        is_disposed: !container.is_disposed
      })
    } catch (err) {
      console.error('Container dispose toggle failed:', err)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', location: '' })
    setEditingContainer(null)
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">コンテナ管理</h1>
        <Button 
          color="primary" 
          startContent={<Plus size={16} />}
          onPress={() => {
            resetForm()
            onCreateOpen()
          }}
          size="sm"
          className="text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">新しい</span>コンテナ
        </Button>
      </div>

      {/* フィルタ */}
      <Card className="mb-6">
        <CardBody>
          <div className="space-y-4">
            {/* 検索とアクション */}
            <div className="flex gap-4 items-end">
              <Input
                isClearable
                placeholder="名前・場所・説明で検索..."
                startContent={<Search size={20} />}
                value={searchQuery}
                onClear={() => setSearchQuery('')}
                onValueChange={setSearchQuery}
                className="flex-1"
              />
            </div>
            
            {/* フィルタ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
              <Select
                label="場所"
                placeholder="すべて"
                selectedKeys={locationFilter ? [locationFilter] : []}
                onSelectionChange={(keys) => setLocationFilter(Array.from(keys)[0] as string || '')}
                size="sm"
              >
                <SelectItem key="">すべての場所</SelectItem>
                {uniqueLocations.map(location => (
                  <SelectItem key={location}>{location}</SelectItem>
                )) as any}
              </Select>
              
              <div className="flex items-center">
                <Checkbox
                  isSelected={includeDisposed}
                  onValueChange={setIncludeDisposed}
                  size="sm"
                >
                  廃棄済みを含む
                </Checkbox>
              </div>
            </div>
            
            {/* 結果表示 */}
            <div className="text-sm text-gray-600">
              {sortedContainers.length}件のコンテナ
            </div>
          </div>
        </CardBody>
      </Card>

      {/* コンテナ一覧 */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
              {error}
            </div>
          )}
          
          <Table
            aria-label="コンテナ一覧"
            removeWrapper
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            classNames={{
              th: "sticky top-0 z-10 bg-background text-xs sm:text-sm",
              td: "text-xs sm:text-sm",
            }}
          >
            <TableHeader>
              <TableColumn key="id" allowsSorting>ID</TableColumn>
              <TableColumn key="name" allowsSorting>名前</TableColumn>
              <TableColumn key="location" allowsSorting>場所</TableColumn>
              <TableColumn key="description">説明</TableColumn>
              <TableColumn key="item_count" allowsSorting>物品数</TableColumn>
              <TableColumn key="is_disposed" allowsSorting>状態</TableColumn>
              <TableColumn key="created_at" allowsSorting>作成日</TableColumn>
              <TableColumn key="actions" align="center">操作</TableColumn>
            </TableHeader>
            <TableBody
              items={sortedContainers}
              isLoading={loading}
              loadingContent={<Spinner label="読み込み中..." />}
              emptyContent="コンテナが登録されていません"
            >
              {(container) => (
                <TableRow key={container.id}>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{container.id}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-500" />
                      {container.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color="success">
                      {container.location}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={container.description}>
                      {container.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant={container.item_count > 0 ? "flat" : "bordered"}>
                      {container.item_count}個
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="sm" 
                      color={container.is_disposed ? "danger" : "success"}
                      variant="flat"
                    >
                      {container.is_disposed ? "廃棄済み" : "使用中"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-gray-600">
                      {new Date(container.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-center">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEditClick(container)}
                        title="編集"
                      >
                        <Edit size={16} />
                      </Button>
                      {container.is_disposed ? (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="success"
                          title="廃棄解除"
                          onPress={() => handleDisposeToggle(container)}
                        >
                          <RotateCcw size={16} />
                        </Button>
                      ) : (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="warning"
                          title="廃棄"
                          onPress={() => handleDisposeToggle(container)}
                          isDisabled={container.item_count > 0}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                      {!container.is_disposed && container.item_count === 0 && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          title="削除"
                          onPress={() => handleDeleteClick(container)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* 作成モーダル */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="2xl">
        <ModalContent>
          <ModalHeader>新しいコンテナを作成</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="コンテナ名"
                placeholder="例: 機材ケース001"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                isRequired
              />
              <Input
                label="設置場所"
                placeholder="例: 物品保管室A"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                isRequired
              />
              <Textarea
                label="説明"
                placeholder="コンテナの詳細説明（任意）"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCreateClose}>
              キャンセル
            </Button>
            <Button 
              color="primary" 
              onPress={handleCreateSubmit}
              isLoading={isSubmitting}
              isDisabled={!formData.name.trim() || !formData.location.trim()}
            >
              作成
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
        <ModalContent>
          <ModalHeader>コンテナを編集</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="コンテナ名"
                placeholder="例: 機材ケース001"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                isRequired
              />
              <Input
                label="設置場所"
                placeholder="例: 物品保管室A"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                isRequired
              />
              <Textarea
                label="説明"
                placeholder="コンテナの詳細説明（任意）"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditClose}>
              キャンセル
            </Button>
            <Button 
              color="primary" 
              onPress={handleEditSubmit}
              isLoading={isSubmitting}
              isDisabled={!formData.name.trim() || !formData.location.trim()}
            >
              更新
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
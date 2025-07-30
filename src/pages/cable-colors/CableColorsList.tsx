import { useState } from 'react'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Card,
  CardBody,
  Spinner,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Chip,
} from '@heroui/react'
import { Plus, Edit, Trash2, Palette } from 'lucide-react'
import { useCableColors, useCreateCableColor, useUpdateCableColor, useDeleteCableColor } from '@/hooks/useCableColors'
import { CableColor } from '@/types'
import { useForm } from 'react-hook-form'

type CableColorFormData = {
  name: string
  hex_code: string
}

export function CableColorsList() {
  const [page, setPage] = useState(1)
  const [editingColor, setEditingColor] = useState<CableColor | null>(null)
  const [deletingColor, setDeletingColor] = useState<CableColor | null>(null)
  
  const { isOpen: isFormOpen, onOpen: onFormOpen, onOpenChange: onFormOpenChange } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure()
  
  const { data, isLoading, error } = useCableColors({ page, per_page: 20 })
  const createMutation = useCreateCableColor()
  const updateMutation = useUpdateCableColor()
  const deleteMutation = useDeleteCableColor()

  const colors = data?.data || []
  const totalPages = data?.total_pages || 1

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm<CableColorFormData>({
    defaultValues: {
      name: '',
      hex_code: '#000000'
    }
  })

  const watchedHexCode = watch('hex_code')

  const openCreateForm = () => {
    setEditingColor(null)
    reset({ name: '', hex_code: '#000000' })
    onFormOpen()
  }

  const openEditForm = (color: CableColor) => {
    setEditingColor(color)
    setValue('name', color.name)
    setValue('hex_code', color.hex_code)
    onFormOpen()
  }

  const openDeleteConfirm = (color: CableColor) => {
    setDeletingColor(color)
    onDeleteOpen()
  }

  const onSubmit = async (data: CableColorFormData) => {
    try {
      if (editingColor) {
        await updateMutation.mutateAsync({ id: editingColor.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
      onFormOpenChange()
      reset()
    } catch (error) {
      console.error('Error saving cable color:', error)
    }
  }

  const handleDelete = async () => {
    if (deletingColor) {
      try {
        await deleteMutation.mutateAsync(deletingColor.id)
        onDeleteOpenChange()
        setDeletingColor(null)
      } catch (error) {
        console.error('Error deleting cable color:', error)
      }
    }
  }

  if (error) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">ケーブル色管理</h1>
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
        <h1 className="text-2xl sm:text-3xl font-bold">ケーブル色管理</h1>
        <Button
          color="primary"
          startContent={<Plus size={20} />}
          onPress={openCreateForm}
          size="sm"
          className="text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">新規</span>色登録
        </Button>
      </div>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <Table
            aria-label="ケーブル色一覧"
            removeWrapper
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
            <TableHeader>
              <TableColumn className="text-xs sm:text-sm">色見本</TableColumn>
              <TableColumn className="text-xs sm:text-sm">色名</TableColumn>
              <TableColumn className="text-xs sm:text-sm">カラーコード</TableColumn>
              <TableColumn className="text-xs sm:text-sm">作成日</TableColumn>
              <TableColumn align="center" className="text-xs sm:text-sm">操作</TableColumn>
            </TableHeader>
            <TableBody
              items={colors}
              isLoading={isLoading}
              loadingContent={<Spinner label="読み込み中..." />}
              emptyContent="登録されたケーブル色がありません"
            >
              {(color) => (
                <TableRow key={color.id}>
                  <TableCell className="text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded border-2 border-gray-300"
                        style={{ backgroundColor: color.hex_code }}
                      />
                      <Palette size={16} className="text-gray-400" />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    <span className="font-medium">{color.name}</span>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    <Chip variant="flat" color="default" size="sm">
                      {color.hex_code}
                    </Chip>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    <span className="text-sm text-gray-600">
                      {new Date(color.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    <div className="flex gap-1 justify-center">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        title="編集"
                        onPress={() => openEditForm(color)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        title="削除"
                        onPress={() => openDeleteConfirm(color)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={isFormOpen} onOpenChange={onFormOpenChange}>
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader className="flex flex-col gap-1">
                {editingColor ? 'ケーブル色編集' : '新規ケーブル色登録'}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    {...register('name', { 
                      required: '色名は必須です',
                      maxLength: { value: 50, message: '色名は50文字以内で入力してください' }
                    })}
                    label="色名"
                    placeholder="例: 赤、青、緑"
                    errorMessage={errors.name?.message}
                    isInvalid={!!errors.name}
                    isRequired
                  />
                  
                  <div className="space-y-2">
                    <Input
                      {...register('hex_code', { 
                        required: 'カラーコードは必須です',
                        pattern: {
                          value: /^#[0-9A-Fa-f]{6}$/,
                          message: 'カラーコードは#から始まる6桁の16進数で入力してください'
                        }
                      })}
                      label="カラーコード"
                      placeholder="#000000"
                      errorMessage={errors.hex_code?.message}
                      isInvalid={!!errors.hex_code}
                      isRequired
                    />
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">プレビュー:</span>
                      <div 
                        className="w-12 h-12 rounded border-2 border-gray-300"
                        style={{ backgroundColor: watchedHexCode }}
                      />
                      <span className="text-sm font-mono">{watchedHexCode}</span>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  キャンセル
                </Button>
                <Button 
                  color="primary" 
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingColor ? '更新' : '登録'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                ケーブル色削除確認
              </ModalHeader>
              <ModalBody>
                <p>
                  「<strong>{deletingColor?.name}</strong>」を削除しますか？
                </p>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div 
                    className="w-8 h-8 rounded border-2 border-gray-300"
                    style={{ backgroundColor: deletingColor?.hex_code }}
                  />
                  <span className="text-sm">{deletingColor?.hex_code}</span>
                </div>
                <p className="text-sm text-gray-600">
                  この操作は取り消すことができません。
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  キャンセル
                </Button>
                <Button 
                  color="danger" 
                  onPress={handleDelete}
                  isLoading={deleteMutation.isPending}
                >
                  削除する
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
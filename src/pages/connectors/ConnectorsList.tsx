import { useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  useDisclosure,
} from '@heroui/react'
import { useForm } from 'react-hook-form'
import { Pencil, Plug, Plus, Trash2 } from 'lucide-react'
import {
  useConnectors,
  useCreateConnector,
  useDeleteConnector,
  useUpdateConnector,
} from '@/hooks/useConnectors'
import { Connector } from '@/types'

type ConnectorFormData = {
  name: string
  description: string
}

export function ConnectorsList() {
  const [page, setPage] = useState(1)
  const [deletingConnector, setDeletingConnector] = useState<Connector | null>(null)
  const [editingConnector, setEditingConnector] = useState<Connector | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure()
  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose,
    onOpenChange: onFormOpenChange,
  } = useDisclosure()

  const { data, isLoading, error } = useConnectors({ page, per_page: 20 })
  const createMutation = useCreateConnector()
  const updateMutation = useUpdateConnector()
  const deleteMutation = useDeleteConnector()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConnectorFormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const connectors = data?.data ?? []
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 20))

  const openDeleteConfirm = (connector: Connector) => {
    setDeletingConnector(connector)
    onDeleteOpen()
  }

  const openCreateForm = () => {
    setEditingConnector(null)
    reset({ name: '', description: '' })
    setFormError(null)
    onFormOpen()
  }

  const openEditForm = (connector: Connector) => {
    setEditingConnector(connector)
    reset({
      name: connector.name,
      description: connector.description ?? '',
    })
    setFormError(null)
    onFormOpen()
  }

  const handleSave = async (formData: ConnectorFormData) => {
    try {
      setFormError(null)
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      }

      if (editingConnector) {
        await updateMutation.mutateAsync({ id: editingConnector.id, data: payload })
      } else {
        await createMutation.mutateAsync({
          ...payload,
          description: payload.description || undefined,
        })
        setPage(1)
      }

      onFormClose()
      setEditingConnector(null)
      reset()
    } catch (saveError) {
      const fallbackMessage = editingConnector
        ? '接続端子の更新に失敗しました'
        : '接続端子の登録に失敗しました'
      setFormError((saveError as { message?: string })?.message ?? fallbackMessage)
    }
  }

  const handleDelete = async () => {
    if (!deletingConnector) return

    try {
      await deleteMutation.mutateAsync(deletingConnector.id)
      if (connectors.length === 1 && page > 1) {
        setPage(page - 1)
      }
      setDeletingConnector(null)
      onDeleteOpenChange()
    } catch (deleteError) {
      console.error('Error deleting connector:', deleteError)
    }
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">接続端子管理</h1>
        <Card>
          <CardBody>
            <p className="text-center text-danger">
              エラーが発生しました: {(error as { message?: string })?.message ?? '不明なエラー'}
            </p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Plug className="text-primary" size={28} />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">接続端子管理</h1>
            <p className="mt-1 text-sm text-default-500">
              備品登録時に候補として表示する接続端子を管理します。端子名と説明を登録できます。
            </p>
          </div>
        </div>
        <Button color="primary" startContent={<Plus size={18} />} onPress={openCreateForm}>
          接続端子を登録
        </Button>
      </div>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <Table
            aria-label="接続端子一覧"
            bottomContent={
              totalPages > 1 ? (
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
              ) : null
            }
          >
            <TableHeader>
              <TableColumn>端子名</TableColumn>
              <TableColumn>説明</TableColumn>
              <TableColumn>作成日</TableColumn>
              <TableColumn align="center">操作</TableColumn>
            </TableHeader>
            <TableBody
              items={connectors}
              isLoading={isLoading}
              loadingContent={<Spinner label="読み込み中..." />}
              emptyContent="登録された接続端子がありません"
            >
              {(connector) => (
                <TableRow
                  key={connector.id}
                  className="transition-colors duration-150 hover:bg-default-100/70"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Plug className="text-default-400" size={16} />
                      <span className="font-medium">{connector.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-default-500">
                      {connector.description || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-default-500">
                      {new Date(connector.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        title={`${connector.name}を編集`}
                        aria-label={`${connector.name}を編集`}
                        onPress={() => openEditForm(connector)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        title={`${connector.name}を削除`}
                        aria-label={`${connector.name}を削除`}
                        onPress={() => openDeleteConfirm(connector)}
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

      <Modal isOpen={isFormOpen} onOpenChange={onFormOpenChange}>
        <ModalContent>
          {(onClose) => (
            <form onSubmit={handleSubmit(handleSave)}>
              <ModalHeader>{editingConnector ? '接続端子を編集' : '接続端子を登録'}</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    {...register('name', {
                      required: '端子名は必須です',
                      maxLength: { value: 100, message: '端子名は100文字以内で入力してください' },
                    })}
                    label="端子名"
                    placeholder="例: HDMI"
                    errorMessage={errors.name?.message}
                    isInvalid={!!errors.name}
                    isRequired
                  />
                  <Textarea
                    {...register('description', {
                      maxLength: { value: 500, message: '説明は500文字以内で入力してください' },
                    })}
                    label="説明"
                    placeholder="必要に応じて入力してください"
                    errorMessage={errors.description?.message}
                    isInvalid={!!errors.description}
                  />
                  {formError && <p className="text-sm text-danger">{formError}</p>}
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
                  {editingConnector ? '保存' : '登録'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>接続端子の削除確認</ModalHeader>
              <ModalBody>
                <p>
                  「<strong>{deletingConnector?.name}</strong>」を接続端子マスターから削除しますか？
                </p>
                <p className="text-sm text-default-500">
                  備品登録時の候補から削除されます。既存の備品に保存済みの端子名は変更されません。
                </p>
                <p className="text-sm text-danger">この操作は取り消すことができません。</p>
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

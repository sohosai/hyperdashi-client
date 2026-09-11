import { useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  Chip,
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
  useDisclosure,
} from '@heroui/react'
import { Plug, Trash2 } from 'lucide-react'
import { useConnectors, useDeleteConnector } from '@/hooks/useConnectors'
import { Connector } from '@/types'

const genderLabels: Record<NonNullable<Connector['gender']>, string> = {
  male: 'オス',
  female: 'メス',
  none: '区別なし',
}

export function ConnectorsList() {
  const [page, setPage] = useState(1)
  const [deletingConnector, setDeletingConnector] = useState<Connector | null>(null)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const { data, isLoading, error } = useConnectors({ page, per_page: 20 })
  const deleteMutation = useDeleteConnector()

  const connectors = data?.data ?? []
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 20))

  const openDeleteConfirm = (connector: Connector) => {
    setDeletingConnector(connector)
    onOpen()
  }

  const handleDelete = async () => {
    if (!deletingConnector) return

    try {
      await deleteMutation.mutateAsync(deletingConnector.id)
      if (connectors.length === 1 && page > 1) {
        setPage(page - 1)
      }
      setDeletingConnector(null)
      onOpenChange()
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
      <div className="mb-6 flex items-center gap-3">
        <Plug className="text-primary" size={28} />
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">接続端子管理</h1>
          <p className="mt-1 text-sm text-default-500">
            備品登録時に候補として表示する接続端子を管理します。
          </p>
        </div>
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
              <TableColumn>種別</TableColumn>
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
                <TableRow key={connector.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Plug className="text-default-400" size={16} />
                      <span className="font-medium">{connector.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {connector.gender ? (
                      <Chip size="sm" variant="flat">
                        {genderLabels[connector.gender]}
                      </Chip>
                    ) : (
                      <span className="text-default-400">未設定</span>
                    )}
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
                    <div className="flex justify-center">
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

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
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

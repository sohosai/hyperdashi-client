import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, CardHeader, Chip, Image, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { useItem, useDeleteItem } from '@/hooks'
import { CableVisualization } from '@/components/ui/CableVisualization'

export function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const itemId = id ? Number(id) : 0
  
  const { data: item, isLoading, error } = useItem(itemId)
  const deleteItemMutation = useDeleteItem()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spinner label="データを読み込み中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Button
          as={Link}
          to="/items"
          variant="light"
          startContent={<ArrowLeft size={20} />}
          className="mb-4"
        >
          一覧に戻る
        </Button>
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

  if (!item) {
    return (
      <div>
        <Button
          as={Link}
          to="/items"
          variant="light"
          startContent={<ArrowLeft size={20} />}
          className="mb-4"
        >
          一覧に戻る
        </Button>
        <Card>
          <CardBody>
            <p className="text-center text-gray-500">備品が見つかりません</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Button
          as={Link}
          to="/items"
          variant="light"
          startContent={<ArrowLeft size={20} />}
        >
          一覧に戻る
        </Button>
        <div className="flex gap-2">
          <Button
            as={Link}
            to={`/items/${id}/edit`}
            color="primary"
            variant="flat"
            startContent={<Edit size={16} />}
          >
            編集
          </Button>
          <Button
            color="danger"
            variant="flat"
            startContent={<Trash2 size={16} />}
            onPress={onOpen}
          >
            削除
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold">{item.name}</h1>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-600">ラベルID</dt>
                  <dd className="font-medium">{item.label_id}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">型番</dt>
                  <dd className="font-medium">{item.model_number || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">購入年</dt>
                  <dd className="font-medium">{item.purchase_year || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">購入金額</dt>
                  <dd className="font-medium">
                    {item.purchase_amount ? `¥${item.purchase_amount.toLocaleString()}` : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">耐用年数</dt>
                  <dd className="font-medium">{item.durability_years ? `${item.durability_years}年` : '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">減価償却対象</dt>
                  <dd className="font-medium">{item.is_depreciation_target ? 'はい' : 'いいえ'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">QRコードタイプ</dt>
                  <dd className="font-medium">
                    {item.qr_code_type === 'qr' ? 'QRコード' : 
                     item.qr_code_type === 'barcode' ? 'バーコード' : 'なし'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">ステータス</dt>
                  <dd>
                    {item.is_disposed ? (
                      <Chip color="danger" size="sm">廃棄済み</Chip>
                    ) : item.is_on_loan ? (
                      <Chip color="warning" size="sm">貸出中</Chip>
                    ) : (
                      <Chip color="success" size="sm">利用可能</Chip>
                    )}
                  </dd>
                </div>
                {item.storage_locations?.length ? (
                  <div className="md:col-span-2">
                    <dt className="text-sm text-gray-600">保管場所</dt>
                    <dd className="flex flex-wrap gap-2 mt-1">
                      {item.storage_locations.map((location, index) => (
                        <Chip key={index} variant="flat" color="success" size="sm">
                          {location}
                        </Chip>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {item.remarks && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">備考</h3>
                  <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{item.remarks}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {(item.connection_names?.length || item.cable_color_pattern?.length || item.storage_locations?.length) ? (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">接続・配線情報</h2>
              </CardHeader>
              <CardBody>
                <dl className="space-y-4">
                  {item.connection_names?.length ? (
                    <div>
                      <dt className="text-sm text-gray-600 mb-2">接続名称</dt>
                      <dd className="flex flex-wrap gap-2">
                        {item.connection_names.map((name, index) => (
                          <Chip key={index} variant="flat" color="primary" size="sm">
                            {name}
                          </Chip>
                        ))}
                      </dd>
                    </div>
                  ) : null}
                  
                  {item.cable_color_pattern?.length ? (
                    <div>
                      <dt className="text-sm text-gray-600 mb-2">ケーブル色パターン</dt>
                      <dd className="space-y-2">
                        <CableVisualization 
                          colorNames={item.cable_color_pattern} 
                          size="lg"
                          showLabels={false}
                        />
                        <div className="text-xs text-gray-500">
                          端子側から順に: {item.cable_color_pattern?.map((name, index) => (
                            <span key={index}>
                              {index + 1}.{name}
                              {index < (item.cable_color_pattern?.length || 0) - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </dd>
                    </div>
                  ) : null}
                  
                </dl>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          {item.image_url && (
            <Card>
              <CardBody>
                <Image
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-auto rounded-lg"
                />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">詳細情報</h2>
            </CardHeader>
            <CardBody>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-gray-600">QRコードタイプ</dt>
                  <dd className="font-medium">{item.qr_code_type || 'なし'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">登録日時</dt>
                  <dd className="font-medium">
                    {new Date(item.created_at).toLocaleString('ja-JP')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">更新日時</dt>
                  <dd className="font-medium">
                    {new Date(item.updated_at).toLocaleString('ja-JP')}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                備品の削除確認
              </ModalHeader>
              <ModalBody>
                <p>
                  「<strong>{item?.name}</strong>」を削除しますか？
                </p>
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
                  onPress={async () => {
                    try {
                      await deleteItemMutation.mutateAsync(itemId)
                      onClose()
                      navigate('/items')
                    } catch (error) {
                      console.error('Delete error:', error)
                      // TODO: Show error message to user
                    }
                  }}
                  isLoading={deleteItemMutation.isPending}
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
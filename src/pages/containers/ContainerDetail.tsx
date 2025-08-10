import { useParams, Link } from 'react-router-dom'
import { useContainer, useItems } from '@/hooks'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react'
import { ArrowLeft, Edit } from 'lucide-react'

export function ContainerDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: container, isLoading, error } = useContainer(id || '')
  const { data: itemsData } = useItems({ container_id: id })
  const items = itemsData?.data || []

  if (isLoading) {
    return <Spinner label="読み込み中..." />
  }

  if (error) {
    return <div>コンテナの読み込みに失敗しました: {error.message}</div>
  }

  if (!container) {
    return <div>コンテナが見つかりません</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <Button as={Link} to="/containers" variant="light" startContent={<ArrowLeft size={20} />}>
          コンテナ一覧に戻る
        </Button>
        <Button as={Link} to={`/containers/${id}/edit`} color="primary" startContent={<Edit size={16} />}>
          編集
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">{container.name}</h1>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Container details */}
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-gray-600 text-sm mb-1">ラベルID</h2>
                <p className="text-lg font-mono">{container.id}</p>
              </div>
              <div>
                <h2 className="font-semibold text-gray-600 text-sm mb-1">場所</h2>
                <p className="text-lg">{container.location}</p>
              </div>
              <div>
                <h2 className="font-semibold text-gray-600 text-sm mb-1">状態</h2>
                <Chip color={container.is_disposed ? 'danger' : 'success'} size="md">
                  {container.is_disposed ? '廃棄済み' : '使用中'}
                </Chip>
              </div>
              <div>
                <h2 className="font-semibold text-gray-600 text-sm mb-1">備考</h2>
                <p className="text-lg">{(container as any).remarks || '-'}</p>
              </div>
              <div>
                <h2 className="font-semibold text-gray-600 text-sm mb-1">作成日</h2>
                <p className="text-lg">
                  {container.created_at ? (() => {
                    const date = new Date(container.created_at)
                    const yyyy = date.getFullYear()
                    const mm = String(date.getMonth() + 1).padStart(2, '0')
                    const dd = String(date.getDate()).padStart(2, '0')
                    return `${yyyy}/${mm}/${dd}`
                  })() : '-'}
                </p>
              </div>
            </div>

            {/* Container image */}
            <div className="flex flex-col">
              <h2 className="font-semibold text-gray-600 text-sm mb-3">コンテナ画像</h2>
              {container.image_url ? (
                <div className="flex-1 flex items-start">
                  <img
                    src={container.image_url}
                    alt={`コンテナ: ${container.name}`}
                    className="max-w-full max-h-80 object-contain rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => window.open(container.image_url, '_blank')}
                    title="クリックで拡大表示"
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300 min-h-[200px]">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📦</div>
                    <p>画像が設定されていません</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h2 className="text-xl font-bold">コンテナ内の備品</h2>
        </CardHeader>
        <CardBody>
          <Table aria-label="コンテナ内の備品一覧">
            <TableHeader>
              <TableColumn>備品名</TableColumn>
              <TableColumn>ラベルID</TableColumn>
              <TableColumn>状態</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody items={items}>
              {(item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.label_id}</TableCell>
                  <TableCell>
                    <Chip 
                      color={item.is_disposed ? 'danger' : item.is_on_loan ? 'warning' : 'success'} 
                      size="sm"
                    >
                      {item.is_disposed ? '廃棄済み' : item.is_on_loan ? '貸出中' : '利用可能'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Button as={Link} to={`/items/${item.id}`} size="sm" variant="light">
                      詳細
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  )
}

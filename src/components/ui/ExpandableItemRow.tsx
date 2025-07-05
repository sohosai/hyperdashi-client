import { Card, CardBody, Chip } from '@heroui/react'
import { Item } from '@/types'
import { CableVisualization } from '@/components/ui/CableVisualization'

interface ExpandableItemRowProps {
  item: Item
}

export function ExpandableItemRow({ item }: ExpandableItemRowProps) {
  return (
    <div className="p-4 bg-gray-50 border-t">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 詳細情報セクション */}
        <Card className="shadow-sm">
          <CardBody className="p-3">
            <h4 className="font-semibold text-sm mb-3">詳細情報</h4>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-600">購入年</dt>
                <dd className="font-medium">{item.purchase_year || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-600">購入金額</dt>
                <dd className="font-medium">
                  {item.purchase_amount ? `¥${item.purchase_amount.toLocaleString()}` : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">耐用年数</dt>
                <dd className="font-medium">{item.durability_years ? `${item.durability_years}年` : '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-600">減価償却対象</dt>
                <dd>
                  <Chip 
                    color={item.is_depreciation_target ? 'warning' : 'default'} 
                    size="sm" 
                    variant="flat"
                  >
                    {item.is_depreciation_target ? '対象' : '対象外'}
                  </Chip>
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        {/* 接続・配線情報セクション */}
        <Card className="shadow-sm">
          <CardBody className="p-3">
            <h4 className="font-semibold text-sm mb-3">接続・配線情報</h4>
            <div className="space-y-3">
              {item.connection_names?.length ? (
                <div>
                  <dt className="text-gray-600 text-xs mb-1">接続名称</dt>
                  <dd className="flex flex-wrap gap-1">
                    {item.connection_names.map((name, index) => (
                      <Chip key={index} size="sm" variant="flat" color="primary">
                        {name}
                      </Chip>
                    ))}
                  </dd>
                </div>
              ) : null}
              
              {item.cable_color_pattern?.length ? (
                <div>
                  <dt className="text-gray-600 text-xs mb-1">ケーブル色パターン</dt>
                  <dd>
                    <CableVisualization 
                      colorNames={item.cable_color_pattern} 
                      size="md"
                      showLabels={true}
                    />
                  </dd>
                </div>
              ) : null}
            </div>
          </CardBody>
        </Card>

        {/* 保管場所セクション */}
        {item.storage_locations?.length ? (
          <Card className="shadow-sm">
            <CardBody className="p-3">
              <h4 className="font-semibold text-sm mb-3">保管場所</h4>
              <div className="flex flex-wrap gap-1">
                {item.storage_locations.map((location, index) => (
                  <Chip key={index} size="sm" variant="flat" color="success">
                    {location}
                  </Chip>
                ))}
              </div>
            </CardBody>
          </Card>
        ) : null}

        {/* システム情報・その他セクション */}
        <Card className="shadow-sm">
          <CardBody className="p-3">
            <h4 className="font-semibold text-sm mb-3">システム情報</h4>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-600">QRコードタイプ</dt>
                <dd className="font-medium">
                  {item.qr_code_type === 'qr' ? 'QRコード' : 
                   item.qr_code_type === 'barcode' ? 'バーコード' : 'なし'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">作成日</dt>
                <dd className="font-medium">
                  {new Date(item.created_at).toLocaleDateString('ja-JP')}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">更新日</dt>
                <dd className="font-medium">
                  {new Date(item.updated_at).toLocaleDateString('ja-JP')}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>

      {/* 備考セクション */}
      {item.remarks && (
        <Card className="shadow-sm mt-4">
          <CardBody className="p-3">
            <h4 className="font-semibold text-sm mb-2">備考</h4>
            <p className="text-sm whitespace-pre-wrap bg-white p-2 rounded border">
              {item.remarks}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
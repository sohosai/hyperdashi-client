import { ColumnDef } from '@/components/ui/EnhancedList'
import { Item } from '@/types'

export const allColumnDefs: ColumnDef<Item>[] = [
    { key: 'name', label: '名称', sortable: true },
    { key: 'label_id', label: 'ラベルID', sortable: true },
    { key: 'model_number', label: '型番', sortable: true },
    { key: 'storage_location', label: '保管場所' },
    { key: 'container_id', label: 'コンテナ', sortable: true },
    { key: 'is_disposed', label: '状態' },
    { key: 'purchase_year', label: '購入年', sortable: true },
    { key: 'remarks', label: '備考' },
    { key: 'purchase_amount', label: '購入金額', sortable: true },
    { key: 'durability_years', label: '耐用年数', sortable: true },
    { key: 'is_depreciation_target', label: '減価償却対象' },
    { key: 'connection_names', label: '接続端子' },
    { key: 'cable_color_pattern', label: 'ケーブル色' },
    { key: 'storage_type', label: '保管方法' },
    { key: 'qr_code_type', label: 'QR/バーコード種別' },
    { key: 'image_url', label: '画像' },
    { key: 'created_at', label: '登録日', sortable: true },
    { key: 'updated_at', label: '更新日', sortable: true },
    { key: 'actions', label: '操作', align: 'end' },
]

export const defaultColumnKeys = allColumnDefs.map(col => col.key).filter(key => key !== 'actions')

export const defaultVisibleColumnKeys = [
    'label_id', // ラベルID
    'name',     // 名称
    'connection_names', // 接続端子
    'cable_color_pattern', // ケーブル色
    'is_disposed', // 状態
    'storage_location', // 保管場所
    'container_id', // コンテナ
]

export const defaultColumnOrder = [
    'label_id', // ラベルID
    'name',     // 名称
    'connection_names', // 接続端子
    'cable_color_pattern', // ケーブル色
    'is_disposed', // 状態
    'storage_location', // 保管場所
    'container_id', // コンテナ
    // Add the rest of the columns in their original order, except 'actions'
    ...defaultColumnKeys.filter(
        key =>
            ![
                'label_id',
                'name',
                'connection_names',
                'cable_color_pattern',
                'is_disposed',
                'storage_location',
                'container_id',
            ].includes(key)
    ),
]

# HyperDashi フロントエンド実装仕様書

## 概要

HyperDashi物品管理システムのフロントエンドをPreact + TypeScript + MUI + Viteで実装する。
Excel風のUIを提供し、物品管理・貸出管理・画像アップロード機能を持つWebアプリケーションを構築する。

## 技術スタック

- **フレームワーク**: Preact 10.x
- **言語**: TypeScript 5.x
- **UIライブラリ**: MUI (Material-UI) 5.x
- **ビルドツール**: Vite 5.x
- **状態管理**: Preact/signals または Zustand
- **HTTP クライアント**: Fetch API または Axios
- **ルーティング**: Preact Router
- **フォームバリデーション**: React Hook Form + Yup/Zod
- **データテーブル**: MUI DataGrid または react-table
- **ファイルアップロード**: react-dropzone

## バックエンドAPI仕様

### ベースURL
```
http://127.0.0.1:8081
```

### 認証
現在は認証なし（将来的にJWTトークン認証を追加予定）

### エンドポイント一覧

#### 1. 基本エンドポイント
- `GET /` - サーバー情報
- `GET /health` - ヘルスチェック

#### 2. 物品管理API

**物品一覧取得**
```http
GET /api/v1/items?page=1&per_page=20&search=keywords&is_on_loan=false&is_disposed=false
```

Response:
```typescript
interface ItemsListResponse {
  items: Item[];
  total: number;
  page: number;
  per_page: number;
}

interface Item {
  id: number;
  name: string;
  label_id: string;
  model_number?: string;
  remarks?: string;
  purchase_year?: number;
  purchase_amount?: number;
  durability_years?: number;
  is_depreciation_target?: boolean;
  connection_names?: string[];
  cable_color_pattern?: string[];
  storage_locations?: string[];
  is_on_loan?: boolean;
  qr_code_type?: 'qr' | 'barcode' | 'none';
  is_disposed?: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}
```

**物品作成**
```http
POST /api/v1/items
Content-Type: application/json

{
  "name": "テストマイク",
  "label_id": "MIC001",
  "model_number": "Sony WM-1000XM4",
  "remarks": "高品質ワイヤレスマイク",
  "purchase_year": 2023,
  "purchase_amount": 35000.0,
  "durability_years": 5,
  "is_depreciation_target": true,
  "connection_names": ["XLR", "USB-C"],
  "cable_color_pattern": ["red", "black"],
  "storage_locations": ["部屋A", "ラックB", "コンテナ1"],
  "qr_code_type": "qr",
  "image_url": "http://example.com/image.jpg"
}
```

**物品詳細取得**
```http
GET /api/v1/items/:id
```

**物品更新**
```http
PUT /api/v1/items/:id
Content-Type: application/json
```

**物品削除**
```http
DELETE /api/v1/items/:id
```

**物品廃棄**
```http
POST /api/v1/items/:id/dispose
```

**ラベルID検索**
```http
GET /api/v1/items/by-label/:label_id
```

#### 3. 貸出管理API

**貸出一覧取得**
```http
GET /api/v1/loans?page=1&per_page=20&item_id=1&student_number=12345&active_only=true
```

Response:
```typescript
interface LoansListResponse {
  loans: LoanWithItem[];
  total: number;
  page: number;
  per_page: number;
}

interface LoanWithItem {
  id: number;
  item_id: number;
  item_name: string;
  item_label_id: string;
  student_number: string;
  student_name: string;
  organization?: string;
  loan_date: string;
  return_date?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

interface Loan {
  id: number;
  item_id: number;
  student_number: string;
  student_name: string;
  organization?: string;
  loan_date: string;
  return_date?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}
```

**貸出作成**
```http
POST /api/v1/loans
Content-Type: application/json

{
  "item_id": 1,
  "student_number": "12345678",
  "student_name": "山田太郎",
  "organization": "情報メディアシステム学類",
  "remarks": "授業用"
}
```

**貸出詳細取得**
```http
GET /api/v1/loans/:id
```

**返却処理**
```http
POST /api/v1/loans/:id/return
Content-Type: application/json

{
  "return_date": "2024-01-15T10:30:00Z",  // optional, defaults to now
  "remarks": "正常に返却"
}
```

#### 4. 画像管理API

**画像アップロード**
```http
POST /api/v1/images/upload
Content-Type: multipart/form-data

Form fields:
- image: File (JPEG, PNG, GIF, WebP, max 10MB)
```

Response:
```typescript
interface ImageUploadResponse {
  url: string;
  filename: string;
  size: number;
}
```

### エラーレスポンス
```typescript
interface ErrorResponse {
  error: string;
  message?: string;
}
```

## UI/UX要件

### 1. 全体レイアウト

**ヘッダー**
- アプリ名: "HyperDashi"
- ナビゲーションメニュー: 物品管理、貸出管理
- 検索バー（グローバル検索）

**サイドナビ**
- 物品管理
  - 物品一覧
  - 物品登録
  - 廃棄物品
- 貸出管理
  - 貸出一覧
  - 新規貸出
  - 返却処理

**メインコンテンツエリア**
- ページタイトル
- アクションボタン
- データテーブルまたはフォーム

### 2. 物品管理画面

#### 物品一覧画面 (`/items`)

**機能要件**
- Excel風のデータグリッド表示
- ページネーション（20件/ページ）
- 検索機能（物品名、ラベルID、型番、備考）
- フィルタリング（貸出状態、廃棄状態）
- ソート機能（各カラム）
- 行選択（単一・複数）
- アクション（編集、削除、廃棄、QRコード表示）

**表示カラム**
- ラベルID
- 物品名
- 型番
- 購入年度
- 購入金額
- 貸出状態（チップ表示）
- 廃棄状態（チップ表示）
- 最終更新日
- アクション（編集、削除ボタン）

**UI要素**
```tsx
// フィルター・検索バー
<Box sx={{ mb: 2 }}>
  <Grid container spacing={2}>
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        placeholder="物品名、ラベルID、型番で検索"
        value={searchText}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: <SearchIcon />
        }}
      />
    </Grid>
    <Grid item xs={6} md={2}>
      <FormControl fullWidth>
        <InputLabel>貸出状態</InputLabel>
        <Select value={loanFilter} onChange={handleLoanFilterChange}>
          <MenuItem value="">すべて</MenuItem>
          <MenuItem value="available">貸出可能</MenuItem>
          <MenuItem value="on_loan">貸出中</MenuItem>
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={6} md={2}>
      <FormControl fullWidth>
        <InputLabel>廃棄状態</InputLabel>
        <Select value={disposalFilter} onChange={handleDisposalFilterChange}>
          <MenuItem value="">すべて</MenuItem>
          <MenuItem value="active">使用中</MenuItem>
          <MenuItem value="disposed">廃棄済み</MenuItem>
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={12} md={4}>
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
        新規登録
      </Button>
    </Grid>
  </Grid>
</Box>

// データグリッド
<DataGrid
  rows={items}
  columns={columns}
  pageSize={20}
  rowsPerPageOptions={[10, 20, 50]}
  checkboxSelection
  disableSelectionOnClick
  autoHeight
  loading={loading}
  components={{
    Toolbar: GridToolbar,
  }}
  onPageChange={handlePageChange}
  onSelectionModelChange={handleSelectionChange}
/>
```

#### 物品登録・編集画面 (`/items/new`, `/items/:id/edit`)

**機能要件**
- 必須フィールドバリデーション
- リアルタイムバリデーション
- 画像アップロード（ドラッグ&ドロップ対応）
- 配列フィールド（接続名、ケーブル色、収納場所）の動的追加・削除
- フォーム状態の保存（一時保存機能）

**フォームフィールド**
```tsx
interface ItemFormData {
  name: string;                    // 必須
  label_id: string;               // 必須、英数字のみ
  model_number?: string;
  remarks?: string;
  purchase_year?: number;         // 1900-2100
  purchase_amount?: number;       // 0以上
  durability_years?: number;      // 1-100
  is_depreciation_target?: boolean;
  connection_names?: string[];    // 動的配列
  cable_color_pattern?: string[]; // 動的配列
  storage_locations?: string[];   // 動的配列
  qr_code_type?: 'qr' | 'barcode' | 'none';
  image_url?: string;
}
```

**バリデーションルール**
```typescript
const itemValidationSchema = yup.object({
  name: yup.string().required('物品名は必須です').max(255, '255文字以内で入力してください'),
  label_id: yup
    .string()
    .required('ラベルIDは必須です')
    .matches(/^[A-Za-z0-9]+$/, '英数字のみ使用可能です')
    .max(50, '50文字以内で入力してください'),
  model_number: yup.string().max(255, '255文字以内で入力してください'),
  purchase_year: yup
    .number()
    .min(1900, '1900年以降を入力してください')
    .max(2100, '2100年以前を入力してください'),
  purchase_amount: yup.number().min(0, '0以上の値を入力してください'),
  durability_years: yup
    .number()
    .min(1, '1年以上を入力してください')
    .max(100, '100年以下を入力してください'),
});
```

**画像アップロード UI**
```tsx
<Box sx={{ mb: 3 }}>
  <Typography variant="h6" gutterBottom>物品画像</Typography>
  <Dropzone
    accept={{
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    }}
    maxSize={10 * 1024 * 1024} // 10MB
    onDrop={handleImageUpload}
  >
    {({getRootProps, getInputProps, isDragActive}) => (
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          cursor: 'pointer'
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
        <Typography>
          {isDragActive 
            ? 'ここにファイルをドロップ' 
            : '画像をドラッグ&ドロップまたはクリックして選択'}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          JPEG, PNG, GIF, WebP (最大10MB)
        </Typography>
      </Paper>
    )}
  </Dropzone>
  
  {previewUrl && (
    <Box sx={{ mt: 2, textAlign: 'center' }}>
      <img src={previewUrl} alt="プレビュー" style={{ maxWidth: 300, maxHeight: 200 }} />
      <Button onClick={handleRemoveImage} color="error" startIcon={<DeleteIcon />}>
        画像を削除
      </Button>
    </Box>
  )}
</Box>
```

### 3. 貸出管理画面

#### 貸出一覧画面 (`/loans`)

**機能要件**
- 貸出履歴の一覧表示
- フィルタリング（物品ID、学籍番号、アクティブ貸出のみ）
- ソート機能
- 返却処理（一括・個別）
- 貸出状況の可視化

**表示カラム**
- 貸出ID
- 物品名（ラベルID）
- 学籍番号
- 氏名
- 所属
- 貸出日
- 返却予定日
- 返却日
- 状態（貸出中/返却済み）
- アクション

**フィルター UI**
```tsx
<Box sx={{ mb: 2 }}>
  <Grid container spacing={2}>
    <Grid item xs={12} md={3}>
      <TextField
        fullWidth
        placeholder="学籍番号で検索"
        value={studentNumberFilter}
        onChange={handleStudentNumberChange}
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <Autocomplete
        options={items}
        getOptionLabel={(option) => `${option.name} (${option.label_id})`}
        renderInput={(params) => (
          <TextField {...params} placeholder="物品で検索" />
        )}
        onChange={handleItemFilterChange}
      />
    </Grid>
    <Grid item xs={6} md={2}>
      <FormControl fullWidth>
        <InputLabel>状態</InputLabel>
        <Select value={statusFilter} onChange={handleStatusFilterChange}>
          <MenuItem value="">すべて</MenuItem>
          <MenuItem value="active">貸出中</MenuItem>
          <MenuItem value="returned">返却済み</MenuItem>
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={6} md={2}>
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewLoan}>
        新規貸出
      </Button>
    </Grid>
  </Grid>
</Box>
```

#### 新規貸出画面 (`/loans/new`)

**機能要件**
- 物品選択（利用可能な物品のみ）
- 学生情報入力
- バリデーション
- 貸出可能性チェック

**フォームフィールド**
```typescript
interface LoanFormData {
  item_id: number;        // 必須
  student_number: string; // 必須
  student_name: string;   // 必須
  organization?: string;
  remarks?: string;
}
```

#### 返却処理画面 (`/loans/:id/return`)

**機能要件**
- 返却日時設定（デフォルト：現在時刻）
- 返却時の備考入力
- 物品状態確認

### 4. 共通コンポーネント

#### レスポンシブデザイン
- モバイル対応（768px以下）
- タブレット対応（768px-1024px）
- デスクトップ対応（1024px以上）

#### 通知システム
```tsx
// Snackbar通知
const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
  // MUI Snackbar + Alert実装
};

// 使用例
showNotification('物品が正常に登録されました', 'success');
showNotification('エラーが発生しました', 'error');
```

#### ローディング状態
```tsx
// スケルトンローディング
<Skeleton variant="rectangular" height={400} />

// プログレスインジケーター
<CircularProgress />

// データテーブルローディング
<DataGrid loading={isLoading} ... />
```

#### エラーハンドリング
```tsx
// エラーバウンダリ
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>

// APIエラー処理
const handleApiError = (error: any) => {
  if (error.response?.status === 404) {
    showNotification('データが見つかりません', 'error');
  } else if (error.response?.status >= 500) {
    showNotification('サーバーエラーが発生しました', 'error');
  } else {
    showNotification('予期しないエラーが発生しました', 'error');
  }
};
```

## プロジェクト構成

```
src/
├── components/          # 共通コンポーネント
│   ├── ui/             # 基本UIコンポーネント
│   ├── forms/          # フォームコンポーネント
│   ├── tables/         # テーブルコンポーネント
│   └── layout/         # レイアウトコンポーネント
├── pages/              # ページコンポーネント
│   ├── items/          # 物品管理ページ
│   ├── loans/          # 貸出管理ページ
│   └── dashboard/      # ダッシュボード
├── hooks/              # カスタムフック
├── services/           # API呼び出し
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数
├── stores/             # 状態管理
└── constants/          # 定数定義
```

## 実装優先度

### Phase 1: 基本機能
1. プロジェクトセットアップ（Vite + Preact + TypeScript + MUI）
2. ルーティング設定
3. レイアウトコンポーネント
4. 物品一覧画面
5. 物品登録・編集画面

### Phase 2: 拡張機能
1. 貸出管理機能
2. 画像アップロード機能
3. 検索・フィルタリング機能強化
4. レスポンシブデザイン

### Phase 3: 改善・最適化
1. パフォーマンス最適化
2. エラーハンドリング強化
3. ユーザビリティ改善
4. テスト実装

## 開発環境設定

### 必要なパッケージ

```json
{
  "dependencies": {
    "preact": "^10.19.0",
    "@preact/signals": "^1.2.0",
    "preact-router": "^4.1.0",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@mui/x-data-grid": "^6.18.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "react-hook-form": "^7.48.0",
    "yup": "^1.4.0",
    "@hookform/resolvers": "^3.3.0",
    "react-dropzone": "^14.2.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@preact/preset-vite": "^2.8.0",
    "vite": "^5.0.0",
    "typescript": "^5.2.0",
    "@types/node": "^20.10.0"
  }
}
```

### Vite設定 (vite.config.ts)
```typescript
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
  },
});
```

### TypeScript設定 (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## API クライアント実装例

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター
api.interceptors.request.use((config) => {
  // 将来的にJWTトークンを追加
  return config;
});

// レスポンスインターセプター
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // エラーハンドリング
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;

// src/services/items.ts
export const itemsApi = {
  getItems: (params: GetItemsParams) => 
    api.get<ItemsListResponse>('/items', { params }),
  
  getItem: (id: number) => 
    api.get<Item>(`/items/${id}`),
  
  createItem: (data: CreateItemRequest) => 
    api.post<Item>('/items', data),
  
  updateItem: (id: number, data: UpdateItemRequest) => 
    api.put<Item>(`/items/${id}`, data),
  
  deleteItem: (id: number) => 
    api.delete(`/items/${id}`),
  
  disposeItem: (id: number) => 
    api.post<Item>(`/items/${id}/dispose`),
};
```

この仕様書に基づいて、モダンで使いやすいExcel風UIを持つHyperDashiフロントエンドを実装してください。
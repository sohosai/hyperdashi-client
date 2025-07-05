# HyperDashi Client

HyperDashi（ハイパーダッシ）は、教育機関向けの備品管理システムです。このプロジェクトは React + Vite + HeroUI を使用したフロントエンドです。

## 機能

- 📦 **備品管理**: 備品の登録・編集・削除・検索
- 📋 **貸出管理**: 備品の貸出・返却管理
- 🖼️ **画像管理**: 備品画像のアップロード・表示
- 📊 **ダッシュボード**: 統計情報の表示
- 🔍 **検索機能**: 備品名・ラベルID・型番での検索
- 📱 **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応

## 技術スタック

- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: HeroUI (NextUI v2)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Routing**: React Router
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 開発環境のセットアップ

### 必要なもの

- Node.js 18以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

### 環境変数

プロジェクトルートに `.env` ファイルがあります。必要に応じて設定を変更してください：

```env
# APIサーバーのURL（デフォルト: http://127.0.0.1:8080/api/v1）
VITE_API_BASE_URL=http://127.0.0.1:8080/api/v1

# 開発モード（APIリクエストのログ出力）
VITE_DEV_MODE=true
```

**注意**: `.env.example` ファイルをコピーして `.env` ファイルを作成し、環境に合わせて設定を変更してください。

## プロジェクト構成

```
src/
├── components/          # 再利用可能なコンポーネント
│   ├── ui/             # 基本UIコンポーネント
│   ├── layout/         # レイアウトコンポーネント
│   ├── forms/          # フォームコンポーネント
│   └── tables/         # テーブルコンポーネント
├── pages/              # ページコンポーネント
│   ├── dashboard/      # ダッシュボード
│   ├── items/          # 備品管理
│   └── loans/          # 貸出管理
├── hooks/              # カスタムフック
├── services/           # API呼び出し
├── types/              # 型定義
├── utils/              # ユーティリティ関数
└── styles/             # スタイル
```

## API仕様

バックエンドAPIは以下のベースURLで動作します：
- 開発環境: `http://127.0.0.1:8080/api/v1`（環境変数 `VITE_API_BASE_URL` で変更可能）

### 主要エンドポイント

- `GET /items` - 備品一覧取得
- `POST /items` - 備品作成
- `GET /items/:id` - 備品詳細取得
- `PUT /items/:id` - 備品更新
- `DELETE /items/:id` - 備品削除
- `GET /loans` - 貸出一覧取得
- `POST /loans` - 貸出作成
- `PUT /loans/:id/return` - 貸出返却

## 開発ガイド

### コーディング規約

- TypeScriptを使用
- ESLintとPrettierによるコードフォーマット
- コンポーネント名はPascalCase
- ファイル名はkebab-case（コンポーネントファイルは除く）

### コミット規約

- feat: 新機能
- fix: バグ修正
- docs: ドキュメント更新
- style: スタイル変更
- refactor: リファクタリング
- test: テスト追加・修正
- chore: その他の変更

## デプロイ

```bash
# 本番ビルド
npm run build

# 生成されたdistディレクトリをWebサーバーにデプロイ
```

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの投稿を歓迎します。
# HyperDashi Client

物品管理システムのReactフロントエンド。

## 開発

```bash
bun install
bun run dev
```

## Docker

サーバーのリポジトリをクライアントと同じ親ディレクトリに配置して起動：

```text
hyperdashi/
├── hyperdashi-client/
└── hyperdashi-server/
```

```bash
docker compose up --build -d
docker compose ps
```

- Client: http://127.0.0.1:3000
- Server health: http://127.0.0.1:8080/api/v1/health

ログと停止：

```bash
docker compose logs -f
docker compose down
```

SQLiteデータとアップロードファイルはDocker Volumeに保存されます。データも削除する場合だけ
`docker compose down --volumes`を使用してください。

## 技術スタック

- React + TypeScript + Vite
- HeroUI + TailwindCSS
- TanStack Query + Axios

## 環境変数

`.env`ファイルで設定：

```env
VITE_API_BASE_URL=http://127.0.0.1:8080/api/v1
```

# ビルドステージ
FROM oven/bun:alpine AS builder

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係のインストール用ファイルをコピー
COPY package.json bun.lockb ./

# 依存関係をインストール
RUN bun install

# ソースコードをコピー
COPY . .

# ビルド時の環境変数を設定
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# アプリケーションをビルド
RUN bun run build

# 実行ステージ
FROM nginx:alpine

# Nginxの設定ファイルをコピー
COPY nginx.conf /etc/nginx/nginx.conf

# ビルドされたファイルをコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# 非rootユーザーで実行
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    mkdir -p /var/cache/nginx/client_temp && \
    chown -R nginx:nginx /var/cache/nginx/client_temp && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

# ポートを公開
EXPOSE 8080

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl http://localhost:8080 || exit 1

# Nginxを起動
CMD ["nginx", "-g", "daemon off;"]

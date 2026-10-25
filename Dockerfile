# ---------- base: 编译 better-sqlite3 需要 python3 / make / g++ ----------
FROM node:20-bookworm-slim AS base
ARG DEBIAN_FRONTEND=noninteractive
# 默认走国内镜像（deb.debian.org 在本地只有约 90 KB/s，一次构建会拖到几十分钟）
ARG APT_MIRROR=mirrors.aliyun.com
# 网络不稳时 apt 容易半路超时：重试 3 次，并放宽单次下载超时
RUN sed -i "s|deb.debian.org|${APT_MIRROR}|g" /etc/apt/sources.list.d/debian.sources 2>/dev/null || true; for i in 1 2 3; do if apt-get -o Acquire::Retries=5 -o Acquire::http::Timeout=60 update && apt-get -o Acquire::Retries=5 -o Acquire::http::Timeout=60 install -y --no-install-recommends python3 make g++ ca-certificates; then ok=1; break; fi; echo "apt attempt $i failed, retrying in 5s"; sleep 5; done; test "${ok:-0}" = "1"; rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- deps ----------
FROM base AS deps
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------- builder ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- runner ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# standalone 的依赖追踪之外，兜底带上原生模块（better-sqlite3 / sharp）
COPY --from=deps /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=deps /app/node_modules/bindings ./node_modules/bindings
COPY --from=deps /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=deps /app/node_modules/sharp ./node_modules/sharp
COPY --from=deps /app/node_modules/@img ./node_modules/@img

RUN mkdir -p /data/uploads/original /data/uploads/thumb
EXPOSE 3000
CMD ["node", "server.js"]

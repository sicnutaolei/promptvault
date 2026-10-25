# PromptVault

自托管的文生图 / 图生图提示词收藏站（单管理员）。收藏提示词、参数、示例图与参考图，按收藏夹整理，支持搜索与一键复制。

技术栈：**Next.js 15 App Router + TypeScript + Tailwind CSS + better-sqlite3 + jose + sharp + zod**，无 ORM、无外部数据库、无对象存储。

## 快速开始

```bash
# 在项目目录（含 docker-compose.yml）执行
docker compose up -d --build

# 首次启动会初始化管理员，密码只打印一次
docker compose logs app | grep -A2 "\[INIT\]"
```

打开 <http://localhost:3000>（局域网内用 `http://<宿主机IP>:3000`）。管理入口 `/admin`，首次用户名 `admin`，密码就是日志里那行 `[INIT] Admin password: ...`。

> 日志里的密码是**唯一一次**明文输出；登录后请立刻到 **设置 → 修改密码** 改掉。

## 数据与持久化

| 内容 | 容器内路径 | 宿主机路径 |
| --- | --- | --- |
| SQLite 数据库 | `/data/app.db` | `./data/app.db` |
| 原图 | `/data/uploads/original/` | `./data/uploads/original/` |
| 缩略图 | `/data/uploads/thumb/` | `./data/uploads/thumb/` |
| Session 密钥 | `/data/.session-secret` | `./data/.session-secret` |

`./data` 通过 compose 的 bind mount 持久化，`docker compose down` / 重启 / 重建镜像都不会丢数据。删除 `./data` 等于清空站点（下次启动会重新生成管理员密码）。

## 备份与恢复

```bash
./scripts/backup.sh          # 生成 backup-YYYYmmdd-HHMMSS.tar.gz（包含数据库与图片）
```

恢复：

```bash
docker compose down
rm -rf data && mkdir -p data
tar xzf backup-20260101-120000.tar.gz -C data
docker compose up -d
```

脚本优先在容器内打包（`docker compose exec app tar`），因此不受宿主机上 `data/` 属主为 root 的影响；容器未运行时退回 `docker run` 只读挂载。建议先停容器再打包，SQLite 的 WAL 才会完整落盘；本项目开启 WAL，热备可能丢失最后几条写入。

## 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `DATA_DIR` | `/data` | 数据目录，容器内路径 |
| `SITE_NAME` | `PromptVault` | 站点名 |
| `PORT` | `3000` | 容器内监听端口 |
| `ADMIN_USERNAME` | `admin` | 首次初始化的管理员用户名 |
| `UPLOAD_MAX_MB` | `10` | 单张图片上限（MB） |
| `COOKIE_SECURE` | `false` | HTTPS 反代时设为 `true` |
| `APP_PORT` | `3000` | 宿主机映射端口（compose 用 `APP_PORT=3100` 可避免冲突） |

## HTTPS 反向代理

放在 Nginx / Caddy / Traefik 后面时：

1. 把 `COOKIE_SECURE` 设为 `true`，否则浏览器在 HTTPS 下不会回传 Cookie；
2. 反代需转发 `Host` 与 `X-Forwarded-Proto`，本项目的 Origin 同源校验依赖 `Host`；
3. 放宽请求体上限（≥ `UPLOAD_MAX_MB`），Nginx 默认 1 MB 会直接 413：

```nginx
server {
  listen 443 ssl;
  server_name prompt.example.com;
  client_max_body_size 12m;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## 本地开发

```bash
npm install
DATA_DIR=./data-dev npm run dev     # http://localhost:3000
npm run build                        # 生产构建（TypeScript 严格检查）
DATA_DIR=./data-dev npm start        # 本地跑生产版本
```

> `output: 'standalone'` 时 `next start` 只用于本地验证，容器里用 `node server.js`。

## 安全模型

- 全站只有一个管理员，无注册入口；所有写接口都校验 httpOnly JWT Cookie（`session`，7 天）。
- 写请求带 `Origin` 时必须同源，否则 403（基础 CSRF 防护）。
- 登录失败按 IP 限流：15 分钟窗口内 10 次失败后返回 429。
- `/media/*` 只允许 GET，路径解析后必须落在 `DATA_DIR/uploads` 内，否则 403/404；文件名是随机 UUID。
- 上传仅接受 jpg / png / webp（禁止 SVG），用 sharp 重新编码后写入，原图与缩略图均为 WebP（400px 宽）。
- 私有提示词只在「属于公开收藏夹」时对游客可见；私有收藏夹对游客 404。

## 常见问题

**端口 3000 被占用？** 先查 `ss -lntp | grep :3000`（或 Windows `netstat -ano | findstr :3000`）。在项目目录建一个 `.env` 写 `APP_PORT=3100` 再 `docker compose up -d` 即可，容器内仍是 3000，不用改代码。

**日志里没有密码？** 只有 `users` 表为空时才会初始化。已有数据时密码不会重复打印；可用 `docker compose down && rm -rf data && docker compose up -d` 重置（会清空全部内容）。

**上传 413？** 反代或网关的请求体限制；改 `client_max_body_size`，同时确认 `UPLOAD_MAX_MB`。

**图片 404？** 确认 `./data/uploads/original`、`./data/uploads/thumb` 存在且容器可写（compose 以 root 运行，一般无需额外处理）。

**中文收藏夹 slug 变成 `collection`？** slug 只保留 ASCII；中文名会回退为 `collection`，重复时自动追加 `-2`、`-3`。想自定义就在表单里手填 slug。

**构建时 better-sqlite3 报错？** Dockerfile 已安装 `python3 make g++`；若改过 `package.json` 记得同步刷新 `package-lock.json`（`npm install`）。

**构建慢 / apt 超时？** Dockerfile 默认把 Debian 源换成 `mirrors.aliyun.com`。在海外或想换源时用 `docker compose build --build-arg APT_MIRROR=deb.debian.org`（也可换成任意 Debian 镜像域名）。

**Windows + WSL2 下局域网访问不了？** 容器确实监听在 `0.0.0.0:3000`，但 WSL2 的 NAT 只把端口映射到 Windows 的 `127.0.0.1`。两种解法：在 `.wslconfig` 里开启 `networkingMode=mirrored`，或用**管理员** PowerShell 加一条转发：

```powershell
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=3000 connectaddress=(wsl hostname -I).Trim() connectport=3000
netsh interface portproxy show v4tov4
```

注意 WSL 的 IP 每次重启会变，需要重新执行；生产环境直接部署在 Linux 主机（如 Debian NAS）上就没有这个问题。另外 WSL 空闲时可能自动关机，`dockerd` 随之退出，容器会在下次访问时被重新拉起，数据不会丢。

## 目录结构

```
app/                 # 页面与 Route Handlers
  api/auth|public|admin|health
  admin/(panel)/     # 登录保护的后台页面
  c/[slug], p/[id], search, media/[...path]
components/          # 展示组件与后台 Client Components
lib/
  db.ts              # 建表、管理员初始化、session secret
  auth.ts            # JWT、Cookie、Origin、限流
  queries.ts         # 读查询（首页/详情/搜索/统计）
  mutations.ts       # 写操作（收藏夹/提示词/标签/清理）
  media.ts, urls.ts  # 路径安全、媒体 URL
  validators.ts      # zod 入参校验
scripts/backup.sh
Dockerfile / docker-compose.yml / next.config.ts
```

## 不在范围内

不做注册 / 多用户、在线生成、模型 API、审核、评论、点赞、对象存储、CDN、Elasticsearch；不把图片存进数据库。

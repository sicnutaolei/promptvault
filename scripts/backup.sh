#!/usr/bin/env bash
# 在宿主机项目目录执行：./scripts/backup.sh
# 容器以 root 运行，data/.session-secret 是 0600，宿主机普通用户直接 tar 会读不到；
# 所以优先在容器里打包，导出的是 /data 的内容（归档内为 ./app.db 等）。
set -euo pipefail
cd "$(dirname "$0")/.."
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="backup-${STAMP}.tar.gz"

if [ ! -d data ]; then
  echo "没有找到 ./data 目录（先在项目目录启动一次容器）" >&2
  exit 1
fi

if docker compose ps --status running --format '{{.Name}}' 2>/dev/null | grep -q .; then
  docker compose exec -T app tar czf - -C /data . > "$OUT"
elif IMG="$(docker compose images -q app 2>/dev/null)" && [ -n "$IMG" ]; then
  docker run --rm -v "$PWD/data:/src:ro" -v "$PWD:/backup" "$IMG" tar czf "/backup/$OUT" -C /src .
else
  tar czf "$OUT" data
fi

SIZE="$(du -h "$OUT" | cut -f1)"
echo "备份完成：$(pwd)/$OUT (${SIZE})"
echo "恢复：docker compose down && rm -rf data && mkdir -p data && tar xzf $OUT -C data && docker compose up -d"

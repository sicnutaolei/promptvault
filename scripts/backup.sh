#!/usr/bin/env bash
# 在宿主机项目目录执行：./scripts/backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="backup-${STAMP}.tar.gz"
if [ ! -d data ]; then
  echo "没有找到 ./data 目录（先在项目目录启动一次容器）" >&2
  exit 1
fi
tar czf "$OUT" data
SIZE="$(du -h "$OUT" | cut -f1)"
echo "备份完成：$(pwd)/$OUT (${SIZE})"
echo "恢复：docker compose down && rm -rf data && tar xzf $OUT && docker compose up -d"

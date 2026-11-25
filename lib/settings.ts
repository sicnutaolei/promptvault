import { getDb, nowIso } from './db';

export const DEFAULT_SLOGAN = '发现好用的 AI 绘画提示词';

export function getSlogan(): string {
  const row = getDb().prepare("SELECT value FROM site_settings WHERE key = 'slogan'").get() as { value: string } | undefined;
  return row?.value?.trim() || DEFAULT_SLOGAN;
}

export function setSlogan(value: string): string {
  const slogan = value.trim();
  getDb()
    .prepare(
      `INSERT INTO site_settings (key, value, updated_at) VALUES ('slogan', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(slogan, nowIso());
  return slogan;
}
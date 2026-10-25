import fs from 'node:fs';
import path from 'node:path';
import { UPLOADS_DIR } from './db';
import { mediaUrl } from './urls';

const TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
};

/** Resolve a stored relative path (e.g. original/x.webp) inside uploads, or null if it escapes. */
export function resolveUploadPath(rel: string): string | null {
  if (!rel || rel.includes('\0')) return null;
  const abs = path.resolve(UPLOADS_DIR, rel);
  const root = path.resolve(UPLOADS_DIR);
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  return abs;
}

export function mediaContentType(rel: string): string {
  return TYPES[path.extname(rel).toLowerCase()] || 'application/octet-stream';
}

export function unlinkUpload(rel: string | null | undefined): void {
  if (!rel) return;
  const abs = resolveUploadPath(rel);
  if (!abs) return;
  try {
    fs.unlinkSync(abs);
  } catch {
    /* already gone */
  }
}

export { mediaUrl };

import fs from 'node:fs';
import path from 'node:path';
import { getDb, nowIso, ORIGINAL_DIR, THUMB_DIR } from './db';
import { unlinkUpload } from './media';
import type { CollectionRow, PromptRow } from './types';

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'collection';
}

export function uniqueCollectionSlug(candidate: string, excludeId?: number): string {
  const db = getDb();
  const base = slugify(candidate);
  let slug = base;
  let i = 2;
  for (;;) {
    const row = db.prepare('SELECT id FROM collections WHERE slug = ?').get(slug) as { id: number } | undefined;
    if (!row || row.id === excludeId) return slug;
    slug = `${base}-${i++}`;
  }
}

export interface CollectionInput {
  name: string;
  slug?: string | null;
  description?: string | null;
  is_public?: boolean | number;
  sort_order?: number;
  cover_path?: string | null;
  cover_thumb_path?: string | null;
}

export function createCollection(input: CollectionInput): CollectionRow {
  const db = getDb();
  const slug = uniqueCollectionSlug(input.slug?.trim() || input.name);
  const ts = nowIso();
  const res = db
    .prepare(`INSERT INTO collections (name, slug, description, cover_path, cover_thumb_path, is_public, sort_order, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      input.name, slug, input.description ?? null, input.cover_path ?? null, input.cover_thumb_path ?? null,
      input.is_public === false || input.is_public === 0 ? 0 : 1, input.sort_order ?? 0, ts, ts,
    );
  return db.prepare('SELECT * FROM collections WHERE id = ?').get(Number(res.lastInsertRowid)) as CollectionRow;
}

export function updateCollection(id: number, input: CollectionInput): CollectionRow | null {
  const db = getDb();
  const current = db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as CollectionRow | undefined;
  if (!current) return null;
  const slug = input.slug?.trim()
    ? uniqueCollectionSlug(input.slug.trim(), id)
    : input.name !== current.name
      ? uniqueCollectionSlug(current.slug, id)
      : current.slug;
  const oldCover = current.cover_path;
  const oldThumb = current.cover_thumb_path;
  db.prepare(`UPDATE collections SET name = ?, slug = ?, description = ?, cover_path = ?, cover_thumb_path = ?, is_public = ?, sort_order = ?, updated_at = ? WHERE id = ?`)
    .run(
      input.name, slug, input.description ?? null,
      input.cover_path !== undefined ? input.cover_path : current.cover_path,
      input.cover_thumb_path !== undefined ? input.cover_thumb_path : current.cover_thumb_path,
      input.is_public === false || input.is_public === 0 ? 0 : 1,
      input.sort_order ?? current.sort_order, nowIso(), id,
    );
  if (input.cover_path !== undefined && oldCover && oldCover !== input.cover_path) unlinkUpload(oldCover);
  if (input.cover_thumb_path !== undefined && oldThumb && oldThumb !== input.cover_thumb_path) unlinkUpload(oldThumb);
  return db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as CollectionRow;
}

export function deleteCollection(id: number): boolean {
  const db = getDb();
  const row = db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as CollectionRow | undefined;
  if (!row) return false;
  db.prepare('DELETE FROM collections WHERE id = ?').run(id);
  unlinkUpload(row.cover_path);
  unlinkUpload(row.cover_thumb_path);
  return true;
}

export function setCollectionPrompts(collectionId: number, promptIds: number[]): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM collection_prompts WHERE collection_id = ?').run(collectionId);
    const insert = db.prepare('INSERT OR IGNORE INTO collection_prompts (collection_id, prompt_id, sort_order, created_at) VALUES (?, ?, ?, ?)');
    const ts = nowIso();
    promptIds.forEach((pid, index) => insert.run(collectionId, pid, index, ts));
  });
  tx();
}

export interface PromptInput {
  title: string;
  type: 'text2img' | 'img2img';
  positive_prompt: string;
  negative_prompt?: string | null;
  model?: string | null;
  sampler?: string | null;
  steps?: number | null;
  cfg_scale?: number | null;
  seed?: string | null;
  width?: number | null;
  height?: number | null;
  lora?: string | null;
  source_url?: string | null;
  notes?: string | null;
  visibility?: 'public' | 'private';
  tags?: string[];
  images?: { role: 'example' | 'reference' | 'generated'; filePath: string; thumbPath: string }[];
}

function tagIdsFor(names: string[]): number[] {
  const db = getDb();
  const ids: number[] = [];
  const insert = db.prepare('INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING');
  const find = db.prepare('SELECT id FROM tags WHERE name = ?');
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    insert.run(name);
    const row = find.get(name) as { id: number } | undefined;
    if (row) ids.push(row.id);
  }
  return Array.from(new Set(ids));
}

export function createPrompt(input: PromptInput): PromptRow {
  const db = getDb();
  const ts = nowIso();
  const tx = db.transaction(() => {
    const res = db.prepare(`INSERT INTO prompts (title, type, positive_prompt, negative_prompt, model, sampler, steps, cfg_scale, seed, width, height, lora, source_url, notes, visibility, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`)
      .run(input.title, input.type, input.positive_prompt, input.negative_prompt ?? null, input.model ?? null, input.sampler ?? null,
        input.steps ?? null, input.cfg_scale ?? null, input.seed ?? null, input.width ?? null, input.height ?? null,
        input.lora ?? null, input.source_url ?? null, input.notes ?? null, input.visibility ?? 'public', ts, ts);
    const id = Number(res.lastInsertRowid);
    for (const tagId of tagIdsFor(input.tags || [])) {
      db.prepare('INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)').run(id, tagId);
    }
    const img = db.prepare('INSERT INTO prompt_images (prompt_id, role, file_path, thumb_path, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    (input.images || []).forEach((image, index) => img.run(id, image.role, image.filePath, image.thumbPath, index, ts));
    return id;
  });
  const id = tx();
  return db.prepare('SELECT * FROM prompts WHERE id = ?').get(id) as PromptRow;
}

export function updatePrompt(id: number, input: PromptInput): PromptRow | null {
  const db = getDb();
  const current = db.prepare('SELECT * FROM prompts WHERE id = ?').get(id) as PromptRow | undefined;
  if (!current) return null;
  const keepPaths = new Set((input.images || []).map((i) => i.filePath));
  const oldImages = db.prepare('SELECT file_path, thumb_path FROM prompt_images WHERE prompt_id = ?').all(id) as { file_path: string; thumb_path: string }[];
  const tx = db.transaction(() => {
    db.prepare(`UPDATE prompts SET title = ?, type = ?, positive_prompt = ?, negative_prompt = ?, model = ?, sampler = ?, steps = ?, cfg_scale = ?, seed = ?, width = ?, height = ?, lora = ?, source_url = ?, notes = ?, visibility = ?, updated_at = ? WHERE id = ?`)
      .run(input.title, input.type, input.positive_prompt, input.negative_prompt ?? null, input.model ?? null, input.sampler ?? null,
        input.steps ?? null, input.cfg_scale ?? null, input.seed ?? null, input.width ?? null, input.height ?? null,
        input.lora ?? null, input.source_url ?? null, input.notes ?? null, input.visibility ?? 'public', nowIso(), id);
    db.prepare('DELETE FROM prompt_tags WHERE prompt_id = ?').run(id);
    for (const tagId of tagIdsFor(input.tags || [])) {
      db.prepare('INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)').run(id, tagId);
    }
    db.prepare('DELETE FROM prompt_images WHERE prompt_id = ?').run(id);
    const img = db.prepare('INSERT INTO prompt_images (prompt_id, role, file_path, thumb_path, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    (input.images || []).forEach((image, index) => img.run(id, image.role, image.filePath, image.thumbPath, index, nowIso()));
  });
  tx();
  for (const old of oldImages) {
    if (!keepPaths.has(old.file_path)) {
      unlinkUpload(old.file_path);
      unlinkUpload(old.thumb_path);
    }
  }
  return db.prepare('SELECT * FROM prompts WHERE id = ?').get(id) as PromptRow;
}

export function deletePrompt(id: number): boolean {
  const db = getDb();
  const images = db.prepare('SELECT file_path, thumb_path FROM prompt_images WHERE prompt_id = ?').all(id) as { file_path: string; thumb_path: string }[];
  const res = db.prepare('DELETE FROM prompts WHERE id = ?').run(id);
  if (!res.changes) return false;
  for (const image of images) {
    unlinkUpload(image.file_path);
    unlinkUpload(image.thumb_path);
  }
  return true;
}

export function purgeOrphanUploads(): number {
  const db = getDb();
  const used = new Set<string>();
  for (const r of db.prepare('SELECT cover_path AS p FROM collections WHERE cover_path IS NOT NULL').all() as { p: string }[]) used.add(r.p);
  for (const r of db.prepare('SELECT cover_thumb_path AS p FROM collections WHERE cover_thumb_path IS NOT NULL').all() as { p: string }[]) used.add(r.p);
  for (const r of db.prepare('SELECT file_path AS p, thumb_path AS t FROM prompt_images').all() as { p: string; t: string }[]) { used.add(r.p); used.add(r.t); }
  let removed = 0;
  for (const dir of [ORIGINAL_DIR, THUMB_DIR]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const rel = `${path.basename(dir)}/${name}`;
      if (!used.has(rel)) {
        try { fs.unlinkSync(path.join(dir, name)); removed++; } catch { /* ignore */ }
      }
    }
  }
  return removed;
}

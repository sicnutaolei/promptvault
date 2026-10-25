import { getDb } from './db';
import type {
  CollectionCard, CollectionRow, Paged, PromptCard, PromptDetail, PromptImage, PromptRow,
} from './types';

const PAGE_SIZE = 20;

function chunk<T>(arr: T[], size = 400): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function tagsByPrompt(ids: number[]): Map<number, string[]> {
  const map = new Map<number, string[]>();
  if (!ids.length) return map;
  const db = getDb();
  for (const part of chunk(ids)) {
    const holes = part.map(() => '?').join(',');
    const rows = db
      .prepare(`SELECT pt.prompt_id, t.name FROM prompt_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.prompt_id IN (${holes}) ORDER BY t.name`)
      .all(...part) as { prompt_id: number; name: string }[];
    for (const r of rows) {
      const list = map.get(r.prompt_id) || [];
      list.push(r.name);
      map.set(r.prompt_id, list);
    }
  }
  return map;
}

const CARD_SELECT = `
  SELECT p.*, (
    SELECT pi.thumb_path FROM prompt_images pi WHERE pi.prompt_id = p.id
    ORDER BY CASE pi.role WHEN 'example' THEN 0 WHEN 'generated' THEN 1 ELSE 2 END, pi.sort_order, pi.id
    LIMIT 1
  ) AS thumb
  FROM prompts p
`;

export function listPublicCollections(): CollectionCard[] {
  return getDb()
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM collection_prompts cp WHERE cp.collection_id = c.id) AS prompt_count
       FROM collections c WHERE c.is_public = 1 ORDER BY c.sort_order ASC, c.id DESC`,
    )
    .all() as CollectionCard[];
}

export function listAllCollections(): CollectionCard[] {
  return getDb()
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM collection_prompts cp WHERE cp.collection_id = c.id) AS prompt_count
       FROM collections c ORDER BY c.sort_order ASC, c.id DESC`,
    )
    .all() as CollectionCard[];
}

export function getCollectionBySlug(slug: string): CollectionRow | null {
  return (getDb().prepare('SELECT * FROM collections WHERE slug = ?').get(slug) as CollectionRow) || null;
}

export function getCollectionById(id: number): CollectionRow | null {
  return (getDb().prepare('SELECT * FROM collections WHERE id = ?').get(id) as CollectionRow) || null;
}

export function getPromptsInCollection(collectionId: number, page = 1): Paged<PromptCard> {
  const db = getDb();
  const pageSize = 24;
  const total = (db.prepare('SELECT COUNT(*) AS n FROM collection_prompts WHERE collection_id = ?').get(collectionId) as { n: number }).n;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const rows = db
    .prepare(
      `${CARD_SELECT} JOIN collection_prompts cp ON cp.prompt_id = p.id
       WHERE cp.collection_id = ? ORDER BY cp.sort_order ASC, cp.created_at DESC LIMIT ? OFFSET ?`,
    )
    .all(collectionId, pageSize, (safePage - 1) * pageSize) as (PromptRow & { thumb: string | null })[];
  const tagMap = tagsByPrompt(rows.map((r) => r.id));
  return {
    items: rows.map((r) => ({ ...r, tags: tagMap.get(r.id) || [] })),
    page: safePage, pageSize, total, totalPages,
  };
}

export function isPromptPubliclyVisible(id: number): boolean {
  const row = getDb()
    .prepare(
      `SELECT 1 FROM prompts p WHERE p.id = ? AND p.status = 'published' AND (
         p.visibility = 'public' OR EXISTS (
           SELECT 1 FROM collection_prompts cp JOIN collections c ON c.id = cp.collection_id
           WHERE cp.prompt_id = p.id AND c.is_public = 1
         ))`,
    )
    .get(id);
  return Boolean(row);
}

export function getPromptDetail(id: number): (PromptDetail & { publiclyVisible: boolean }) | null {
  const db = getDb();
  const prompt = db.prepare('SELECT * FROM prompts WHERE id = ?').get(id) as PromptRow | undefined;
  if (!prompt) return null;
  const images = db
    .prepare('SELECT * FROM prompt_images WHERE prompt_id = ? ORDER BY sort_order ASC, id ASC')
    .all(id) as PromptImage[];
  const tags = db
    .prepare('SELECT t.name FROM prompt_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.prompt_id = ? ORDER BY t.name')
    .all(id) as { name: string }[];
  const collections = db
    .prepare(
      `SELECT c.id, c.name, c.slug, c.is_public FROM collection_prompts cp JOIN collections c ON c.id = cp.collection_id
       WHERE cp.prompt_id = ? ORDER BY c.sort_order ASC, c.id DESC`,
    )
    .all(id) as { id: number; name: string; slug: string; is_public: number }[];
  return {
    ...prompt,
    images,
    tags: tags.map((t) => t.name),
    collections,
    publiclyVisible: isPromptPubliclyVisible(id),
  };
}

const VISIBLE_SQL = `p.status = 'published' AND (
  p.visibility = 'public' OR EXISTS (
    SELECT 1 FROM collection_prompts cp2 JOIN collections c2 ON c2.id = cp2.collection_id
    WHERE cp2.prompt_id = p.id AND c2.is_public = 1
  ))`;

export function searchPrompts(params: {
  q?: string; type?: string; model?: string; tag?: string; page?: number;
}): Paged<PromptCard> {
  const db = getDb();
  const where: string[] = [VISIBLE_SQL];
  const args: (string | number)[] = [];
  if (params.q) {
    where.push('(p.title LIKE ? OR p.positive_prompt LIKE ? OR p.negative_prompt LIKE ? OR EXISTS (SELECT 1 FROM prompt_tags ptq JOIN tags tq ON tq.id = ptq.tag_id WHERE ptq.prompt_id = p.id AND tq.name LIKE ?))');
    const like = `%${params.q}%`;
    args.push(like, like, like, like);
  }
  if (params.type === 'text2img' || params.type === 'img2img') { where.push('p.type = ?'); args.push(params.type); }
  if (params.model) { where.push('p.model = ?'); args.push(params.model); }
  if (params.tag) {
    where.push('EXISTS (SELECT 1 FROM prompt_tags ptf JOIN tags tf ON tf.id = ptf.tag_id WHERE ptf.prompt_id = p.id AND tf.name = ?)');
    args.push(params.tag);
  }
  const clause = where.join(' AND ');
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM prompts p WHERE ${clause}`).get(...args) as { n: number }).n;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page || 1), totalPages);
  const rows = db
    .prepare(`${CARD_SELECT} WHERE ${clause} ORDER BY p.updated_at DESC, p.id DESC LIMIT ? OFFSET ?`)
    .all(...args, PAGE_SIZE, (page - 1) * PAGE_SIZE) as (PromptRow & { thumb: string | null })[];
  const tagMap = tagsByPrompt(rows.map((r) => r.id));
  return { items: rows.map((r) => ({ ...r, tags: tagMap.get(r.id) || [] })), page, pageSize: PAGE_SIZE, total, totalPages };
}

export function listModels(): string[] {
  return (getDb().prepare("SELECT DISTINCT model FROM prompts WHERE model IS NOT NULL AND model != '' ORDER BY model").all() as { model: string }[]).map((r) => r.model);
}

export function listTags(): { name: string; count: number }[] {
  return getDb()
    .prepare('SELECT t.name, COUNT(pt.prompt_id) AS count FROM tags t LEFT JOIN prompt_tags pt ON pt.tag_id = t.id GROUP BY t.id ORDER BY count DESC, t.name ASC')
    .all() as { name: string; count: number }[];
}

export function listAdminPrompts(params: { q?: string; type?: string; visibility?: string; page?: number }): Paged<PromptCard> {
  const db = getDb();
  const where: string[] = ['1=1'];
  const args: (string | number)[] = [];
  if (params.q) { where.push('(p.title LIKE ? OR p.positive_prompt LIKE ?)'); args.push(`%${params.q}%`, `%${params.q}%`); }
  if (params.type === 'text2img' || params.type === 'img2img') { where.push('p.type = ?'); args.push(params.type); }
  if (params.visibility === 'public' || params.visibility === 'private') { where.push('p.visibility = ?'); args.push(params.visibility); }
  const clause = where.join(' AND ');
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM prompts p WHERE ${clause}`).get(...args) as { n: number }).n;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page || 1), totalPages);
  const rows = db.prepare(`${CARD_SELECT} WHERE ${clause} ORDER BY p.updated_at DESC, p.id DESC LIMIT ? OFFSET ?`)
    .all(...args, PAGE_SIZE, (page - 1) * PAGE_SIZE) as (PromptRow & { thumb: string | null })[];
  const tagMap = tagsByPrompt(rows.map((r) => r.id));
  return { items: rows.map((r) => ({ ...r, tags: tagMap.get(r.id) || [] })), page, pageSize: PAGE_SIZE, total, totalPages };
}

export function listPromptPicker(): { id: number; title: string; type: string; visibility: string }[] {
  return getDb().prepare('SELECT id, title, type, visibility FROM prompts ORDER BY updated_at DESC').all() as { id: number; title: string; type: string; visibility: string }[];
}

export function collectionPromptIds(collectionId: number): number[] {
  return (getDb().prepare('SELECT prompt_id FROM collection_prompts WHERE collection_id = ? ORDER BY sort_order, created_at').all(collectionId) as { prompt_id: number }[]).map((r) => r.prompt_id);
}

export function dashboardStats() {
  const db = getDb();
  const count = (table: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
  return {
    collections: count('collections'),
    publicCollections: (db.prepare('SELECT COUNT(*) AS n FROM collections WHERE is_public = 1').get() as { n: number }).n,
    prompts: count('prompts'),
    images: count('prompt_images'),
    tags: count('tags'),
    recent: db.prepare('SELECT id, title, type, visibility, updated_at FROM prompts ORDER BY updated_at DESC LIMIT 6').all() as { id: number; title: string; type: string; visibility: string; updated_at: string }[],
  };
}

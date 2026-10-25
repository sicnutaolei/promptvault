import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export const DATA_DIR = process.env.DATA_DIR || '/data';
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const ORIGINAL_DIR = path.join(UPLOADS_DIR, 'original');
export const THUMB_DIR = path.join(UPLOADS_DIR, 'thumb');
export const DB_PATH = path.join(DATA_DIR, 'app.db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_path TEXT,
  cover_thumb_path TEXT,
  is_public INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('text2img','img2img')),
  positive_prompt TEXT NOT NULL,
  negative_prompt TEXT,
  model TEXT,
  sampler TEXT,
  steps INTEGER,
  cfg_scale REAL,
  seed TEXT,
  width INTEGER,
  height INTEGER,
  lora TEXT,
  source_url TEXT,
  notes TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','private')),
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS prompt_images (
  id INTEGER PRIMARY KEY,
  prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('example','reference','generated')),
  file_path TEXT NOT NULL,
  thumb_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS prompt_tags (
  prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY(prompt_id, tag_id)
);
CREATE TABLE IF NOT EXISTS collection_prompts (
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  PRIMARY KEY(collection_id, prompt_id)
);
CREATE INDEX IF NOT EXISTS idx_prompt_images_prompt ON prompt_images(prompt_id);
CREATE INDEX IF NOT EXISTS idx_collection_prompts_col ON collection_prompts(collection_id);
CREATE INDEX IF NOT EXISTS idx_prompts_visibility ON prompts(visibility, status);
`;

function ensureDirs() {
  for (const dir of [DATA_DIR, UPLOADS_DIR, ORIGINAL_DIR, THUMB_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function initAdmin(db: Database.Database) {
  const row = db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };
  if (row.n > 0) return;
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = crypto.randomBytes(9).toString('base64url').slice(0, 12);
  const hash = bcrypt.hashSync(password, 12);
  db.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)').run(
    username,
    hash,
    new Date().toISOString(),
  );
  const line = '='.repeat(56);
  console.log(`\n${line}`);
  console.log(`[INIT] Admin username: ${username}`);
  console.log(`[INIT] Admin password: ${password}`);
  console.log('[INIT] 请登录后立即修改密码');
  console.log(`${line}\n`);
}

function initDb(): Database.Database {
  ensureDirs();
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(SCHEMA);
  initAdmin(db);
  return db;
}

const globalForDb = globalThis as unknown as { __pvDb?: Database.Database };

export function getDb(): Database.Database {
  if (!globalForDb.__pvDb) globalForDb.__pvDb = initDb();
  return globalForDb.__pvDb;
}

export function getSessionSecret(): Uint8Array {
  const file = path.join(DATA_DIR, '.session-secret');
  ensureDirs();
  try {
    const hex = fs.readFileSync(file, 'utf8').trim();
    if (hex.length >= 64) return Buffer.from(hex, 'hex');
  } catch {
    /* generate below */
  }
  const hex = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(file, hex, { mode: 0o600 });
  return Buffer.from(hex, 'hex');
}

export function nowIso(): string {
  return new Date().toISOString();
}

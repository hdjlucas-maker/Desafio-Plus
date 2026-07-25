/**
 * Desafio+ — config/db.js
 * Banco de dados SQLite local com better-sqlite3.
 * Cria o arquivo desafio-plus.db automaticamente e roda o schema
 * na primeira vez (auto-migrate). Zero configuração necessária.
 */

const path = require('path');

// ── Localização do banco ──────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, '..', 'desafio-plus.db');

// ── Inicializa better-sqlite3 ─────────────────────────────────────────────
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.error('\n❌ Módulo "better-sqlite3" não encontrado.');
  console.error('   Execute: npm install  (na pasta backend)\n');
  process.exit(1);
}

const db = new Database(DB_PATH);

// WAL mode = muito mais rápido para leituras concorrentes
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema completo (CREATE TABLE IF NOT EXISTS — idempotente) ────────────
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email         TEXT UNIQUE NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  password_hash TEXT,
  avatar_url    TEXT,
  bio           TEXT DEFAULT '',
  google_id     TEXT UNIQUE,
  level         INTEGER DEFAULT 1,
  xp            INTEGER DEFAULT 0,
  points        INTEGER DEFAULT 0,
  streak        INTEGER DEFAULT 0,
  last_active   TEXT DEFAULT (datetime('now')),
  streak_date   TEXT,
  is_verified   BOOLEAN DEFAULT 0,
  is_banned     BOOLEAN DEFAULT 0,
  privacy       TEXT DEFAULT 'public',
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google   ON users(google_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  revoked    INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rt_token   ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_rt_user    ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used       INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS badges (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  rarity      TEXT DEFAULT 'comum',
  xp_reward   INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_badges (
  id        TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id  TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS follows (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  follower_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TEXT DEFAULT (datetime('now')),
  UNIQUE(follower_id, following_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_follower  ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

CREATE TABLE IF NOT EXISTS blocks (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content        TEXT NOT NULL,
  media_urls     TEXT DEFAULT '[]',
  media_type     TEXT DEFAULT 'none',
  category       TEXT DEFAULT 'geral',
  challenge_id   TEXT,
  likes_count    INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count   INTEGER DEFAULT 0,
  is_deleted     BOOLEAN DEFAULT 0,
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_user    ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

CREATE TABLE IF NOT EXISTS likes (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);

CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  actor_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  message    TEXT,
  is_read    BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS challenges (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT DEFAULT 'geral',
  difficulty  TEXT DEFAULT 'medio',
  xp_reward   INTEGER DEFAULT 100,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS challenge_completions (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  completed_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile_hidden   BOOLEAN DEFAULT 0,
  notifications_on BOOLEAN DEFAULT 1,
  updated_at       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_presence (
  user_id   TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_seen TEXT DEFAULT (datetime('now')),
  state     TEXT DEFAULT '',
  is_online INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_presence_seen ON user_presence(last_seen);
`;

// Roda o schema (idempotente — IF NOT EXISTS em tudo)
db.exec(SCHEMA);
console.log(`✅ Banco SQLite pronto: ${DB_PATH}`);

// ── Helpers assíncronos compatíveis com o authController ─────────────────
// O authController usa await query/queryOne/run — aqui convertemos para Promises.

function query(sql, params = [], _d1 = null) {
  return Promise.resolve(db.prepare(sql).all(...params));
}

// Alias de query — usado pelas rotas de search, presence, suggestions
function queryAll(sql, params = [], _d1 = null) {
  return Promise.resolve(db.prepare(sql).all(...params));
}

function queryOne(sql, params = [], _d1 = null) {
  return Promise.resolve(db.prepare(sql).get(...params) || null);
}

function run(sql, params = [], _d1 = null) {
  return Promise.resolve(db.prepare(sql).run(...params));
}

module.exports = { db, query, queryAll, queryOne, run };

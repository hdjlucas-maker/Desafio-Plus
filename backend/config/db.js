/**
 * Desafio+ — config/db.js
 * Dual-mode: better-sqlite3 (local) / D1 (Cloudflare Workers)
 */

const DB_PATH = (() => {
  try { return require('path').join(__dirname, '..', 'desafio-plus.db'); }
  catch { return ':memory:'; }
})();

let localDb = null;

try {
  const Database = require('better-sqlite3');
  if (DB_PATH !== ':memory:') {
    localDb = new Database(DB_PATH);
    localDb.pragma('journal_mode = WAL');
    localDb.pragma('foreign_keys = ON');
  }
} catch (e) {
  //better-sqlite3 não disponível (Cloudflare Workers)
}

function getD1(req) {
  if (req && req.d1) return req.d1;
  if (globalThis.__CF_ENV__ && globalThis.__CF_ENV__.DB) return globalThis.__CF_ENV__.DB;
  return null;
}

function isLocal() {
  return localDb !== null && getD1() === null;
}

// Schema (só roda local — D1 já tem as tabelas via wrangler)
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, username TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, password_hash TEXT, avatar_url TEXT, bio TEXT DEFAULT '', google_id TEXT UNIQUE, level INTEGER DEFAULT 1, xp INTEGER DEFAULT 0, points INTEGER DEFAULT 0, streak INTEGER DEFAULT 0, last_active TEXT DEFAULT (datetime('now')), streak_date TEXT, is_verified BOOLEAN DEFAULT 0, is_banned BOOLEAN DEFAULT 0, privacy TEXT DEFAULT 'public', created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE TABLE IF NOT EXISTS refresh_tokens (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, token TEXT UNIQUE NOT NULL, expires_at TEXT NOT NULL, revoked INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS password_reset_tokens (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, token TEXT UNIQUE NOT NULL, expires_at TEXT NOT NULL, used INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS badges (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL, icon TEXT NOT NULL, rarity TEXT DEFAULT 'comum', xp_reward INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS user_badges (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE, earned_at TEXT DEFAULT (datetime('now')), UNIQUE(user_id, badge_id));
CREATE TABLE IF NOT EXISTS follows (id TEXT PRIMARY KEY, follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT DEFAULT (datetime('now')), UNIQUE(follower_id, following_id));
CREATE TABLE IF NOT EXISTS blocks (id TEXT PRIMARY KEY, blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at TEXT DEFAULT (datetime('now')), UNIQUE(blocker_id, blocked_id));
CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, content TEXT NOT NULL, media_urls TEXT DEFAULT '[]', media_type TEXT DEFAULT 'none', category TEXT DEFAULT 'geral', challenge_id TEXT, likes_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0, shares_count INTEGER DEFAULT 0, is_deleted BOOLEAN DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE TABLE IF NOT EXISTS likes (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, post_id TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')), UNIQUE(user_id, post_id));
CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, post_id TEXT NOT NULL, user_id TEXT NOT NULL, parent_id TEXT, content TEXT NOT NULL, likes_count INTEGER DEFAULT 0, is_deleted BOOLEAN DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL, actor_id TEXT, entity_type TEXT, entity_id TEXT, message TEXT, is_read BOOLEAN DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS challenges (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, mode TEXT NOT NULL DEFAULT 'solo', category TEXT DEFAULT 'geral', difficulty TEXT DEFAULT 'facil', xp_reward INTEGER DEFAULT 50, points_reward INTEGER DEFAULT 10, rarity TEXT DEFAULT 'comum', is_daily BOOLEAN DEFAULT 0, is_active BOOLEAN DEFAULT 1, ai_generated BOOLEAN DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS challenge_completions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, challenge_id TEXT NOT NULL, post_id TEXT, proof_url TEXT, xp_earned INTEGER DEFAULT 0, points_earned INTEGER DEFAULT 0, completed_at TEXT DEFAULT (datetime('now')), UNIQUE(user_id, challenge_id, completed_at));
CREATE TABLE IF NOT EXISTS user_settings (user_id TEXT PRIMARY KEY, profile_hidden BOOLEAN DEFAULT 0, notifications_on BOOLEAN DEFAULT 1, updated_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS user_presence (user_id TEXT PRIMARY KEY, last_seen TEXT DEFAULT (datetime('now')), state TEXT DEFAULT '', is_online INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS game_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, game_slug TEXT NOT NULL, score INTEGER DEFAULT 0, duration INTEGER DEFAULT 0, result TEXT DEFAULT 'completed', metadata TEXT DEFAULT '{}', points_earned INTEGER DEFAULT 0, played_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS game_leaderboard (id TEXT PRIMARY KEY, game_slug TEXT NOT NULL, user_id TEXT NOT NULL, best_score INTEGER DEFAULT 0, total_plays INTEGER DEFAULT 0, updated_at TEXT DEFAULT (datetime('now')), UNIQUE(game_slug, user_id));
CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, user1_id TEXT NOT NULL, user2_id TEXT NOT NULL, last_message TEXT, last_msg_at TEXT DEFAULT (datetime('now')), unread_u1 INTEGER DEFAULT 0, unread_u2 INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), UNIQUE(user1_id, user2_id));
CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL, sender_id TEXT NOT NULL, content TEXT NOT NULL, media_url TEXT, media_type TEXT DEFAULT 'text', is_read BOOLEAN DEFAULT 0, is_deleted BOOLEAN DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, reason TEXT NOT NULL, status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')));
`;

if (isLocal()) {
  localDb.exec(SCHEMA);
  console.log(`✅ Banco SQLite pronto: ${DB_PATH}`);
} else {
  console.log('✅ Ambiente: Cloudflare Workers (D1)');
}

// ── Helpers ───────────────────────────────────────────────────────────────
// d1 param pode ser passado (req.d1) ou detectado automaticamente

async function query(sql, params = [], d1) {
  const d = d1 || getD1();
  if (d) {
    const stmt = d.prepare(sql);
    const bound = params.length ? stmt.bind(...params) : stmt;
    const result = await bound.all();
    return result.results || [];
  }
  return localDb.prepare(sql).all(...params);
}

async function queryAll(sql, params = [], d1) {
  return query(sql, params, d1);
}

async function queryOne(sql, params = [], d1) {
  const d = d1 || getD1();
  if (d) {
    const stmt = d.prepare(sql);
    const bound = params.length ? stmt.bind(...params) : stmt;
    const result = await bound.first();
    return result || null;
  }
  return localDb.prepare(sql).get(...params) || null;
}

async function run(sql, params = [], d1) {
  const d = d1 || getD1();
  if (d) {
    const stmt = d.prepare(sql);
    const bound = params.length ? stmt.bind(...params) : stmt;
    const result = await bound.run();
    return { changes: result.meta?.changes || 0, lastInsertRowid: result.meta?.last_row_id || null };
  }
  return localDb.prepare(sql).run(...params);
}

const db = localDb;
module.exports = { db, query, queryAll, queryOne, run };

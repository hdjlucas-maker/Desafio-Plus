-- ============================================================
-- schema-additions.sql
-- Execute APÓS o schema.sql original para adicionar as novas
-- tabelas de configurações de privacidade e notificações
-- ============================================================
-- Comando: wrangler d1 execute desafio-plus-db --local --file=schema-additions.sql
-- OU para SQLite local: sqlite3 desafio-plus.db < schema-additions.sql
-- ============================================================

-- ── CONFIGURAÇÕES DO USUÁRIO (privacidade, notificações) ─────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  show_online      BOOLEAN DEFAULT 1,
  allow_messages   TEXT DEFAULT 'everyone', -- everyone | followers | nobody
  show_activity    BOOLEAN DEFAULT 1,
  email_notifs     BOOLEAN DEFAULT 1,
  push_notifs      BOOLEAN DEFAULT 1,
  updated_at       TEXT DEFAULT (datetime('now'))
);

-- ── COLUNA privacy na tabela users (se não existir) ──────────
-- O schema original já tem privacy TEXT DEFAULT 'public'
-- Esta linha é segura de rodar mesmo se já existir (SQLite ignora)
-- ALTER TABLE users ADD COLUMN privacy TEXT DEFAULT 'public';

-- ── ÍNDICE para bloqueios (se não existir) ───────────────────
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

-- ── COLUNA type na tabela notifications (adicionar 'new_member') ─
-- O schema original já deve ter type TEXT
-- Nenhuma alteração necessária — apenas garantir que o tipo 'new_member' é aceito

-- ── VERIFICAÇÃO: listar tabelas existentes ───────────────────
-- SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- ============================================================
-- DESAFIO+ — Schema SQL completo (Cloudflare D1 / SQLite)
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────
-- USUÁRIOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email         TEXT UNIQUE NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  password_hash TEXT,                        -- NULL para OAuth
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
  privacy       TEXT DEFAULT 'public',       -- public | private
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google   ON users(google_id);

-- ─────────────────────────────────────────
-- BADGES / CONQUISTAS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  rarity      TEXT DEFAULT 'comum',          -- comum | raro | epico | lendario
  xp_reward   INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_badges (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at  TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, badge_id)
);

-- ─────────────────────────────────────────
-- SEGUIDORES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT DEFAULT (datetime('now')),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower  ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- ─────────────────────────────────────────
-- BLOQUEIOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocks (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(blocker_id, blocked_id)
);

-- ─────────────────────────────────────────
-- POSTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  media_urls   TEXT DEFAULT '[]',            -- JSON array de URLs
  media_type   TEXT DEFAULT 'none',          -- none | image | video
  category     TEXT DEFAULT 'geral',         -- geral | solo | a_dois | turma
  challenge_id TEXT REFERENCES challenges(id) ON DELETE SET NULL,
  likes_count  INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_deleted   BOOLEAN DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_user    ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_cat     ON posts(category);

-- ─────────────────────────────────────────
-- CURTIDAS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);

-- ─────────────────────────────────────────
-- COMENTÁRIOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id  TEXT REFERENCES comments(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

-- ─────────────────────────────────────────
-- REAÇÕES (emojis)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reactions (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, post_id, emoji)
);

-- ─────────────────────────────────────────
-- DESAFIOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenges (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  mode        TEXT NOT NULL,                 -- solo | a_dois | turma
  category    TEXT DEFAULT 'geral',
  difficulty  TEXT DEFAULT 'facil',          -- facil | medio | dificil | epico
  xp_reward   INTEGER DEFAULT 50,
  points_reward INTEGER DEFAULT 10,
  rarity      TEXT DEFAULT 'comum',
  is_daily    BOOLEAN DEFAULT 0,
  is_active   BOOLEAN DEFAULT 1,
  ai_generated BOOLEAN DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_challenges_mode   ON challenges(mode);
CREATE INDEX IF NOT EXISTS idx_challenges_daily  ON challenges(is_daily, is_active);

-- ─────────────────────────────────────────
-- COMPLETAR DESAFIOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_completions (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  post_id      TEXT REFERENCES posts(id) ON DELETE SET NULL,
  proof_url    TEXT,
  xp_earned    INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  completed_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, challenge_id, date(completed_at))
);

CREATE INDEX IF NOT EXISTS idx_completions_user ON challenge_completions(user_id);

-- ─────────────────────────────────────────
-- TEMPORADAS / RANKING
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seasons (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name       TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date   TEXT NOT NULL,
  is_active  BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS season_rankings (
  id        TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  season_id TEXT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points    INTEGER DEFAULT 0,
  rank      INTEGER,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(season_id, user_id)
);

-- ─────────────────────────────────────────
-- JOGOS — SESSÕES E PONTUAÇÕES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_sessions (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_slug  TEXT NOT NULL,                  -- jogo-da-velha | quiz | memoria | etc.
  score      INTEGER DEFAULT 0,
  duration   INTEGER DEFAULT 0,              -- segundos
  result     TEXT DEFAULT 'completed',       -- completed | abandoned | won | lost
  metadata   TEXT DEFAULT '{}',             -- JSON extra (nível, perguntas, etc.)
  points_earned INTEGER DEFAULT 0,
  played_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_slug ON game_sessions(game_slug);

CREATE TABLE IF NOT EXISTS game_leaderboard (
  id        TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  game_slug TEXT NOT NULL,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  best_score INTEGER DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(game_slug, user_id)
);

-- ─────────────────────────────────────────
-- MENSAGENS PRIVADAS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user1_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_msg_at  TEXT DEFAULT (datetime('now')),
  unread_u1    INTEGER DEFAULT 0,
  unread_u2    INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now')),
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conv_user2 ON conversations(user2_id);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  media_url       TEXT,
  media_type      TEXT DEFAULT 'text',       -- text | image | emoji
  is_read         BOOLEAN DEFAULT 0,
  is_deleted      BOOLEAN DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at DESC);

-- ─────────────────────────────────────────
-- NOTIFICAÇÕES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,                 -- like | comment | follow | message | challenge | badge
  entity_type TEXT,                          -- post | comment | challenge | badge
  entity_id   TEXT,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notif_user    ON notifications(user_id, is_read, created_at DESC);

-- ─────────────────────────────────────────
-- DENÚNCIAS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,                 -- post | comment | user
  entity_id   TEXT NOT NULL,
  reason      TEXT NOT NULL,
  status      TEXT DEFAULT 'pending',        -- pending | reviewed | resolved
  created_at  TEXT DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────
-- TOKENS DE RECUPERAÇÃO DE SENHA
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used       BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────
-- REFRESH TOKENS (JWT)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  revoked    BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────
-- SEEDS — Badges padrão
-- ─────────────────────────────────────────
INSERT OR IGNORE INTO badges (slug, name, description, icon, rarity, xp_reward) VALUES
  ('primeiro-desafio',  'Primeiro Passo',      'Completou seu primeiro desafio',          '🎯', 'comum',    50),
  ('streak-7',          'Semana Perfeita',      '7 dias consecutivos de desafios',         '🔥', 'raro',    200),
  ('streak-30',         'Mês Imparável',        '30 dias consecutivos de desafios',        '⚡', 'epico',   500),
  ('streak-100',        'Lendário',             '100 dias consecutivos de desafios',       '👑', 'lendario',2000),
  ('social-butterfly',  'Borboleta Social',     'Seguiu 10 pessoas',                       '🦋', 'comum',    30),
  ('influencer',        'Influenciador',        'Ganhou 100 seguidores',                   '⭐', 'raro',    300),
  ('quiz-master',       'Mestre do Quiz',       'Acertou 10 quizzes seguidos',             '🧠', 'raro',    150),
  ('game-champion',     'Campeão dos Jogos',    'Venceu 50 partidas de jogos',             '🏆', 'epico',   400),
  ('desafio-solo',      'Lobo Solitário',       'Completou 10 desafios Solo',              '🐺', 'comum',    80),
  ('desafio-duo',       'Dupla Dinâmica',       'Completou 10 desafios A Dois',            '💑', 'raro',    150),
  ('desafio-turma',     'Alma da Festa',        'Completou 10 desafios em Turma',          '🎉', 'raro',    150),
  ('nivel-10',          'Veterano',             'Atingiu o nível 10',                      '💎', 'epico',   600),
  ('nivel-50',          'Elite',                'Atingiu o nível 50',                      '🌟', 'lendario',3000),
  ('primeiro-post',     'Criador de Conteúdo',  'Publicou seu primeiro post',              '📸', 'comum',    20),
  ('viral',             'Viral',                'Recebeu 100 curtidas em um post',         '🚀', 'epico',   500);

-- ─────────────────────────────────────────
-- SEEDS — Desafios padrão
-- ─────────────────────────────────────────
INSERT OR IGNORE INTO challenges (id, title, description, mode, category, difficulty, xp_reward, points_reward, rarity, is_daily) VALUES
  ('ch-solo-01','Meditação Matinal','Medite por 10 minutos ao acordar e registre como se sentiu','solo','bem-estar','facil',50,10,'comum',1),
  ('ch-solo-02','Diário de Gratidão','Escreva 3 coisas pelas quais é grato hoje e tire foto','solo','autoconhecimento','facil',50,10,'comum',0),
  ('ch-solo-03','Desafio Sem Redes','Fique 4 horas sem redes sociais e registre o que fez','solo','digital-detox','medio',100,20,'raro',0),
  ('ch-solo-04','Novo Hobby','Experimente algo que nunca fez antes e documente','solo','aventura','dificil',200,40,'epico',0),
  ('ch-duo-01','Jantar Surpresa','Prepare uma refeição surpresa para a outra pessoa','a_dois','romance','medio',100,20,'raro',1),
  ('ch-duo-02','Carta Manuscrita','Escreva uma carta de mão para a outra pessoa','a_dois','conexao','facil',60,12,'comum',0),
  ('ch-duo-03','Aventura Juntos','Façam algo que nunca fizeram juntos e registrem','a_dois','aventura','dificil',200,40,'epico',0),
  ('ch-turma-01','Foto em Grupo','Tirem uma foto criativa em grupo em local público','turma','social','facil',50,10,'comum',1),
  ('ch-turma-02','Desafio Culinário','Cada um traz um prato e fazem um jantar coletivo','turma','gastronomia','medio',120,24,'raro',0),
  ('ch-turma-03','Karaokê Surpresa','Cantem uma música juntos em público','turma','coragem','dificil',250,50,'epico',0);

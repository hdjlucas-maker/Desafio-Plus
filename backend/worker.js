/**
 * Desafio+ — worker.js (Cloudflare Workers + Hono)
 * Entry point para deploy no Cloudflare Workers.
 * Adapter Express→Hono para reutilizar controllers sem reescrever.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';

// ── Controllers (mantidos intactos — usam padrão Express req/res) ─────────
import * as authCtrl from './controllers/authController.js';
import * as usersCtrl from './controllers/usersController.js';
import * as postsCtrl from './controllers/postsController.js';
import * as challengesCtrl from './controllers/challengesController.js';
import * as gamesCtrl from './controllers/gamesController.js';
import * as chatCtrl from './controllers/chatController.js';
import * as notifCtrl from './controllers/notificationsController.js';

// ── Models (para rotas inline) ─────────────────────────────────────────────
import * as postModel from './models/postModel.js';

// ── DB helpers ─────────────────────────────────────────────────────────────
import { queryOne, queryAll, run } from './config/db.js';

// ── Express → Hono Adapter ─────────────────────────────────────────────────
function toHono(handler) {
  return async (c) => {
    try {
      let _status = 200;
      let _body = null;
      let _sent = false;

      const res = {
        status(s) { _status = s; return this; },
        json(body) { _body = body; _sent = true; },
        send(body) { _body = body; _sent = true; },
      };

      // Parse body eagerly
      let parsedBody = {};
      try { parsedBody = await c.req.json(); } catch { parsedBody = {}; }

      const req = {
        get user() { return c.get('user') || null; },
        set user(v) { c.set('user', v); },
        get d1() { return c.get('d1') || c.env.DB || null; },
        set d1(v) { c.set('d1', v); },
        get params() { return c.req.param(); },
        get headers() { return Object.fromEntries(c.req.raw.headers); },
        body: parsedBody,
        query: Object.fromEntries(new URL(c.req.url).searchParams),
      };

      const next = () => {};
      await handler(req, res, next);

      if (_sent) return c.json(_body, _status);
      return c.json({ error: 'No response sent' }, 501);
    } catch (err) {
      console.error('[TO_HONO_ERROR]', err.message);
      return c.json({ error: err.message || 'Internal Server Error' }, err.status || 500);
    }
  };
}

// ── Middleware Adapter ──────────────────────────────────────────────────────
function honoMiddleware(expressMiddleware) {
  return async (c, next) => {
    let _status = 200;
    let _body = null;
    let _sent = false;

    const res = {
      status(s) { _status = s; return this; },
      json(body) { _body = body; _sent = true; },
      send(body) { _body = body; _sent = true; },
    };

    let parsedBody = undefined;
    const contentType = c.req.header('content-type') || '';
    if (contentType.includes('application/json')) {
      try { parsedBody = await c.req.json().catch(() => ({})); } catch { parsedBody = {}; }
    }

    const req = {
      get user() { return c.get('user') || null; },
      set user(v) { c.set('user', v); },
      get d1() { return c.get('d1') || null; },
      set d1(v) { c.set('d1', v); },
      get params() { return c.req.param(); },
      get query() { return Object.fromEntries(new URL(c.req.url).searchParams); },
      get body() { return parsedBody; },
      set body(v) { parsedBody = v; },
      get headers() { return Object.fromEntries(c.req.raw.headers); },
    };

    let _nextCalled = false;
    const nextFn = () => { _nextCalled = true; };

    try {
      await expressMiddleware(req, res, nextFn);
    } catch (err) {
      if (!_sent) {
        return c.json({ error: err.message || 'Middleware error' }, err.status || 500);
      }
    }

    if (_sent) return c.json(_body, _status);
    if (!_nextCalled) return c.json({ error: 'Auth failed' }, 401);

    // Pass req.user de volta ao Hono context
    if (req.user) c.set('user', req.user);
    if (req.d1) c.set('d1', req.d1);

    await next();
  };
}

// ── Auth Middleware (simplified for Hono) ───────────────────────────────────
import { requireAuth, optionalAuth } from './middleware/auth.js';

// ── App Hono ───────────────────────────────────────────────────────────────
const app = new Hono();

// CORS
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://desafio-plus.pages.dev'],
  credentials: true,
}));

// D1 injection middleware
app.use('*', async (c, next) => {
  if (c.env?.DB) {
    c.set('d1', c.env.DB);
    // Controllers importam query/run do db.js e precisam de globalThis.__CF_ENV__
    globalThis.__CF_ENV__ = c.env;
  }
  await next();
});

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', runtime: 'cloudflare-workers' }));

// ── Auth Routes ────────────────────────────────────────────────────────────
app.post('/api/auth/register', toHono(authCtrl.register));
app.post('/api/auth/login', toHono(authCtrl.login));
app.post('/api/auth/refresh', toHono(authCtrl.refreshToken));
app.post('/api/auth/logout', toHono(authCtrl.logout));
app.post('/api/auth/forgot-password', toHono(authCtrl.forgotPassword));
app.post('/api/auth/reset-password', toHono(authCtrl.resetPassword));
app.get('/api/auth/me', honoMiddleware(requireAuth), toHono(authCtrl.me));

// ── Users Routes ───────────────────────────────────────────────────────────
app.get('/api/users/suggestions', honoMiddleware(requireAuth), toHono(usersCtrl.getSuggestions));
app.get('/api/users/ranking', honoMiddleware(optionalAuth), toHono(usersCtrl.getRanking));
app.put('/api/users/me/profile', honoMiddleware(requireAuth), toHono(usersCtrl.updateProfile));
app.get('/api/users/:username', honoMiddleware(optionalAuth), toHono(usersCtrl.getProfile));
app.get('/api/users/:username/posts', honoMiddleware(optionalAuth), toHono(usersCtrl.getUserPosts));
app.post('/api/users/:username/follow', honoMiddleware(requireAuth), toHono(usersCtrl.followUser));
app.get('/api/users/:username/followers', honoMiddleware(optionalAuth), toHono(usersCtrl.getFollowers));
app.get('/api/users/:username/following', honoMiddleware(optionalAuth), toHono(usersCtrl.getFollowing));
app.post('/api/users/:username/block', honoMiddleware(requireAuth), toHono(usersCtrl.blockUser));

// ── Posts Routes ───────────────────────────────────────────────────────────
app.post('/api/posts', honoMiddleware(requireAuth), toHono(postsCtrl.createPost));
app.get('/api/posts/:id', honoMiddleware(optionalAuth), toHono(postsCtrl.getPost));
app.put('/api/posts/:id', honoMiddleware(requireAuth), toHono(postsCtrl.updatePost));
app.delete('/api/posts/:id', honoMiddleware(requireAuth), toHono(postsCtrl.deletePost));
app.post('/api/posts/:id/like', honoMiddleware(requireAuth), toHono(postsCtrl.likePost));
app.get('/api/posts/:id/comments', honoMiddleware(optionalAuth), toHono(postsCtrl.getComments));
app.post('/api/posts/:id/comments', honoMiddleware(requireAuth), toHono(postsCtrl.addComment));
app.delete('/api/posts/:id/comments/:commentId', honoMiddleware(requireAuth), toHono(postsCtrl.deleteComment));

// ── Feed Routes ────────────────────────────────────────────────────────────
app.get('/api/feed', honoMiddleware(requireAuth), toHono(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const posts = await postModel.getFeedPosts(req.user.id, parseInt(limit), parseInt(offset), req.d1);
  res.json(posts);
}));
app.get('/api/feed/explore', honoMiddleware(optionalAuth), toHono(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const posts = await postModel.getExplorePosts(req.user?.id, parseInt(limit), parseInt(offset), req.d1);
  res.json(posts);
}));

// ── Upload R2 (Workers) ─────────────────────────────────────────────────────
app.post('/api/upload', honoMiddleware(requireAuth), async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'uploads';
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'];
    if (!file || typeof file === 'string') return c.json({ error: 'Arquivo não enviado' }, 400);

    const ext = file.type.split('/')[1] || 'bin';
    const key = `${folder}/${crypto.randomUUID()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());

    await c.env.MEDIA_BUCKET.put(key, buf, {
      httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000' },
    });

    return c.json({ success: true, key, url: `/api/media/${key}`, type: file.type, size: buf.length });
  } catch (err) {
    console.error('[UPLOAD]', err);
    return c.json({ error: 'Erro ao enviar arquivo' }, 500);
  }
});

app.get('/api/media/:key', async (c) => {
  const key = c.req.param('key');
  const obj = await c.env.MEDIA_BUCKET.get(key);
  if (!obj) return c.json({ error: 'Arquivo não encontrado' }, 404);
  const headers = new Headers();
  headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', obj.httpMetadata?.cacheControl || 'public, max-age=31536000');
  return c.newResponse(obj.body, { headers });
});

app.delete('/api/media/:key', honoMiddleware(requireAuth), async (c) => {
  const key = c.req.param('key');
  await c.env.MEDIA_BUCKET.delete(key);
  return c.json({ success: true });
});

// ── Challenges Routes ──────────────────────────────────────────────────────
app.get('/api/challenges/daily', honoMiddleware(requireAuth), toHono(challengesCtrl.getDailyChallenges));
app.get('/api/challenges', honoMiddleware(requireAuth), toHono(challengesCtrl.getAllChallenges));
app.post('/api/challenges/complete', honoMiddleware(requireAuth), toHono(challengesCtrl.completeChallenge));
app.get('/api/challenges/my-history', honoMiddleware(requireAuth), toHono(challengesCtrl.getUserCompletions));
app.post('/api/challenges/ai-generate', honoMiddleware(requireAuth), toHono(challengesCtrl.generateAIChallenges));
app.get('/api/challenges/:id/tip', honoMiddleware(requireAuth), toHono(challengesCtrl.getChallengeTip));

// ── Games Routes ───────────────────────────────────────────────────────────
app.post('/api/games/session', honoMiddleware(requireAuth), toHono(gamesCtrl.recordSession));
app.get('/api/games/leaderboard', toHono(gamesCtrl.getLeaderboard));
app.get('/api/games/my-history', honoMiddleware(requireAuth), toHono(gamesCtrl.getUserGameHistory));
app.get('/api/games/my-stats', honoMiddleware(requireAuth), toHono(gamesCtrl.getGameStats));

// ── Chat Routes ────────────────────────────────────────────────────────────
app.get('/api/chat', honoMiddleware(requireAuth), toHono(chatCtrl.getConversations));
app.get('/api/chat/with/:username', honoMiddleware(requireAuth), toHono(chatCtrl.getOrCreateConversation));
app.get('/api/chat/:id/messages', honoMiddleware(requireAuth), toHono(chatCtrl.getMessages));
app.post('/api/chat/:id/messages', honoMiddleware(requireAuth), toHono(chatCtrl.sendMessage));

// ── Notifications Routes ───────────────────────────────────────────────────
app.get('/api/notifications', honoMiddleware(requireAuth), toHono(notifCtrl.getNotifications));
app.get('/api/notifications/unread-count', honoMiddleware(requireAuth), toHono(notifCtrl.getUnreadCount));
app.post('/api/notifications/mark-all-read', honoMiddleware(requireAuth), toHono(notifCtrl.markAllRead));
app.patch('/api/notifications/:id/read', honoMiddleware(requireAuth), toHono(notifCtrl.markRead));

// ── Search ─────────────────────────────────────────────────────────────────
app.get('/api/search', honoMiddleware(optionalAuth), toHono(async (req, res) => {
  const { q, limit = 20, offset = 0 } = req.query;
  if (!q || !q.trim()) return res.json([]);

  const term = `%${q.trim()}%`;
  const users = await queryAll(
    `SELECT id, username, display_name, avatar_url, level FROM users
     WHERE (username LIKE ? OR display_name LIKE ?) AND is_banned = 0
     LIMIT ? OFFSET ?`,
    [term, term, parseInt(limit), parseInt(offset)],
    req.d1
  );

  const posts = await queryAll(
    `SELECT p.*, u.username, u.display_name, u.avatar_url
     FROM posts p JOIN users u ON p.user_id = u.id
     WHERE p.content LIKE ? AND p.is_deleted = 0
     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [term, parseInt(limit), parseInt(offset)],
    req.d1
  );

  res.json({ users, posts });
}));

// ── Blocks / Privacy ───────────────────────────────────────────────────────
app.post('/api/blocks/:id/block', honoMiddleware(requireAuth), toHono(async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: 'Não pode bloquear a si mesmo' });

  const existing = await queryOne(
    'SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
    [req.user.id, id], req.d1
  );

  if (existing) {
    await run('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?', [req.user.id, id], req.d1);
    return res.json({ blocked: false });
  }

  await run('INSERT INTO blocks (id, blocker_id, blocked_id) VALUES (?, ?, ?)',
    [crypto.randomUUID(), req.user.id, id], req.d1);
  await run('DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)',
    [req.user.id, id, id, req.user.id], req.d1);
  res.json({ blocked: true });
}));

app.get('/api/blocks/blocked', honoMiddleware(requireAuth), toHono(async (req, res) => {
  const blocked = await queryAll(
    `SELECT u.id, u.username, u.display_name, u.avatar_url
     FROM blocks b JOIN users u ON b.blocked_id = u.id
     WHERE b.blocker_id = ? ORDER BY b.created_at DESC`,
    [req.user.id], req.d1
  );
  res.json(blocked);
}));

app.get('/api/blocks/privacy', honoMiddleware(requireAuth), toHono(async (req, res) => {
  let settings = await queryOne('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id], req.d1);
  if (!settings) {
    await run('INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)', [req.user.id], req.d1);
    settings = { user_id: req.user.id, profile_hidden: 0, notifications_on: 1 };
  }
  res.json(settings);
}));

app.put('/api/blocks/privacy', honoMiddleware(requireAuth), toHono(async (req, res) => {
  const { profile_hidden, notifications_on } = req.body;
  await run('INSERT OR REPLACE INTO user_settings (user_id, profile_hidden, notifications_on, updated_at) VALUES (?, ?, ?, datetime("now"))',
    [req.user.id, profile_hidden ? 1 : 0, notifications_on !== false ? 1 : 0], req.d1);
  res.json({ message: 'Configurações atualizadas' });
}));

// ── Reports ────────────────────────────────────────────────────────────────
app.post('/api/reports', honoMiddleware(requireAuth), toHono(async (req, res) => {
  const { entity_type, entity_id, reason } = req.body;
  if (!entity_type || !entity_id || !reason) return res.status(400).json({ error: 'Campos obrigatórios: entity_type, entity_id, reason' });

  await run(
    'INSERT INTO reports (id, reporter_id, entity_type, entity_id, reason) VALUES (?, ?, ?, ?, ?)',
    [crypto.randomUUID(), req.user.id, entity_type, entity_id, reason], req.d1
  );
  res.json({ message: 'Denúncia enviada com sucesso' });
}));

// ── Presence ───────────────────────────────────────────────────────────────
app.post('/api/presence/heartbeat', honoMiddleware(requireAuth), toHono(async (req, res) => {
  const { state } = req.body;
  await run(
    'INSERT OR REPLACE INTO user_presence (user_id, last_seen, state, is_online) VALUES (?, datetime("now"), ?, 1)',
    [req.user.id, state || ''], req.d1
  );
  res.json({ ok: true });
}));

app.get('/api/presence/online', honoMiddleware(requireAuth), toHono(async (req, res) => {
  const online = await queryAll(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, p.last_seen, p.state
     FROM user_presence p
     JOIN users u ON u.id = p.user_id
     WHERE p.is_online = 1
       AND datetime(p.last_seen) > datetime('now', '-60 seconds')
       AND u.id != ?
       AND u.is_banned = 0
     ORDER BY p.last_seen DESC`,
    [req.user.id], req.d1
  );
  res.json(online);
}));

app.get('/api/presence/nearby', honoMiddleware(requireAuth), toHono(async (req, res) => {
  const me = await queryOne('SELECT state FROM user_presence WHERE user_id = ?', [req.user.id], req.d1);
  const myState = me?.state || '';
  if (!myState) return res.json([]);

  const nearby = await queryAll(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, p.last_seen, p.state
     FROM user_presence p
     JOIN users u ON u.id = p.user_id
     WHERE p.is_online = 1
       AND p.state = ?
       AND u.id != ?
       AND u.is_banned = 0
     ORDER BY p.last_seen DESC
     LIMIT 20`,
    [myState, req.user.id], req.d1
  );
  res.json(nearby);
}));

// ── Suggestions ────────────────────────────────────────────────────────────
app.get('/api/suggestions/nearby', honoMiddleware(requireAuth), toHono(async (req, res) => {
  const me = await queryOne('SELECT display_name FROM users WHERE id = ?', [req.user.id], req.d1);
  const myState = me?.display_name?.split(' - ')[1] || '';
  if (!myState) return res.json([]);

  const blocked = await queryAll('SELECT blocked_id FROM blocks WHERE blocker_id = ?', [req.user.id], req.d1);
  const blockedIds = blocked.map(b => b.blocked_id);

  let suggestions = await queryAll(
    `SELECT id, username, display_name, avatar_url, level, points
     FROM users WHERE display_name LIKE ? AND id != ? AND is_banned = 0
     ORDER BY points DESC LIMIT 10`,
    [`%${myState}%`, req.user.id], req.d1
  );

  if (blockedIds.length) suggestions = suggestions.filter(s => !blockedIds.includes(s.id));
  res.json(suggestions);
}));

app.get('/api/suggestions/online', honoMiddleware(requireAuth), toHono(async (req, res) => {
  const blocked = await queryAll('SELECT blocked_id FROM blocks WHERE blocker_id = ?', [req.user.id], req.d1);
  const blockedIds = blocked.map(b => b.blocked_id);

  let online = await queryAll(
    `SELECT u.id, u.username, u.display_name, u.avatar_url, u.level
     FROM user_presence p JOIN users u ON p.user_id = u.id
     WHERE p.is_online = 1 AND u.id != ? AND u.is_banned = 0
     ORDER BY p.last_seen DESC LIMIT 10`,
    [req.user.id], req.d1
  );

  if (blockedIds.length) online = online.filter(u => !blockedIds.includes(u.id));
  res.json(online);
}));

// ── 404 ────────────────────────────────────────────────────────────────────
app.all('*', (c) => c.json({ error: 'Rota não encontrada' }, 404));

export default app;

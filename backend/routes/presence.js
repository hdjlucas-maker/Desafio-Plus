// ============================================================
// presence.js — Sistema de presença online
// Tabela: user_presence (criada no db.js)
// ============================================================
const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const { queryAll, queryOne, run } = require('../config/db');

// POST /api/presence/heartbeat — usuário envia a cada 30s
router.post('/heartbeat', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { state = '' } = req.body; // ex: "SP", "RJ"

  try {
    await run(
      `INSERT INTO user_presence (user_id, last_seen, state, is_online)
       VALUES (?, datetime('now'), ?, 1)
       ON CONFLICT(user_id) DO UPDATE SET
         last_seen = datetime('now'),
         state     = excluded.state,
         is_online = 1`,
      [userId, state]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[Presence] heartbeat error:', err);
    res.status(500).json({ error: 'Erro ao registrar presença.' });
  }
});

// GET /api/presence/online — lista usuários online (últimos 60s)
// Retorna apenas username e avatar — NUNCA nome real
router.get('/online', requireAuth, async (req, res) => {
  const myId = req.user.id;

  try {
    const users = await queryAll(
      `SELECT u.id, u.username, u.avatar_url, p.state
       FROM user_presence p
       JOIN users u ON u.id = p.user_id
       WHERE p.last_seen >= datetime('now', '-60 seconds')
         AND p.is_online = 1
         AND u.is_banned = 0
         AND u.id != ?
       ORDER BY p.last_seen DESC
       LIMIT 50`,
      [myId]
    );

    res.json({ online: users, count: users.length });
  } catch (err) {
    console.error('[Presence] online error:', err);
    res.status(500).json({ error: 'Erro ao buscar usuários online.' });
  }
});

// GET /api/presence/nearby — usuários online do mesmo estado
router.get('/nearby', requireAuth, async (req, res) => {
  const myId = req.user.id;

  try {
    // Busca o estado do usuário atual
    const me = await queryOne(
      'SELECT state FROM user_presence WHERE user_id = ?',
      [myId]
    );

    const myState = me?.state || '';

    let users;
    if (myState) {
      users = await queryAll(
        `SELECT u.id, u.username, u.avatar_url, p.state
         FROM user_presence p
         JOIN users u ON u.id = p.user_id
         WHERE p.last_seen >= datetime('now', '-60 seconds')
           AND p.is_online = 1
           AND p.state = ?
           AND u.is_banned = 0
           AND u.id != ?
         ORDER BY p.last_seen DESC
         LIMIT 20`,
        [myState, myId]
      );
    } else {
      // Sem estado definido — retorna qualquer online
      users = await queryAll(
        `SELECT u.id, u.username, u.avatar_url, p.state
         FROM user_presence p
         JOIN users u ON u.id = p.user_id
         WHERE p.last_seen >= datetime('now', '-60 seconds')
           AND p.is_online = 1
           AND u.is_banned = 0
           AND u.id != ?
         ORDER BY p.last_seen DESC
         LIMIT 20`,
        [myId]
      );
    }

    res.json({ nearby: users, myState });
  } catch (err) {
    console.error('[Presence] nearby error:', err);
    res.status(500).json({ error: 'Erro ao buscar usuários próximos.' });
  }
});

module.exports = router;

// ============================================================
// suggestions.js — Sugestões inteligentes de pessoas
// Prioriza: mesmo estado > qualquer online
// Retorna apenas username e avatar — NUNCA nome real
// ============================================================
const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const { queryAll, queryOne } = require('../config/db');

// GET /api/suggestions/nearby — pessoas da mesma região
router.get('/nearby', requireAuth, async (req, res) => {
  const myId = req.user.id;

  try {
    const me = await queryOne(
      'SELECT state FROM user_presence WHERE user_id = ?',
      [myId]
    );
    const myState = me?.state || '';

    let nearby = [];

    if (myState) {
      // Mesmo estado, online nos últimos 5 minutos, não seguidos ainda
      nearby = await queryAll(
        `SELECT u.id, u.username, u.avatar_url, p.state,
                p.last_seen,
                CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END AS already_following
         FROM user_presence p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN follows f ON f.follower_id = ? AND f.following_id = u.id
         LEFT JOIN blocks b ON (b.blocker_id = ? AND b.blocked_id = u.id)
                             OR (b.blocker_id = u.id AND b.blocked_id = ?)
         WHERE p.state = ?
           AND u.is_banned = 0
           AND u.id != ?
           AND b.id IS NULL
         ORDER BY p.last_seen DESC
         LIMIT 20`,
        [myId, myId, myId, myState, myId]
      );
    }

    // Complementa com online recentes se tiver menos de 5 resultados
    if (nearby.length < 5) {
      const extra = await queryAll(
        `SELECT u.id, u.username, u.avatar_url, p.state, p.last_seen,
                CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END AS already_following
         FROM user_presence p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN follows f ON f.follower_id = ? AND f.following_id = u.id
         LEFT JOIN blocks b ON (b.blocker_id = ? AND b.blocked_id = u.id)
                             OR (b.blocker_id = u.id AND b.blocked_id = ?)
         WHERE p.last_seen >= datetime('now', '-5 minutes')
           AND u.is_banned = 0
           AND u.id != ?
           AND b.id IS NULL
         ORDER BY p.last_seen DESC
         LIMIT 10`,
        [myId, myId, myId, myId]
      );

      // Adiciona apenas os que não estão já na lista
      const existingIds = new Set(nearby.map(u => u.id));
      for (const u of extra) {
        if (!existingIds.has(u.id)) nearby.push(u);
      }
    }

    res.json({ suggestions: nearby.slice(0, 20), myState });
  } catch (err) {
    console.error('[Suggestions] nearby error:', err);
    res.status(500).json({ error: 'Erro ao buscar sugestões.' });
  }
});

// GET /api/suggestions/online — pessoas online agora para jogar
router.get('/online', requireAuth, async (req, res) => {
  const myId = req.user.id;

  try {
    const online = await queryAll(
      `SELECT u.id, u.username, u.avatar_url, p.state, p.last_seen,
              CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END AS already_following
       FROM user_presence p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN follows f ON f.follower_id = ? AND f.following_id = u.id
       LEFT JOIN blocks b ON (b.blocker_id = ? AND b.blocked_id = u.id)
                           OR (b.blocker_id = u.id AND b.blocked_id = ?)
       WHERE p.last_seen >= datetime('now', '-60 seconds')
         AND p.is_online = 1
         AND u.is_banned = 0
         AND u.id != ?
         AND b.id IS NULL
       ORDER BY p.last_seen DESC
       LIMIT 20`,
      [myId, myId, myId, myId]
    );

    res.json({ online });
  } catch (err) {
    console.error('[Suggestions] online error:', err);
    res.status(500).json({ error: 'Erro ao buscar usuários online.' });
  }
});

module.exports = router;

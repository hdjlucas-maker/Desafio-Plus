// ============================================================
// search.js — Rota de busca de usuários e posts
// Usa better-sqlite3 local via queryAll do db.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { queryAll } = require('../config/db');
const { optionalAuth } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');

// GET /api/search?q=termo&type=all|users|posts&limit=10
router.get('/', searchLimiter, optionalAuth, async (req, res) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Busca muito curta (mínimo 2 caracteres).' });
    }

    const term = `%${q.trim()}%`;
    const lim  = Math.min(parseInt(limit, 10) || 10, 50);
    const result = {};

    if (type === 'all' || type === 'users') {
      result.users = await queryAll(
        `SELECT id, username, display_name, avatar_url, level, xp
         FROM users
         WHERE (username LIKE ? OR display_name LIKE ?) AND is_banned = 0
         LIMIT ?`,
        [term, term, lim]
      );
    }

    if (type === 'all' || type === 'posts') {
      result.posts = await queryAll(
        `SELECT p.id, p.content, p.likes_count, p.created_at,
                u.username, u.display_name, u.avatar_url
         FROM posts p
         JOIN users u ON u.id = p.user_id
         WHERE p.content LIKE ? AND p.is_deleted = 0
         ORDER BY p.likes_count DESC
         LIMIT ?`,
        [term, lim]
      );
    }

    res.json(result);
  } catch (err) {
    console.error('[Search] Erro:', err);
    res.status(500).json({ error: 'Erro na busca.' });
  }
});

module.exports = router;

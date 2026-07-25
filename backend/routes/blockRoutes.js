// ============================================================
// blockRoutes.js — Rotas de bloqueio e privacidade
// Reescrito para usar better-sqlite3 local (não Cloudflare D1)
// ============================================================
const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const { queryOne, query, run } = require('../config/db');

// Todas as rotas requerem autenticação
router.use(requireAuth);

// ── POST /api/users/:id/block — bloquear usuário ──────────────────────────
router.post('/:id/block', async (req, res) => {
  const blockerId = req.user.id;
  const blockedId = req.params.id;

  try {
    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'Você não pode bloquear a si mesmo.' });
    }

    const target = await queryOne(
      'SELECT id, username FROM users WHERE id = ?',
      [blockedId]
    );
    if (!target) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const existing = await queryOne(
      'SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, blockedId]
    );
    if (existing) return res.status(409).json({ error: 'Usuário já está bloqueado.' });

    await run(
      `INSERT INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, datetime('now'))`,
      [blockerId, blockedId]
    );

    // Remove follow mútuo ao bloquear
    await run(
      'DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)',
      [blockerId, blockedId, blockedId, blockerId]
    );

    return res.json({
      success: true,
      message: `@${target.username} foi bloqueado.`,
    });
  } catch (err) {
    console.error('[Block] Erro ao bloquear:', err);
    return res.status(500).json({ error: 'Erro interno ao bloquear usuário.' });
  }
});

// ── DELETE /api/users/:id/block — desbloquear usuário ────────────────────
router.delete('/:id/block', async (req, res) => {
  const blockerId = req.user.id;
  const blockedId = req.params.id;

  try {
    const result = await run(
      'DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, blockedId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Este usuário não estava bloqueado.' });
    }

    return res.json({ success: true, message: 'Usuário desbloqueado com sucesso.' });
  } catch (err) {
    console.error('[Block] Erro ao desbloquear:', err);
    return res.status(500).json({ error: 'Erro interno ao desbloquear.' });
  }
});

// ── GET /api/users/blocked — lista de usuários bloqueados ────────────────
router.get('/blocked', async (req, res) => {
  const userId = req.user.id;

  try {
    const blocked = await query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, b.created_at AS blocked_at
       FROM blocks b
       JOIN users u ON u.id = b.blocked_id
       WHERE b.blocker_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return res.json({ blocked });
  } catch (err) {
    console.error('[Block] Erro ao listar bloqueados:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── GET /api/users/privacy — buscar configurações de privacidade ──────────
router.get('/privacy', async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await queryOne('SELECT privacy FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    return res.json({ privacy: user.privacy || 'public' });
  } catch (err) {
    console.error('[Privacy] Erro ao buscar privacidade:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// ── PUT /api/users/privacy — atualizar configurações de privacidade ───────
router.put('/privacy', async (req, res) => {
  const userId = req.user.id;
  const { privacy } = req.body;

  try {
    if (privacy && !['public', 'private'].includes(privacy)) {
      return res.status(400).json({ error: 'Valor inválido. Use "public" ou "private".' });
    }

    await run(
      `UPDATE users SET privacy = ?, updated_at = datetime('now') WHERE id = ?`,
      [privacy || 'public', userId]
    );

    return res.json({ success: true, message: 'Privacidade atualizada!' });
  } catch (err) {
    console.error('[Privacy] Erro ao atualizar privacidade:', err);
    return res.status(500).json({ error: 'Erro interno ao salvar configurações.' });
  }
});

module.exports = router;

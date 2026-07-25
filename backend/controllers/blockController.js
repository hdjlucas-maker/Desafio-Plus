// ============================================================
// blockController.js — Sistema de Bloqueio e Privacidade
// Rotas:
//   POST   /api/users/:id/block      → bloquear usuário
//   DELETE /api/users/:id/block      → desbloquear usuário
//   GET    /api/users/blocked        → lista de bloqueados
//   PUT    /api/users/privacy        → atualizar configurações de privacidade
//   GET    /api/users/privacy        → buscar configurações de privacidade
// ============================================================
const { v4: uuidv4 } = require('uuid');

// ── BLOQUEAR usuário ──────────────────────────────────────────
const blockUser = async (req, res) => {
  const db = req.db;
  const blockerId = req.userId;          // quem está bloqueando (logado)
  const blockedId = req.params.id;       // quem vai ser bloqueado

  try {
    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'Você não pode bloquear a si mesmo.' });
    }

    // Verifica se o usuário alvo existe
    const target = await db
      .prepare('SELECT id, username, display_name FROM users WHERE id = ?')
      .bind(blockedId)
      .first();

    if (!target) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Verifica se já está bloqueado
    const existing = await db
      .prepare('SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?')
      .bind(blockerId, blockedId)
      .first();

    if (existing) {
      return res.status(409).json({ error: 'Usuário já está bloqueado.' });
    }

    // Insere o bloqueio
    await db
      .prepare(`
        INSERT INTO blocks (id, blocker_id, blocked_id, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `)
      .bind(uuidv4(), blockerId, blockedId)
      .run();

    // Remove o follow mútuo (se existir) ao bloquear
    await db
      .prepare('DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)')
      .bind(blockerId, blockedId, blockedId, blockerId)
      .run();

    return res.json({
      success: true,
      message: `@${target.username} foi bloqueado. Ele não poderá ver seu perfil ou interagir com você.`,
    });
  } catch (err) {
    console.error('[Block] Erro ao bloquear:', err);
    return res.status(500).json({ error: 'Erro interno ao bloquear usuário.' });
  }
};

// ── DESBLOQUEAR usuário ───────────────────────────────────────
const unblockUser = async (req, res) => {
  const db = req.db;
  const blockerId = req.userId;
  const blockedId = req.params.id;

  try {
    const result = await db
      .prepare('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?')
      .bind(blockerId, blockedId)
      .run();

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Este usuário não estava bloqueado.' });
    }

    return res.json({ success: true, message: 'Usuário desbloqueado com sucesso.' });
  } catch (err) {
    console.error('[Block] Erro ao desbloquear:', err);
    return res.status(500).json({ error: 'Erro interno ao desbloquear.' });
  }
};

// ── LISTA DE BLOQUEADOS ───────────────────────────────────────
const getBlockedUsers = async (req, res) => {
  const db = req.db;
  const userId = req.userId;

  try {
    const blocked = await db
      .prepare(`
        SELECT u.id, u.username, u.display_name, u.avatar_url, b.created_at as blocked_at
        FROM blocks b
        JOIN users u ON u.id = b.blocked_id
        WHERE b.blocker_id = ?
        ORDER BY b.created_at DESC
      `)
      .bind(userId)
      .all();

    return res.json({ blocked: blocked.results || [] });
  } catch (err) {
    console.error('[Block] Erro ao listar bloqueados:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

// ── VERIFICAR se um usuário está bloqueado ────────────────────
// Middleware helper — pode ser usado em outras rotas
const isBlocked = async (db, userId, targetId) => {
  const block = await db
    .prepare('SELECT id FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)')
    .bind(userId, targetId, targetId, userId)
    .first();
  return !!block;
};

// ── CONFIGURAÇÕES DE PRIVACIDADE ──────────────────────────────
const updatePrivacy = async (req, res) => {
  const db = req.db;
  const userId = req.userId;

  try {
    const {
      privacy,           // 'public' | 'private'
      show_online,       // boolean
      allow_messages,    // 'everyone' | 'followers' | 'nobody'
      show_activity,     // boolean
    } = req.body;

    // Valida privacy
    if (privacy && !['public', 'private'].includes(privacy)) {
      return res.status(400).json({ error: 'Valor de privacidade inválido. Use "public" ou "private".' });
    }

    if (allow_messages && !['everyone', 'followers', 'nobody'].includes(allow_messages)) {
      return res.status(400).json({ error: 'Valor de allow_messages inválido.' });
    }

    // Atualiza na tabela users (campos que já existem no schema)
    const updates = [];
    const values = [];

    if (privacy !== undefined) {
      updates.push('privacy = ?');
      values.push(privacy);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhuma configuração para atualizar.' });
    }

    updates.push("updated_at = datetime('now')");
    values.push(userId);

    await db
      .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    // Salva configurações extras na tabela user_settings (se existir)
    // Tenta inserir/atualizar — ignora erro se tabela não existir ainda
    try {
      await db
        .prepare(`
          INSERT INTO user_settings (user_id, show_online, allow_messages, show_activity, updated_at)
          VALUES (?, ?, ?, ?, datetime('now'))
          ON CONFLICT(user_id) DO UPDATE SET
            show_online = excluded.show_online,
            allow_messages = excluded.allow_messages,
            show_activity = excluded.show_activity,
            updated_at = excluded.updated_at
        `)
        .bind(
          userId,
          show_online !== undefined ? (show_online ? 1 : 0) : 1,
          allow_messages || 'everyone',
          show_activity !== undefined ? (show_activity ? 1 : 0) : 1
        )
        .run();
    } catch (_) {
      // Tabela user_settings pode não existir — não bloqueia
    }

    return res.json({ success: true, message: 'Configurações de privacidade atualizadas!' });
  } catch (err) {
    console.error('[Privacy] Erro ao atualizar privacidade:', err);
    return res.status(500).json({ error: 'Erro interno ao salvar configurações.' });
  }
};

// ── BUSCAR configurações de privacidade ───────────────────────
const getPrivacy = async (req, res) => {
  const db = req.db;
  const userId = req.userId;

  try {
    const user = await db
      .prepare('SELECT privacy FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    // Tenta buscar configurações extras
    let settings = { show_online: true, allow_messages: 'everyone', show_activity: true };
    try {
      const s = await db
        .prepare('SELECT * FROM user_settings WHERE user_id = ?')
        .bind(userId)
        .first();
      if (s) {
        settings = {
          show_online: !!s.show_online,
          allow_messages: s.allow_messages,
          show_activity: !!s.show_activity,
        };
      }
    } catch (_) {}

    return res.json({
      privacy: user.privacy || 'public',
      ...settings,
    });
  } catch (err) {
    console.error('[Privacy] Erro ao buscar privacidade:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = {
  blockUser,
  unblockUser,
  getBlockedUsers,
  updatePrivacy,
  getPrivacy,
  isBlocked,
};

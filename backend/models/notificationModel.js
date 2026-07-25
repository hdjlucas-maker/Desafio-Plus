/**
 * Desafio+ — Notification Model
 */

const { query, queryOne, run } = require('../config/db');
const crypto = require('crypto');

async function create({ user_id, actor_id, type, entity_type, entity_id, message }, d1 = null) {
  // Não notifica a si mesmo
  if (user_id === actor_id) return null;
  const id = crypto.randomUUID();
  await run(
    'INSERT INTO notifications (id, user_id, actor_id, type, entity_type, entity_id, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, user_id, actor_id, type, entity_type, entity_id, message],
    d1
  );
  return id;
}

async function getForUser(userId, limit = 30, offset = 0, d1 = null) {
  return query(
    `SELECT n.*, u.username AS actor_username, u.display_name AS actor_name, u.avatar_url AS actor_avatar
     FROM notifications n
     LEFT JOIN users u ON u.id = n.actor_id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset],
    d1
  );
}

async function getUnreadCount(userId, d1 = null) {
  const row = await queryOne('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0', [userId], d1);
  return row?.count || 0;
}

async function markAllRead(userId, d1 = null) {
  return run('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId], d1);
}

async function markRead(id, userId, d1 = null) {
  return run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId], d1);
}

module.exports = { create, getForUser, getUnreadCount, markAllRead, markRead };

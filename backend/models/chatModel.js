/**
 * Desafio+ — Chat Model
 */

const { query, queryOne, run } = require('../config/db');
const crypto = require('crypto');

async function getOrCreateConversation(user1Id, user2Id, d1 = null) {
  const [a, b] = [user1Id, user2Id].sort();
  let conv = await queryOne(
    'SELECT * FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
    [a, b, b, a],
    d1
  );
  if (!conv) {
    const id = crypto.randomUUID();
    await run('INSERT INTO conversations (id, user1_id, user2_id) VALUES (?, ?, ?)', [id, a, b], d1);
    conv = await queryOne('SELECT * FROM conversations WHERE id = ?', [id], d1);
  }
  return conv;
}

async function getUserConversations(userId, d1 = null) {
  return query(
    `SELECT c.*,
       CASE WHEN c.user1_id = ? THEN u2.id ELSE u1.id END AS peer_id,
       CASE WHEN c.user1_id = ? THEN u2.username ELSE u1.username END AS peer_username,
       CASE WHEN c.user1_id = ? THEN u2.display_name ELSE u1.display_name END AS peer_name,
       CASE WHEN c.user1_id = ? THEN u2.avatar_url ELSE u1.avatar_url END AS peer_avatar,
       CASE WHEN c.user1_id = ? THEN c.unread_u1 ELSE c.unread_u2 END AS unread_count
     FROM conversations c
     JOIN users u1 ON u1.id = c.user1_id
     JOIN users u2 ON u2.id = c.user2_id
     WHERE c.user1_id = ? OR c.user2_id = ?
     ORDER BY c.last_msg_at DESC`,
    [userId, userId, userId, userId, userId, userId, userId],
    d1
  );
}

async function getMessages(conversationId, limit = 50, before = null, d1 = null) {
  const params = before
    ? [conversationId, before, limit]
    : [conversationId, limit];
  return query(
    `SELECT m.*, u.username, u.display_name, u.avatar_url
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = ? AND m.is_deleted = 0
       ${before ? 'AND m.created_at < ?' : ''}
     ORDER BY m.created_at DESC LIMIT ?`,
    params,
    d1
  );
}

async function sendMessage({ conversation_id, sender_id, content, media_url = null, media_type = 'text' }, d1 = null) {
  const id = crypto.randomUUID();
  await run(
    'INSERT INTO messages (id, conversation_id, sender_id, content, media_url, media_type) VALUES (?, ?, ?, ?, ?, ?)',
    [id, conversation_id, sender_id, content, media_url, media_type],
    d1
  );

  // Atualiza conversa
  const conv = await queryOne('SELECT * FROM conversations WHERE id = ?', [conversation_id], d1);
  if (conv) {
    const isUser1 = conv.user1_id === sender_id;
    await run(
      `UPDATE conversations SET
         last_message = ?, last_msg_at = datetime('now'),
         ${isUser1 ? 'unread_u2 = unread_u2 + 1' : 'unread_u1 = unread_u1 + 1'}
       WHERE id = ?`,
      [content.slice(0, 100), conversation_id],
      d1
    );
  }

  return queryOne(
    `SELECT m.*, u.username, u.display_name, u.avatar_url FROM messages m
     JOIN users u ON u.id = m.sender_id WHERE m.id = ?`,
    [id], d1
  );
}

async function markConversationRead(conversationId, userId, d1 = null) {
  const conv = await queryOne('SELECT * FROM conversations WHERE id = ?', [conversationId], d1);
  if (!conv) return;
  const field = conv.user1_id === userId ? 'unread_u1' : 'unread_u2';
  await run(`UPDATE conversations SET ${field} = 0 WHERE id = ?`, [conversationId], d1);
  await run(
    'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0',
    [conversationId, userId],
    d1
  );
}

module.exports = { getOrCreateConversation, getUserConversations, getMessages, sendMessage, markConversationRead };

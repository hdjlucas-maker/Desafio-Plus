/**
 * Desafio+ — Post Model
 */

const { query, queryOne, run } = require('../config/db');
const crypto = require('crypto');

const POST_FIELDS = `
  p.id, p.user_id, p.content, p.media_urls, p.media_type, p.category,
  p.challenge_id, p.likes_count, p.comments_count, p.shares_count, p.created_at,
  u.username, u.display_name, u.avatar_url, u.level
`;

async function findById(id, viewerId = null, d1 = null) {
  const post = await queryOne(
    `SELECT ${POST_FIELDS} FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = ? AND p.is_deleted = 0`,
    [id], d1
  );
  if (!post) return post;
  post.media_urls = JSON.parse(post.media_urls || '[]');
  if (!viewerId) return post;
  post.liked = !!(await queryOne('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?', [viewerId, id], d1));
  return post;
}

async function create({ user_id, content, media_urls = [], media_type = 'none', category = 'geral', challenge_id = null }, d1 = null) {
  const id = crypto.randomUUID();
  await run(
    `INSERT INTO posts (id, user_id, content, media_urls, media_type, category, challenge_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, user_id, content, JSON.stringify(media_urls), media_type, category, challenge_id],
    d1
  );
  return findById(id, user_id, d1);
}

async function update(id, userId, { content, category }, d1 = null) {
  await run(
    "UPDATE posts SET content = ?, category = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
    [content, category, id, userId],
    d1
  );
  return findById(id, userId, d1);
}

async function softDelete(id, userId, d1 = null) {
  return run("UPDATE posts SET is_deleted = 1, updated_at = datetime('now') WHERE id = ? AND user_id = ?", [id, userId], d1);
}

async function getFeedPosts(userId, limit = 20, offset = 0, d1 = null) {
  const posts = await query(
    `SELECT ${POST_FIELDS} FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.is_deleted = 0
       AND (p.user_id = ? OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?))
       AND p.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [userId, userId, userId, limit, offset],
    d1
  );
  return enrichWithLikes(posts, userId, d1);
}

async function getExplorePosts(userId = null, limit = 20, offset = 0, d1 = null) {
  const posts = await query(
    `SELECT ${POST_FIELDS} FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.is_deleted = 0
       ${userId ? 'AND p.user_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)' : ''}
     ORDER BY (p.likes_count * 2 + p.comments_count) DESC, p.created_at DESC
     LIMIT ? OFFSET ?`,
    userId ? [userId, limit, offset] : [limit, offset],
    d1
  );
  return enrichWithLikes(posts, userId, d1);
}

async function getUserPosts(profileId, viewerId = null, limit = 20, offset = 0, d1 = null) {
  const posts = await query(
    `SELECT ${POST_FIELDS} FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = ? AND p.is_deleted = 0
     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [profileId, limit, offset],
    d1
  );
  return enrichWithLikes(posts, viewerId, d1);
}

async function toggleLike(userId, postId, d1 = null) {
  const existing = await queryOne('SELECT id FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId], d1);
  if (existing) {
    await run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId], d1);
    await run('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?', [postId], d1);
    return { liked: false };
  }
  const id = crypto.randomUUID();
  await run('INSERT INTO likes (id, user_id, post_id) VALUES (?, ?, ?)', [id, userId, postId], d1);
  await run('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [postId], d1);
  return { liked: true };
}

async function getComments(postId, limit = 30, offset = 0, d1 = null) {
  return query(
    `SELECT c.id, c.content, c.likes_count, c.created_at, c.parent_id,
       u.id AS user_id, u.username, u.display_name, u.avatar_url
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.post_id = ? AND c.is_deleted = 0 AND c.parent_id IS NULL
     ORDER BY c.created_at ASC LIMIT ? OFFSET ?`,
    [postId, limit, offset],
    d1
  );
}

async function addComment(postId, userId, content, parentId = null, d1 = null) {
  const id = crypto.randomUUID();
  await run(
    'INSERT INTO comments (id, post_id, user_id, content, parent_id) VALUES (?, ?, ?, ?, ?)',
    [id, postId, userId, content, parentId],
    d1
  );
  await run('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [postId], d1);
  return queryOne(
    `SELECT c.*, u.username, u.display_name, u.avatar_url FROM comments c
     JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
    [id], d1
  );
}

async function deleteComment(commentId, userId, d1 = null) {
  const comment = await queryOne('SELECT post_id FROM comments WHERE id = ? AND user_id = ?', [commentId, userId], d1);
  if (!comment) return false;
  await run("UPDATE comments SET is_deleted = 1 WHERE id = ?", [commentId], d1);
  await run('UPDATE posts SET comments_count = MAX(0, comments_count - 1) WHERE id = ?', [comment.post_id], d1);
  return true;
}

async function enrichWithLikes(posts, userId, d1) {
  if (!userId || !posts.length) return posts;
  const ids = posts.map(p => p.id);
  const likes = await query(
    `SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (${ids.map(() => '?').join(',')})`,
    [userId, ...ids],
    d1
  );
  const likedSet = new Set(likes.map(l => l.post_id));
  return posts.map(p => ({ ...p, liked: likedSet.has(p.id), media_urls: JSON.parse(p.media_urls || '[]') }));
}

module.exports = {
  findById, create, update, softDelete,
  getFeedPosts, getExplorePosts, getUserPosts,
  toggleLike, getComments, addComment, deleteComment,
};

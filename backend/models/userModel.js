/**
 * Desafio+ — User Model
 */

const { query, queryOne, run } = require('../config/db');

const PUBLIC_FIELDS = 'id, username, display_name, avatar_url, bio, level, xp, points, streak, created_at';

async function findById(id, d1 = null) {
  return queryOne(`SELECT ${PUBLIC_FIELDS}, email, privacy, is_verified FROM users WHERE id = ?`, [id], d1);
}

async function findByEmail(email, d1 = null) {
  return queryOne('SELECT * FROM users WHERE email = ?', [email], d1);
}

async function findByUsername(username, d1 = null) {
  return queryOne(`SELECT ${PUBLIC_FIELDS} FROM users WHERE username = ?`, [username], d1);
}

async function findByGoogleId(googleId, d1 = null) {
  return queryOne('SELECT * FROM users WHERE google_id = ?', [googleId], d1);
}

async function create({ id, email, username, display_name, password_hash = null, google_id = null, avatar_url = null }, d1 = null) {
  await run(
    `INSERT INTO users (id, email, username, display_name, password_hash, google_id, avatar_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, email, username, display_name, password_hash, google_id, avatar_url],
    d1
  );
  return findById(id, d1);
}

async function update(id, fields, d1 = null) {
  const allowed = ['display_name', 'bio', 'avatar_url', 'privacy'];
  const updates = Object.entries(fields)
    .filter(([k, v]) => allowed.includes(k) && v !== undefined && v !== null)
    .map(([k]) => `${k} = ?`);
  const values = Object.entries(fields)
    .filter(([k, v]) => allowed.includes(k) && v !== undefined && v !== null)
    .map(([, v]) => v);

  if (!updates.length) return findById(id, d1);
  updates.push("updated_at = datetime('now')");
  await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, [...values, id], d1);
  return findById(id, d1);
}

async function updatePassword(id, password_hash, d1 = null) {
  return run("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [password_hash, id], d1);
}

async function addXP(id, xp, points, d1 = null) {
  await run(
    `UPDATE users SET
       xp = xp + ?,
       points = points + ?,
       level = MAX(1, CAST((xp + ?) / 500 AS INTEGER) + 1),
       updated_at = datetime('now')
     WHERE id = ?`,
    [xp, points, xp, id],
    d1
  );
}

async function updateStreak(id, d1 = null) {
  const user = await queryOne('SELECT streak, streak_date FROM users WHERE id = ?', [id], d1);
  if (!user) return;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let newStreak = 1;
  if (user.streak_date === yesterday) newStreak = (user.streak || 0) + 1;
  else if (user.streak_date === today) return; // já contou hoje

  await run(
    "UPDATE users SET streak = ?, streak_date = ?, updated_at = datetime('now') WHERE id = ?",
    [newStreak, today, id],
    d1
  );
  return newStreak;
}

async function getFollowers(userId, limit = 20, offset = 0, d1 = null) {
  return query(
    `SELECT u.${PUBLIC_FIELDS} FROM follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = ? ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset],
    d1
  );
}

async function getFollowing(userId, limit = 20, offset = 0, d1 = null) {
  return query(
    `SELECT u.${PUBLIC_FIELDS} FROM follows f
     JOIN users u ON u.id = f.following_id
     WHERE f.follower_id = ? ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset],
    d1
  );
}

async function isFollowing(followerId, followingId, d1 = null) {
  const row = await queryOne('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId], d1);
  return !!row;
}

async function follow(followerId, followingId, d1 = null) {
  const id = require('crypto').randomUUID();
  return run('INSERT OR IGNORE INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)', [id, followerId, followingId], d1);
}

async function unfollow(followerId, followingId, d1 = null) {
  return run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId], d1);
}

async function getSuggestions(userId, limit = 10, d1 = null) {
  return query(
    `SELECT u.${PUBLIC_FIELDS},
       (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count
     FROM users u
     WHERE u.id != ?
       AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
       AND u.is_banned = 0
     ORDER BY followers_count DESC, u.created_at DESC
     LIMIT ?`,
    [userId, userId, limit],
    d1
  );
}

async function getUserBadges(userId, d1 = null) {
  return query(
    `SELECT b.*, ub.earned_at FROM user_badges ub
     JOIN badges b ON b.id = ub.badge_id
     WHERE ub.user_id = ? ORDER BY ub.earned_at DESC`,
    [userId],
    d1
  );
}

async function awardBadge(userId, badgeSlug, d1 = null) {
  const badge = await queryOne('SELECT * FROM badges WHERE slug = ?', [badgeSlug], d1);
  if (!badge) return null;
  const id = require('crypto').randomUUID();
  try {
    await run('INSERT OR IGNORE INTO user_badges (id, user_id, badge_id) VALUES (?, ?, ?)', [id, userId, badge.id], d1);
    if (badge.xp_reward > 0) await addXP(userId, badge.xp_reward, 0, d1);
    return badge;
  } catch { return null; }
}

async function getStats(userId, d1 = null) {
  const [posts, followers, following, completions] = await Promise.all([
    queryOne('SELECT COUNT(*) AS count FROM posts WHERE user_id = ? AND is_deleted = 0', [userId], d1),
    queryOne('SELECT COUNT(*) AS count FROM follows WHERE following_id = ?', [userId], d1),
    queryOne('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?', [userId], d1),
    queryOne('SELECT COUNT(*) AS count FROM challenge_completions WHERE user_id = ?', [userId], d1),
  ]);
  return {
    posts: posts?.count || 0,
    followers: followers?.count || 0,
    following: following?.count || 0,
    challenges_completed: completions?.count || 0,
  };
}

module.exports = {
  findById, findByEmail, findByUsername, findByGoogleId,
  create, update, updatePassword, addXP, updateStreak,
  getFollowers, getFollowing, isFollowing, follow, unfollow,
  getSuggestions, getUserBadges, awardBadge, getStats,
};

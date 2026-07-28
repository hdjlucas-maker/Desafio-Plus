/**
 * Desafio+ — Users Controller
 */

const userModel = require('../models/userModel');
const postModel = require('../models/postModel');
const notifModel = require('../models/notificationModel');
const { query, queryOne, run } = require('../config/db');
const crypto = require('crypto');

async function getProfile(req, res) {
  try {
    const { username } = req.params;
    const d1 = req.d1 || null;
    const user = await userModel.findByUsername(username, d1);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const [stats, badges, isFollowing] = await Promise.all([
      userModel.getStats(user.id, d1),
      userModel.getUserBadges(user.id, d1),
      req.user ? userModel.isFollowing(req.user.id, user.id, d1) : false,
    ]);

    res.json({ ...user, stats, badges, is_following: isFollowing });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
}

async function updateProfile(req, res) {
  try {
    const { display_name, bio, privacy } = req.body;
    const user = await userModel.update(req.user.id, { display_name, bio, privacy }, req.d1);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
}

async function getUserPosts(req, res) {
  try {
    const { username } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const d1 = req.d1 || null;
    const user = await userModel.findByUsername(username, d1);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const posts = await postModel.getUserPosts(user.id, req.user?.id, +limit, +offset, d1);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar posts' });
  }
}

async function followUser(req, res) {
  try {
    const { username } = req.params;
    const d1 = req.d1 || null;
    const target = await userModel.findByUsername(username, d1);
    if (!target) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'Não pode seguir a si mesmo' });

    const already = await userModel.isFollowing(req.user.id, target.id, d1);
    if (already) {
      await userModel.unfollow(req.user.id, target.id, d1);
      return res.json({ following: false });
    }

    await userModel.follow(req.user.id, target.id, d1);

    // Notifica
    await notifModel.create({
      user_id: target.id,
      actor_id: req.user.id,
      type: 'follow',
      entity_type: 'user',
      entity_id: req.user.id,
      message: `${req.user.display_name} começou a te seguir`,
    }, d1);

    // XP por seguir
    await userModel.addXP(req.user.id, 5, 1, d1);

    res.json({ following: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao seguir usuário' });
  }
}

async function getFollowers(req, res) {
  try {
    const { username } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const d1 = req.d1 || null;
    const user = await userModel.findByUsername(username, d1);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const followers = await userModel.getFollowers(user.id, +limit, +offset, d1);
    res.json(followers);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar seguidores' });
  }
}

async function getFollowing(req, res) {
  try {
    const { username } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const d1 = req.d1 || null;
    const user = await userModel.findByUsername(username, d1);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const following = await userModel.getFollowing(user.id, +limit, +offset, d1);
    res.json(following);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar seguindo' });
  }
}

async function getSuggestions(req, res) {
  try {
    const suggestions = await userModel.getSuggestions(req.user.id, 10, req.d1);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar sugestões' });
  }
}

async function blockUser(req, res) {
  try {
    const { username } = req.params;
    const d1 = req.d1 || null;
    const target = await userModel.findByUsername(username, d1);
    if (!target) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'Não pode bloquear a si mesmo' });

    const existing = await queryOne('SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?', [req.user.id, target.id], d1);
    if (existing) {
      await run('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?', [req.user.id, target.id], d1);
      return res.json({ blocked: false });
    }

    const id = crypto.randomUUID();
    await run('INSERT INTO blocks (id, blocker_id, blocked_id) VALUES (?, ?, ?)', [id, req.user.id, target.id], d1);
    // Remove follow mútuo
    await userModel.unfollow(req.user.id, target.id, d1);
    await userModel.unfollow(target.id, req.user.id, d1);

    res.json({ blocked: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao bloquear usuário' });
  }
}

async function getRanking(req, res) {
  try {
    const { mode = 'points', limit = 20 } = req.query;
    const d1 = req.d1 || null;
    const orderBy = mode === 'xp' ? 'xp' : mode === 'streak' ? 'streak' : 'points';
    const users = await query(
      `SELECT id, username, display_name, avatar_url, level, xp, points, streak
       FROM users WHERE is_banned = 0
       ORDER BY ${orderBy} DESC LIMIT ?`,
      [+limit], d1
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
}

module.exports = {
  getProfile, updateProfile, getUserPosts,
  followUser, getFollowers, getFollowing,
  getSuggestions, blockUser, getRanking,
};

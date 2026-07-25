/**
 * Desafio+ — Games Controller
 * Registra sessões de jogos e integra pontos ao sistema global
 */

const { query, queryOne, run } = require('../config/db');
const userModel = require('../models/userModel');
const crypto = require('crypto');

const GAME_POINTS = {
  'jogo-da-velha': 50,
  'damas': 80,
  'quiz': 100,
  'verdade-ou-desafio': 30,
  'roleta': 40,
  'memoria': 70,
  'palavra-embaralhada': 60,
  'enquete': 20,
  'caca-palavras': 90,
  'adivinhe-o-numero': 50,
};

async function recordSession(req, res) {
  try {
    const { game_slug, score, duration, result, metadata } = req.body;
    const d1 = req.d1 || null;

    if (!game_slug) return res.status(400).json({ error: 'game_slug é obrigatório' });

    const basePoints = GAME_POINTS[game_slug] || 20;
    const multiplier = result === 'won' ? 1.5 : result === 'completed' ? 1.0 : 0.3;
    const points_earned = Math.floor(basePoints * multiplier);

    const id = crypto.randomUUID();
    await run(
      `INSERT INTO game_sessions (id, user_id, game_slug, score, duration, result, metadata, points_earned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, game_slug, score || 0, duration || 0, result || 'completed', JSON.stringify(metadata || {}), points_earned],
      d1
    );

    // Atualiza leaderboard
    const existing = await queryOne(
      'SELECT * FROM game_leaderboard WHERE game_slug = ? AND user_id = ?',
      [game_slug, req.user.id], d1
    );
    if (existing) {
      await run(
        `UPDATE game_leaderboard SET
           best_score = MAX(best_score, ?),
           total_plays = total_plays + 1,
           updated_at = datetime('now')
         WHERE game_slug = ? AND user_id = ?`,
        [score || 0, game_slug, req.user.id], d1
      );
    } else {
      const lbId = crypto.randomUUID();
      await run(
        'INSERT INTO game_leaderboard (id, game_slug, user_id, best_score, total_plays) VALUES (?, ?, ?, ?, 1)',
        [lbId, game_slug, req.user.id, score || 0], d1
      );
    }

    // Adiciona pontos ao usuário
    if (points_earned > 0) {
      await userModel.addXP(req.user.id, Math.floor(points_earned / 5), points_earned, d1);
    }

    // Badge de campeão dos jogos
    const totalWins = await queryOne(
      "SELECT COUNT(*) AS count FROM game_sessions WHERE user_id = ? AND result = 'won'",
      [req.user.id], d1
    );
    if (totalWins?.count >= 50) {
      await userModel.awardBadge(req.user.id, 'game-champion', d1);
    }

    res.json({ points_earned, session_id: id });
  } catch (err) {
    console.error('[GAMES] record:', err);
    res.status(500).json({ error: 'Erro ao registrar sessão' });
  }
}

async function getLeaderboard(req, res) {
  try {
    const { game_slug, limit = 10 } = req.query;
    const d1 = req.d1 || null;

    if (!game_slug) return res.status(400).json({ error: 'game_slug é obrigatório' });

    const rows = await query(
      `SELECT gl.best_score, gl.total_plays,
         u.id, u.username, u.display_name, u.avatar_url, u.level
       FROM game_leaderboard gl
       JOIN users u ON u.id = gl.user_id
       WHERE gl.game_slug = ?
       ORDER BY gl.best_score DESC LIMIT ?`,
      [game_slug, +limit], d1
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar leaderboard' });
  }
}

async function getUserGameHistory(req, res) {
  try {
    const { game_slug, limit = 20, offset = 0 } = req.query;
    const d1 = req.d1 || null;
    const filter = game_slug ? 'AND game_slug = ?' : '';
    const params = game_slug
      ? [req.user.id, game_slug, +limit, +offset]
      : [req.user.id, +limit, +offset];

    const sessions = await query(
      `SELECT * FROM game_sessions WHERE user_id = ? ${filter}
       ORDER BY played_at DESC LIMIT ? OFFSET ?`,
      params, d1
    );
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
}

async function getGameStats(req, res) {
  try {
    const d1 = req.d1 || null;
    const stats = await query(
      `SELECT game_slug, COUNT(*) AS total_plays, MAX(score) AS best_score,
         SUM(points_earned) AS total_points,
         SUM(CASE WHEN result = 'won' THEN 1 ELSE 0 END) AS wins
       FROM game_sessions WHERE user_id = ?
       GROUP BY game_slug ORDER BY total_plays DESC`,
      [req.user.id], d1
    );
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
}

module.exports = { recordSession, getLeaderboard, getUserGameHistory, getGameStats };

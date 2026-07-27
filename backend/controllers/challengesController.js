/**
 * Desafio+ — Challenges Controller
 */

const { query, queryOne, run } = require('../config/db');
const userModel = require('../models/userModel');
const notifModel = require('../models/notificationModel');
const { generateChallenges, generateChallengeTip } = require('../config/openai');
const crypto = require('crypto');

async function getDailyChallenges(req, res) {
  try {
    const { mode } = req.query;
    const d1 = req.d1 || null;
    const filter = mode ? 'AND mode = ?' : '';
    const params = mode ? [mode] : [];
    const challenges = await query(
      `SELECT * FROM challenges WHERE is_daily = 1 AND is_active = 1 ${filter} ORDER BY RANDOM() LIMIT 5`,
      params, d1
    );
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar desafios diários' });
  }
}

async function getAllChallenges(req, res) {
  try {
    const { mode, difficulty, limit = 20, offset = 0 } = req.query;
    const d1 = req.d1 || null;
    const conditions = ['is_active = 1'];
    const params = [];
    if (mode) { conditions.push('mode = ?'); params.push(mode); }
    if (difficulty) { conditions.push('difficulty = ?'); params.push(difficulty); }
    params.push(+limit, +offset);

    const challenges = await query(
      `SELECT * FROM challenges WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      params, d1
    );
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar desafios' });
  }
}

async function completeChallenge(req, res) {
  try {
    const { challenge_id, proof_url, post_id } = req.body;
    const d1 = req.d1 || null;

    const challenge = await queryOne('SELECT * FROM challenges WHERE id = ? AND is_active = 1', [challenge_id], d1);
    if (!challenge) return res.status(404).json({ error: 'Desafio não encontrado' });

    // Verifica se já completou hoje
    const today = new Date().toISOString().split('T')[0];
    const existing = await queryOne(
      "SELECT id FROM challenge_completions WHERE user_id = ? AND challenge_id = ? AND date(completed_at) = ?",
      [req.user.id, challenge_id, today], d1
    );
    if (existing) return res.status(409).json({ error: 'Desafio já completado hoje' });

    const id = crypto.randomUUID();
    await run(
      'INSERT INTO challenge_completions (id, user_id, challenge_id, post_id, proof_url, xp_earned, points_earned) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, challenge_id, post_id || null, proof_url || null, challenge.xp_reward, challenge.points_reward],
      d1
    );

    // Adiciona XP e pontos
    await userModel.addXP(req.user.id, challenge.xp_reward, challenge.points_reward, d1);

    // Atualiza streak
    const newStreak = await userModel.updateStreak(req.user.id, d1);

    // Verifica badges de streak
    if (newStreak >= 100) await userModel.awardBadge(req.user.id, 'streak-100', d1);
    else if (newStreak >= 30) await userModel.awardBadge(req.user.id, 'streak-30', d1);
    else if (newStreak >= 7) await userModel.awardBadge(req.user.id, 'streak-7', d1);

    // Badge de primeiro desafio
    const totalCompletions = await queryOne(
      'SELECT COUNT(*) AS count FROM challenge_completions WHERE user_id = ?',
      [req.user.id], d1
    );
    if (totalCompletions?.count === 1) {
      await userModel.awardBadge(req.user.id, 'primeiro-desafio', d1);
    }

    res.json({
      message: 'Desafio completado! 🎉',
      xp_earned: challenge.xp_reward,
      points_earned: challenge.points_reward,
      streak: newStreak,
    });
  } catch (err) {
    console.error('[CHALLENGES] complete:', err);
    res.status(500).json({ error: 'Erro ao completar desafio' });
  }
}

async function getUserCompletions(req, res) {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const d1 = req.d1 || null;
    const completions = await query(
      `SELECT cc.*, c.title, c.description, c.mode, c.difficulty, c.rarity
       FROM challenge_completions cc
       JOIN challenges c ON c.id = cc.challenge_id
       WHERE cc.user_id = ?
       ORDER BY cc.completed_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, +limit, +offset], d1
    );
    res.json(completions);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
}

async function generateAIChallenges(req, res) {
  try {
    const { mode = 'solo', category = 'geral' } = req.body;
    const d1 = req.d1 || null;

    const completedIds = (await query(
      'SELECT challenge_id FROM challenge_completions WHERE user_id = ?',
      [req.user.id], d1
    )).map(r => r.challenge_id);

    const generated = await generateChallenges({ mode, category, completedIds, count: 3 });

    // Salva os gerados no banco
    const saved = [];
    for (const ch of generated) {
      const id = crypto.randomUUID();
      await run(
        `INSERT INTO challenges (id, title, description, mode, category, difficulty, xp_reward, points_reward, rarity, ai_generated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [id, ch.title, ch.description, mode, category, ch.difficulty, ch.xp_reward, ch.points_reward, ch.rarity],
        d1
      );
      saved.push({ id, ...ch, mode, category });
    }

    res.json(saved);
  } catch (err) {
    console.error('[CHALLENGES] ai-generate:', err);
    res.status(500).json({ error: 'Erro ao gerar desafios com IA' });
  }
}

async function getChallengeTip(req, res) {
  try {
    const challenge = await queryOne('SELECT title FROM challenges WHERE id = ?', [req.params.id], req.d1);
    if (!challenge) return res.status(404).json({ error: 'Desafio não encontrado' });
    const tip = await generateChallengeTip(challenge.title, req.user.display_name);
    res.json({ tip });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar dica' });
  }
}

module.exports = { getDailyChallenges, getAllChallenges, completeChallenge, getUserCompletions, generateAIChallenges, getChallengeTip };

/**
 * Desafio+ — middleware/auth.js
 * Middleware JWT + helpers de geração de tokens.
 */

const jwt = require('jsonwebtoken');
const { queryOne } = require('../config/db');

function getJwtSecret() {
  if (globalThis.__CF_ENV__ && globalThis.__CF_ENV__.JWT_SECRET) return globalThis.__CF_ENV__.JWT_SECRET;
  return process.env.JWT_SECRET || 'desafio-plus-secret-dev';
}
const ACCESS_EXPIRES_IN  = '15m';
const REFRESH_EXPIRES_IN = '30d';

// ── Geração de tokens ─────────────────────────────────────────────────────────

function generateAccessToken(userId) {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: ACCESS_EXPIRES_IN });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: REFRESH_EXPIRES_IN });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getJwtSecret());
}

// ── Middleware obrigatório ────────────────────────────────────────────────────

async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Token de autenticação necessário' });

    const payload = jwt.verify(token, getJwtSecret());
    const user = await queryOne(
      'SELECT id, email, username, display_name, avatar_url, level, xp, points, streak, is_banned, privacy FROM users WHERE id = ? AND is_banned = 0',
      [payload.userId]
    );

    if (!user) return res.status(401).json({ error: 'Usuário não encontrado ou banido' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// ── Middleware opcional ───────────────────────────────────────────────────────

async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const payload = jwt.verify(token, getJwtSecret());
      const user = await queryOne(
        'SELECT id, email, username, display_name, avatar_url, level, xp, points, streak, is_banned, privacy FROM users WHERE id = ? AND is_banned = 0',
        [payload.userId]
      );
      if (user) req.user = user;
    }
  } catch { /* ignora erros — auth é opcional */ }
  next();
}

// ── Helper ────────────────────────────────────────────────────────────────────

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return req.query?.token || null;
}

module.exports = {
  requireAuth,
  optionalAuth,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};

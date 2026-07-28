/**
 * Desafio+ — Rotas de Autenticação
 * CORRIGIDO: compatível com authController.js original
 *
 * Rotas disponíveis:
 *   POST /api/auth/register        — Cadastro com email/senha
 *   POST /api/auth/login           — Login com email/senha
 *   POST /api/auth/refresh         — Renovar access token
 *   POST /api/auth/logout          — Logout (revoga refresh token)
 *   POST /api/auth/forgot-password — Solicitar reset de senha
 *   POST /api/auth/reset-password  — Redefinir senha com token
 *   GET  /api/auth/me              — Perfil do usuário logado (requer auth)
 */

const express = require('express');
const router = express.Router();

// ── Controller ────────────────────────────────────────────────────────────────
// Importa TODAS as funções exportadas pelo authController original
const ctrl = require('../controllers/authController');

// ── Middleware ────────────────────────────────────────────────────────────────
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { sanitizeInputs } = require('../middleware/sanitize');

// ── Rotas ─────────────────────────────────────────────────────────────────────

// Cadastro
router.post('/register', authLimiter, sanitizeInputs, ctrl.register);

// Login
router.post('/login', authLimiter, sanitizeInputs, ctrl.login);

// Refresh token — recebe { refresh_token } e retorna novo par de tokens
router.post('/refresh', ctrl.refreshToken);

// Logout — revoga o refresh token
router.post('/logout', ctrl.logout);

// Recuperação de senha
router.post('/forgot-password', authLimiter, sanitizeInputs, ctrl.forgotPassword);
router.post('/reset-password', sanitizeInputs, ctrl.resetPassword);

// Perfil do usuário autenticado
router.get('/me', requireAuth, ctrl.me);

module.exports = router;

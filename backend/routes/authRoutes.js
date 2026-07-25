// ============================================================
// authRoutes.js — Rotas de autenticação CORRIGIDAS
// ============================================================
const express = require('express');
const router = express.Router();
const { register, login, googleCallback, forgotPassword, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register — Criar conta
router.post('/register', register);

// POST /api/auth/login — Login com email/senha
router.post('/login', login);

// POST /api/auth/forgot-password — Recuperar senha
router.post('/forgot-password', forgotPassword);

// GET /api/auth/me — Perfil do usuário logado
router.get('/me', authenticate, me);

// ── Google OAuth ──────────────────────────────────────────────
// Requer passport-google-oauth20 instalado e configurado

let passport;
try {
  passport = require('passport');
  const GoogleStrategy = require('passport-google-oauth20').Strategy;

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8787/api/auth/google/callback',
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const db = req.db;
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const displayName = profile.displayName || 'Usuário';
          const avatarUrl = profile.photos?.[0]?.value;

          if (!email) return done(new Error('Email não fornecido pelo Google'), null);

          // Verifica se já existe por google_id
          let user = await db
            .prepare('SELECT * FROM users WHERE google_id = ?')
            .bind(googleId)
            .first();

          if (!user) {
            // Verifica por email
            user = await db
              .prepare('SELECT * FROM users WHERE email = ?')
              .bind(email.toLowerCase())
              .first();

            if (user) {
              // Vincula google_id à conta existente
              await db
                .prepare('UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?')
                .bind(googleId, avatarUrl, user.id)
                .run();
              user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
              user.isNew = false;
            } else {
              // Cria novo usuário via Google
              const { v4: uuidv4 } = require('uuid');
              const userId = uuidv4();
              let username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 18);
              // Garante username único
              const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
              if (existing) username = username + Math.floor(Math.random() * 999);

              await db
                .prepare(`
                  INSERT INTO users (id, email, username, display_name, google_id, avatar_url, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                `)
                .bind(userId, email.toLowerCase(), username, displayName, googleId, avatarUrl)
                .run();

              user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
              user.isNew = true;
            }
          } else {
            user.isNew = false;
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  // GET /api/auth/google — Inicia fluxo OAuth
  router.get(
    '/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
    })
  );

  // GET /api/auth/google/callback — Callback do Google
  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/error' }),
    googleCallback
  );

  router.get('/google/error', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/google/callback?error=auth_failed`);
  });

} catch (err) {
  // passport-google-oauth20 não instalado — rotas Google retornam instrução
  console.warn('[Auth] Google OAuth não configurado:', err.message);

  router.get('/google', (req, res) => {
    res.status(501).json({
      error: 'Google OAuth não configurado.',
      instructions: 'Execute: npm install passport passport-google-oauth20',
    });
  });

  router.get('/google/callback', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/google/callback?error=not_configured`);
  });
}

module.exports = router;

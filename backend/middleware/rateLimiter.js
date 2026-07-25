/**
 * Desafio+ — middleware/rateLimiter.js
 * Rate limiting com express-rate-limit.
 * Limites generosos para desenvolvimento local.
 * Se o pacote não estiver instalado, exporta middlewares passthrough (sem limite).
 */

let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch {
  // Fallback: sem rate limiting (não crasha o servidor)
  const passthrough = (req, res, next) => next();
  module.exports = {
    generalLimiter:  passthrough,
    authLimiter:     passthrough,
    searchLimiter:   passthrough,
    uploadLimiter:   passthrough,
  };
  return;
}

const isDev = (process.env.NODE_ENV || 'development') !== 'production';

// ── Limite geral: 1000 req / 15 min em dev, 200 em prod ──────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});

// ── Limite para auth: 100 req / 15 min em dev, 20 em prod ────────────────────
// (evita brute-force em produção, mas não bloqueia o dev)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});

// ── Limite para busca: 200 req / 15 min em dev, 60 em prod ───────────────────
const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Muitas buscas. Aguarde um momento.' },
});

// ── Limite para upload: 100 req / 15 min em dev, 30 em prod ──────────────────
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Muitos uploads. Aguarde um momento.' },
});

module.exports = { generalLimiter, authLimiter, searchLimiter, uploadLimiter };

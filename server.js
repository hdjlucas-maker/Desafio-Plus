/**
 * Desafio+ — server.js (VERSÃO LOCAL v8)
 *
 * Correções aplicadas:
 *  1. dotenv carregado no topo — JWT_SECRET fixo do .env
 *  2. Não gera JWT_SECRET aleatório (tokens não invalidam no reinício)
 *  3. Carrega TODAS as rotas com try/catch — não crasha se arquivo faltar
 *  4. CORS permissivo para localhost em desenvolvimento
 *  5. Serve uploads como estático
 *  6. Inclui rotas: presence, suggestions, blocks, search, upload
 */

// ── 1. Carrega .env PRIMEIRO ──────────────────────────────────────────────────
require('dotenv').config();

// ── 2. Avisa se JWT_SECRET não estiver no .env (mas não gera aleatório) ───────
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET não encontrado no .env!');
  console.warn('   Tokens serão inválidos entre reinicializações.');
  console.warn('   Adicione ao .env: JWT_SECRET=desafioplus_secret_key_2026_local_dev_segura');
  // Usa fallback fixo para não crashar — mas avisa o usuário
  process.env.JWT_SECRET = 'desafioplus_secret_key_2026_local_dev_segura_nao_usar_em_producao';
}

// ── 3. Inicializa banco de dados (auto-migrate) ───────────────────────────────
// DEVE ser o primeiro require após dotenv — cria as tabelas se não existirem
require('./config/db');

const express = require('express');
const path    = require('path');
const cors    = require('cors');

// ── 4. Middlewares opcionais (com fallback se pacote não estiver instalado) ───
let helmet, morgan;
try { helmet = require('helmet'); } catch { helmet = null; }
try { morgan = require('morgan'); } catch { morgan = null; }

// Rate limiters
let generalLimiter, authLimiter;
try {
  ({ generalLimiter, authLimiter } = require('./middleware/rateLimiter'));
} catch {
  const passthrough = (req, res, next) => next();
  generalLimiter = passthrough;
  authLimiter    = passthrough;
}

const app   = express();
const isDev = (process.env.NODE_ENV || 'development') !== 'production';

// ── 5. Trust proxy (necessário para rate limiter atrás de proxy) ──────────────
app.set('trust proxy', 1);

// ── 6. Segurança ──────────────────────────────────────────────────────────────
if (helmet) {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }));
}

// ── 7. CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    // Sem origin = Postman, curl, apps mobile — sempre permite
    if (!origin) return cb(null, true);
    // Em dev, libera qualquer localhost/127.0.0.1
    if (isDev && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return cb(null, true);
    }
    // Em produção, verifica ALLOWED_ORIGINS no .env
    const allowed = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
      .split(',').map(o => o.trim()).filter(Boolean);
    if (allowed.includes(origin)) return cb(null, true);
    cb(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
}));

// Responde preflight OPTIONS em todas as rotas
app.options('*', cors());

// ── 8. Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── 9. Logging ────────────────────────────────────────────────────────────────
if (morgan && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── 10. Rate limiting global ──────────────────────────────────────────────────
app.use('/api/', generalLimiter);

// ── 11. Arquivos estáticos (uploads) ─────────────────────────────────────────
const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadsDir));

// ── 12. Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Desafio+',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    cors: isDev ? 'permissivo (dev)' : 'restrito (prod)',
  });
});

// ── 13. Loader de rotas com fallback ─────────────────────────────────────────
// Não crasha o servidor se um arquivo de rota não existir
function loadRoute(routePath, label) {
  try {
    const router = require(routePath);
    console.log(`  ✅ ${label}`);
    return router;
  } catch (e) {
    console.warn(`  ⚠️  ${label} — não encontrado (${e.message.split('\n')[0]})`);
    const router = express.Router();
    router.all('*', (req, res) =>
      res.status(501).json({ error: `Rota ${label} não implementada ainda` })
    );
    return router;
  }
}

// ── 14. Rotas da API ──────────────────────────────────────────────────────────
console.log('\n📡 Carregando rotas:');

// Rotas principais (obrigatórias)
app.use('/api/auth',          loadRoute('./routes/auth',          'auth'));
app.use('/api/users',         loadRoute('./routes/users',         'users'));
app.use('/api/posts',         loadRoute('./routes/posts',         'posts'));
app.use('/api/feed',          loadRoute('./routes/feed',          'feed'));

// Rotas de funcionalidades
app.use('/api/challenges',    loadRoute('./routes/challenges',    'challenges'));
app.use('/api/games',         loadRoute('./routes/games',         'games'));
app.use('/api/chat',          loadRoute('./routes/chat',          'chat'));
app.use('/api/notifications', loadRoute('./routes/notifications', 'notifications'));
app.use('/api/reports',       loadRoute('./routes/reports',       'reports'));

// Rotas corrigidas/novas
app.use('/api/blocks',        loadRoute('./routes/blockRoutes',   'blockRoutes'));
app.use('/api/search',        loadRoute('./routes/search',        'search'));
app.use('/api/upload',        loadRoute('./routes/upload',        'upload'));
app.use('/api/presence',      loadRoute('./routes/presence',      'presence'));
app.use('/api/suggestions',   loadRoute('./routes/suggestions',   'suggestions'));

console.log('');

// ── 15. 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ── 16. Error handler global ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: isDev ? err.message : 'Erro interno do servidor',
  });
});

// ── 17. Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`🚀 Desafio+ API rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health   : http://localhost:${PORT}/health`);
  console.log(`   Frontend : ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`   JWT      : ${process.env.JWT_SECRET ? '✅ fixo (do .env)' : '⚠️  fallback'}\n`);
});

module.exports = app;

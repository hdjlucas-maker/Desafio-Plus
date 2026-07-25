/**
 * Desafio+ — server.js (VERSÃO CORRIGIDA v3)
 *
 * Correções aplicadas:
 *  1. Auto-migrate: banco SQLite criado automaticamente ao iniciar
 *  2. JWT_SECRET gerado automaticamente se não existir no .env
 *  3. Apenas rotas que existem são carregadas (sem crash por módulo faltando)
 *  4. CORS permissivo para localhost em desenvolvimento
 *  5. Middlewares com fallback seguro se arquivos não existirem
 */

// ── Carrega .env ──────────────────────────────────────────────────────────────
require('dotenv').config();

// ── Auto-gera JWT_SECRET se não estiver no .env ───────────────────────────────
if (!process.env.JWT_SECRET) {
  const crypto = require('crypto');
  process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
  console.log('⚠️  JWT_SECRET não encontrado no .env — gerado automaticamente para esta sessão.');
  console.log('   Para manter o mesmo secret entre reinicializações, adicione ao .env:');
  console.log(`   JWT_SECRET=${process.env.JWT_SECRET}\n`);
}

// ── Inicializa banco de dados (auto-migrate) ──────────────────────────────────
// DEVE ser o primeiro require após dotenv — cria as tabelas se não existirem
require('./config/db');

const express = require('express');
const cors    = require('cors');

// ── Middlewares opcionais (com fallback se arquivo não existir) ───────────────
let helmet, morgan, generalLimiter;
try { helmet = require('helmet'); } catch { helmet = null; }
try { morgan = require('morgan'); } catch { morgan = null; }
try { ({ generalLimiter } = require('./middleware/rateLimiter')); } catch { generalLimiter = null; }

const app = express();

// ── Segurança ─────────────────────────────────────────────────────────────────
if (helmet) {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }));
}

// ── CORS ──────────────────────────────────────────────────────────────────────
const isDev = (process.env.NODE_ENV || 'development') !== 'production';

app.use(cors({
  origin: (origin, cb) => {
    // Sem origin = Postman, curl, apps mobile — sempre permite
    if (!origin) return cb(null, true);
    // Em dev, libera qualquer localhost/127.0.0.1
    if (isDev && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return cb(null, true);
    }
    // Em produção, verifica ALLOWED_ORIGINS no .env
    const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
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

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (morgan && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Rate limiting global (opcional) ──────────────────────────────────────────
if (generalLimiter) {
  app.use('/api/', generalLimiter);
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Desafio+',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    cors: isDev ? 'permissivo (dev)' : 'restrito (prod)',
  });
});

// ── Carrega rotas com segurança (não crasha se arquivo não existir) ───────────
function loadRoute(routePath) {
  try {
    return require(routePath);
  } catch (e) {
    console.warn(`⚠️  Rota não encontrada, ignorando: ${routePath}`);
    const router = express.Router();
    router.all('*', (req, res) => res.status(501).json({ error: 'Rota não implementada ainda' }));
    return router;
    // Adicionar junto com as outras rotas no server.js
    const presenceRoutes    = require('./routes/presence');
    const suggestionsRoutes = require('./routes/suggestions');
    app.use('/api/presence',    presenceRoutes);
    app.use('/api/suggestions', suggestionsRoutes);

  }
}

// ── Rotas da API ──────────────────────────────────────────────────────────────
app.use('/api/auth',   loadRoute('./routes/auth'));
app.use('/api/users',  loadRoute('./routes/users'));
app.use('/api/posts',  loadRoute('./routes/posts'));
app.use('/api/feed',   loadRoute('./routes/feed'));
app.use('/api/blocks', loadRoute('./routes/blockRoutes'));

// Rotas extras — carregadas se existirem
[
  ['/api/challenges',    './routes/challenges'],
  ['/api/games',         './routes/games'],
  ['/api/chat',          './routes/chat'],
  ['/api/notifications', './routes/notifications'],
  ['/api/search',        './routes/search'],
  ['/api/upload',        './routes/upload'],
  ['/api/reports',       './routes/reports'],
].forEach(([prefix, file]) => {
  app.use(prefix, loadRoute(file));
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ── Error handler global ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: isDev ? err.message : 'Erro interno do servidor',
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`\n🚀 Desafio+ API rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS     : ${isDev ? 'permissivo (localhost liberado)' : 'restrito'}`);
  console.log(`   Banco    : desafio-plus.db (SQLite local)\n`);
});

module.exports = app;

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

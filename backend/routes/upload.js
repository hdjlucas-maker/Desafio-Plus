// ============================================================
// upload.js — Upload local de arquivos com multer
// Salva em backend/uploads/ e retorna URL acessível
// ============================================================
const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const { requireAuth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Garante que a pasta uploads/ existe (só local — Workers não tem filesystem)
try {
  const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  // Workers — filesystem não disponível
}

// Tenta carregar multer (opcional — não crasha se não instalado)
let multer;
try {
  multer = require('multer');
} catch {
  multer = null;
}

if (!multer) {
  // Fallback: rota informa que multer não está instalado
  router.post('/', requireAuth, uploadLimiter, (req, res) => {
    res.status(503).json({
      error: 'Upload indisponível. Execute: npm install multer (na pasta backend)',
    });
  });
  module.exports = router;
  return;
}

// Configuração do multer — armazenamento local
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm',
];

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido.'));
    }
  },
});

// POST /api/upload — faz upload de um arquivo
router.post('/', requireAuth, uploadLimiter, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  // Monta URL pública — o server.js deve servir /uploads como estático
  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    url:     fileUrl,
    name:    req.file.originalname,
    size:    req.file.size,
    type:    req.file.mimetype,
  });
});

// Tratamento de erro do multer
router.use((err, req, res, next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Arquivo muito grande. Máximo: 20 MB.' });
  }
  if (err?.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { run } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { sanitizeInputs } = require('../middleware/sanitize');
const crypto = require('crypto');

router.post('/', requireAuth, sanitizeInputs, async (req, res) => {
  try {
    const { entity_type, entity_id, reason } = req.body;
    if (!entity_type || !entity_id || !reason) return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    const id = crypto.randomUUID();
    await run(
      'INSERT INTO reports (id, reporter_id, entity_type, entity_id, reason) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, entity_type, entity_id, reason], req.d1
    );
    res.status(201).json({ message: 'Denúncia enviada. Obrigado!' });
  } catch { res.status(500).json({ error: 'Erro ao enviar denúncia' }); }
});
module.exports = router;

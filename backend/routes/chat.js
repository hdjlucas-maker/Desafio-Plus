const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatController');
const { requireAuth } = require('../middleware/auth');
const { sanitizeInputs } = require('../middleware/sanitize');

router.get('/', requireAuth, ctrl.getConversations);
router.get('/with/:username', requireAuth, ctrl.getOrCreateConversation);
router.get('/:id/messages', requireAuth, ctrl.getMessages);
router.post('/:id/messages', requireAuth, sanitizeInputs, ctrl.sendMessage);
module.exports = router;

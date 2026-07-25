const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationsController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, ctrl.getNotifications);
router.get('/unread-count', requireAuth, ctrl.getUnreadCount);
router.post('/mark-all-read', requireAuth, ctrl.markAllRead);
router.patch('/:id/read', requireAuth, ctrl.markRead);
module.exports = router;

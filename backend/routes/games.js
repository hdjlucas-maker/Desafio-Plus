const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/gamesController');
const { requireAuth } = require('../middleware/auth');

router.post('/session', requireAuth, ctrl.recordSession);
router.get('/leaderboard', ctrl.getLeaderboard);
router.get('/my-history', requireAuth, ctrl.getUserGameHistory);
router.get('/my-stats', requireAuth, ctrl.getGameStats);
module.exports = router;

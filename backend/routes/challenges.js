const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/challengesController');
const { requireAuth } = require('../middleware/auth');

router.get('/daily', requireAuth, ctrl.getDailyChallenges);
router.get('/', requireAuth, ctrl.getAllChallenges);
router.post('/complete', requireAuth, ctrl.completeChallenge);
router.get('/my-history', requireAuth, ctrl.getUserCompletions);
router.post('/ai-generate', requireAuth, ctrl.generateAIChallenges);
router.get('/:id/tip', requireAuth, ctrl.getChallengeTip);
module.exports = router;

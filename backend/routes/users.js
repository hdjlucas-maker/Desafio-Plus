const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usersController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { sanitizeInputs } = require('../middleware/sanitize');

router.get('/suggestions', requireAuth, ctrl.getSuggestions);
router.get('/ranking', optionalAuth, ctrl.getRanking);
router.get('/:username', optionalAuth, ctrl.getProfile);
router.put('/me/profile', requireAuth, sanitizeInputs, ctrl.updateProfile);
router.get('/:username/posts', optionalAuth, ctrl.getUserPosts);
router.post('/:username/follow', requireAuth, ctrl.followUser);
router.get('/:username/followers', optionalAuth, ctrl.getFollowers);
router.get('/:username/following', optionalAuth, ctrl.getFollowing);
router.post('/:username/block', requireAuth, ctrl.blockUser);
module.exports = router;

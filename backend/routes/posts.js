const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/postsController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { sanitizeInputs } = require('../middleware/sanitize');

router.post('/', requireAuth, sanitizeInputs, ctrl.createPost);
router.get('/:id', optionalAuth, ctrl.getPost);
router.put('/:id', requireAuth, sanitizeInputs, ctrl.updatePost);
router.delete('/:id', requireAuth, ctrl.deletePost);
router.post('/:id/like', requireAuth, ctrl.likePost);
router.get('/:id/comments', optionalAuth, ctrl.getComments);
router.post('/:id/comments', requireAuth, sanitizeInputs, ctrl.addComment);
router.delete('/:id/comments/:commentId', requireAuth, ctrl.deleteComment);
module.exports = router;

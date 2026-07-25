const express = require('express');
const router = express.Router();
const postModel = require('../models/postModel');
const { requireAuth, optionalAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const posts = await postModel.getFeedPosts(req.user.id, +limit, +offset, req.d1);
    res.json(posts);
  } catch { res.status(500).json({ error: 'Erro ao buscar feed' }); }
});

router.get('/explore', optionalAuth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const posts = await postModel.getExplorePosts(req.user?.id, +limit, +offset, req.d1);
    res.json(posts);
  } catch { res.status(500).json({ error: 'Erro ao buscar explorar' }); }
});
module.exports = router;

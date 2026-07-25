/**
 * Desafio+ — Posts Controller
 */

const postModel = require('../models/postModel');
const notifModel = require('../models/notificationModel');
const userModel = require('../models/userModel');
const { moderateContent } = require('../config/openai');

async function createPost(req, res) {
  try {
    const { content, category, challenge_id, media_urls, media_type } = req.body;
    const d1 = req.d1 || null;

    if (!content || content.trim().length < 1) {
      return res.status(400).json({ error: 'Conteúdo não pode ser vazio' });
    }
    if (content.length > 2000) {
      return res.status(400).json({ error: 'Conteúdo muito longo (máx. 2000 chars)' });
    }

    // Moderação de conteúdo via IA
    const { safe, reason } = await moderateContent(content);
    if (!safe) {
      return res.status(422).json({ error: `Conteúdo não permitido: ${reason}` });
    }

    const post = await postModel.create({
      user_id: req.user.id,
      content: content.trim(),
      media_urls: media_urls || [],
      media_type: media_type || 'none',
      category: category || 'geral',
      challenge_id: challenge_id || null,
    }, d1);

    // XP por publicar
    await userModel.addXP(req.user.id, 10, 2, d1);

    res.status(201).json(post);
  } catch (err) {
    console.error('[POSTS] create:', err);
    res.status(500).json({ error: 'Erro ao criar post' });
  }
}

async function getPost(req, res) {
  try {
    const post = await postModel.findById(req.params.id, req.user?.id, req.d1);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar post' });
  }
}

async function updatePost(req, res) {
  try {
    const { content, category } = req.body;
    const post = await postModel.update(req.params.id, req.user.id, { content, category }, req.d1);
    if (!post) return res.status(404).json({ error: 'Post não encontrado ou sem permissão' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar post' });
  }
}

async function deletePost(req, res) {
  try {
    const result = await postModel.softDelete(req.params.id, req.user.id, req.d1);
    if (!result.changes) return res.status(404).json({ error: 'Post não encontrado ou sem permissão' });
    res.json({ message: 'Post removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover post' });
  }
}

async function likePost(req, res) {
  try {
    const post = await postModel.findById(req.params.id, null, req.d1);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });

    const result = await postModel.toggleLike(req.user.id, req.params.id, req.d1);

    // Notifica o autor se curtiu
    if (result.liked && post.user_id !== req.user.id) {
      await notifModel.create({
        user_id: post.user_id,
        actor_id: req.user.id,
        type: 'like',
        entity_type: 'post',
        entity_id: post.id,
        message: `${req.user.display_name} curtiu seu post`,
      }, req.d1);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao curtir post' });
  }
}

async function getComments(req, res) {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const comments = await postModel.getComments(req.params.id, +limit, +offset, req.d1);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar comentários' });
  }
}

async function addComment(req, res) {
  try {
    const { content, parent_id } = req.body;
    if (!content || content.trim().length < 1) {
      return res.status(400).json({ error: 'Comentário não pode ser vazio' });
    }

    const post = await postModel.findById(req.params.id, null, req.d1);
    if (!post) return res.status(404).json({ error: 'Post não encontrado' });

    const comment = await postModel.addComment(req.params.id, req.user.id, content.trim(), parent_id || null, req.d1);

    // Notifica o autor do post
    if (post.user_id !== req.user.id) {
      await notifModel.create({
        user_id: post.user_id,
        actor_id: req.user.id,
        type: 'comment',
        entity_type: 'post',
        entity_id: post.id,
        message: `${req.user.display_name} comentou no seu post`,
      }, req.d1);
    }

    // XP por comentar
    await userModel.addXP(req.user.id, 5, 1, req.d1);

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao comentar' });
  }
}

async function deleteComment(req, res) {
  try {
    const ok = await postModel.deleteComment(req.params.commentId, req.user.id, req.d1);
    if (!ok) return res.status(404).json({ error: 'Comentário não encontrado ou sem permissão' });
    res.json({ message: 'Comentário removido' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover comentário' });
  }
}

module.exports = { createPost, getPost, updatePost, deletePost, likePost, getComments, addComment, deleteComment };

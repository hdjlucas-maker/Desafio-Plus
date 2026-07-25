/**
 * Desafio+ — Chat Controller
 */

const chatModel = require('../models/chatModel');
const userModel = require('../models/userModel');
const notifModel = require('../models/notificationModel');

async function getConversations(req, res) {
  try {
    const conversations = await chatModel.getUserConversations(req.user.id, req.d1);
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
}

async function getOrCreateConversation(req, res) {
  try {
    const { username } = req.params;
    const d1 = req.d1 || null;
    const peer = await userModel.findByUsername(username, d1);
    if (!peer) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (peer.id === req.user.id) return res.status(400).json({ error: 'Não pode conversar consigo mesmo' });

    const conv = await chatModel.getOrCreateConversation(req.user.id, peer.id, d1);
    res.json({ ...conv, peer });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao abrir conversa' });
  }
}

async function getMessages(req, res) {
  try {
    const { id } = req.params;
    const { limit = 50, before } = req.query;
    const messages = await chatModel.getMessages(id, +limit, before || null, req.d1);
    // Marca como lido
    await chatModel.markConversationRead(id, req.user.id, req.d1);
    res.json(messages.reverse()); // Ordem cronológica
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
}

async function sendMessage(req, res) {
  try {
    const { id: conversation_id } = req.params;
    const { content, media_url, media_type } = req.body;
    const d1 = req.d1 || null;

    if (!content || content.trim().length < 1) {
      return res.status(400).json({ error: 'Mensagem não pode ser vazia' });
    }
    if (content.length > 1000) {
      return res.status(400).json({ error: 'Mensagem muito longa (máx. 1000 chars)' });
    }

    const message = await chatModel.sendMessage({
      conversation_id,
      sender_id: req.user.id,
      content: content.trim(),
      media_url: media_url || null,
      media_type: media_type || 'text',
    }, d1);

    // Notifica o destinatário
    const { queryOne } = require('../config/db');
    const conv = await queryOne('SELECT * FROM conversations WHERE id = ?', [conversation_id], d1);
    if (conv) {
      const recipientId = conv.user1_id === req.user.id ? conv.user2_id : conv.user1_id;
      await notifModel.create({
        user_id: recipientId,
        actor_id: req.user.id,
        type: 'message',
        entity_type: 'conversation',
        entity_id: conversation_id,
        message: `${req.user.display_name} enviou uma mensagem`,
      }, d1);
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
}

module.exports = { getConversations, getOrCreateConversation, getMessages, sendMessage };

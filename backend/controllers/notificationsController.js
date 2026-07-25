/**
 * Desafio+ — Notifications Controller
 */

const notifModel = require('../models/notificationModel');

async function getNotifications(req, res) {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const notifications = await notifModel.getForUser(req.user.id, +limit, +offset, req.d1);
    const unread = await notifModel.getUnreadCount(req.user.id, req.d1);
    res.json({ notifications, unread_count: unread });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
}

async function markAllRead(req, res) {
  try {
    await notifModel.markAllRead(req.user.id, req.d1);
    res.json({ message: 'Notificações marcadas como lidas' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao marcar notificações' });
  }
}

async function markRead(req, res) {
  try {
    await notifModel.markRead(req.params.id, req.user.id, req.d1);
    res.json({ message: 'Notificação marcada como lida' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao marcar notificação' });
  }
}

async function getUnreadCount(req, res) {
  try {
    const count = await notifModel.getUnreadCount(req.user.id, req.d1);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar contagem' });
  }
}

module.exports = { getNotifications, markAllRead, markRead, getUnreadCount };

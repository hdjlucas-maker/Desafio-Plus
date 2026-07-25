/**
 * Desafio+ — useNotifications hook
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await notificationsAPI.getUnreadCount();
      setUnreadCount(data.count);
    } catch {}
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {} finally {
      setLoading(false);
    }
  }, [user]);

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  // Polling a cada 30s
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  return { notifications, unreadCount, loading, fetchNotifications, markAllRead };
}

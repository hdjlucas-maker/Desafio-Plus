import React, { useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ICONS = { like: '❤️', comment: '💬', follow: '👤', message: '📩', challenge: '🎯', badge: '🏆' };

export default function Notifications() {
  const { notifications, loading, fetchNotifications, markAllRead } = useNotifications();
  useEffect(() => { fetchNotifications(); }, []); // eslint-disable-line
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>🔔 Notificações</h1>
        <button className="btn btn-secondary" onClick={markAllRead} style={{ fontSize: '0.85rem' }}>Marcar todas como lidas</button>
      </div>
      {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>}
      {notifications.map(n => (
        <div key={n.id} className="card" style={{ marginBottom: '0.5rem', opacity: n.is_read ? 0.7 : 1, borderLeft: n.is_read ? '3px solid transparent' : '3px solid var(--purple)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>{ICONS[n.type] || '🔔'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9rem' }}>{n.message}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      ))}
      {!loading && notifications.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem' }}>🔔</div><p>Nenhuma notificação</p>
        </div>
      )}
    </div>
  );
}

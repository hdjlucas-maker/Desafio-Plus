// ============================================================
// OnlineNotification.js — Toast quando alguém fica online
// Polling a cada 30s em /presence/online
// Mostra apenas nick, nunca nome real
// Toast discreto no canto inferior direito com gradiente neon
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { presenceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL = 30_000; // 30 segundos
const TOAST_DURATION = 5_000; // 5 segundos visível

const styles = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    pointerEvents: 'none',
  },
  toast: {
    background: 'linear-gradient(135deg, rgba(124,58,237,0.95) 0%, rgba(236,72,153,0.9) 100%)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '0.875rem',
    fontFamily: 'Nunito, sans-serif',
    fontWeight: 600,
    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '220px',
    maxWidth: '300px',
    pointerEvents: 'auto',
    animation: 'slideInRight 0.3s ease',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(255,255,255,0.3)',
    flexShrink: 0,
  },
  avatarFallback: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    flexShrink: 0,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4ade80',
    flexShrink: 0,
    boxShadow: '0 0 6px #4ade80',
  },
};

// Injeta keyframes uma vez
if (typeof document !== 'undefined' && !document.getElementById('online-notif-styles')) {
  const style = document.createElement('style');
  style.id = 'online-notif-styles';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(120%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

const Toast = ({ user }) => (
  <div style={styles.toast} role="status" aria-live="polite">
    {user.avatar_url ? (
      <img src={user.avatar_url} alt="" style={styles.avatar} />
    ) : (
      <div style={styles.avatarFallback}>🎮</div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        @{user.username}
      </div>
      <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
        {user.state ? `📍 ${user.state} · ` : ''}ficou online
      </div>
    </div>
    <div style={styles.dot} title="Online agora" />
  </div>
);

const OnlineNotification = () => {
  const { user: me } = useAuth();
  const [toasts, setToasts] = useState([]);
  const seenIds = useRef(new Set());
  const timerRefs = useRef({});

  const addToast = useCallback((user) => {
    const id = user.id;
    if (seenIds.current.has(id)) return;
    seenIds.current.add(id);

    setToasts(prev => [...prev, user]);

    // Remove após TOAST_DURATION
    timerRefs.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(u => u.id !== id));
      delete timerRefs.current[id];
    }, TOAST_DURATION);
  }, []);

  useEffect(() => {
    if (!me) return;

    // Envia heartbeat imediatamente
    presenceAPI.heartbeat('').catch(() => {});

    const poll = async () => {
      try {
        const { data } = await presenceAPI.getOnline();
        const online = data?.online || [];

        // Mostra toast apenas para quem ficou online desde a última checagem
        for (const u of online) {
          addToast(u);
        }
      } catch {
        // Silencioso — não quebra a UI se o endpoint não existir ainda
      }
    };

    // Primeira checagem após 5s (deixa o app carregar)
    const firstTimeout = setTimeout(poll, 5_000);
    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
      Object.values(timerRefs.current).forEach(clearTimeout);
    };
  }, [me, addToast]);

  if (!me || toasts.length === 0) return null;

  return (
    <div style={styles.container} aria-label="Notificações de presença">
      {toasts.map(user => (
        <Toast key={user.id} user={user} />
      ))}
    </div>
  );
};

export default OnlineNotification;

// ============================================================
// BlockButton.js — Botão de Bloquear/Desbloquear usuário
// Adicione este componente na página de perfil de outros usuários
// ============================================================
import React, { useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8787';

const BlockButton = ({ targetUserId, targetUsername, token, onBlock }) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    if (isBlocked) {
      // Desbloquear
      if (!window.confirm(`Desbloquear @${targetUsername}?`)) return;
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/users/${targetUserId}/block`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setIsBlocked(false);
          onBlock && onBlock('unblocked');
        }
      } catch (err) {
        alert('Erro ao desbloquear. Tente novamente.');
      } finally {
        setLoading(false);
      }
    } else {
      // Bloquear
      if (!window.confirm(`Bloquear @${targetUsername}? Ele não poderá ver seu perfil ou interagir com você.`)) return;
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/users/${targetUserId}/block`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setIsBlocked(true);
          onBlock && onBlock('blocked');
        }
      } catch (err) {
        alert('Erro ao bloquear. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleBlock}
      disabled={loading}
      style={{
        padding: '8px 16px',
        borderRadius: '8px',
        border: isBlocked ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.4)',
        background: 'transparent',
        color: isBlocked ? '#86efac' : '#fca5a5',
        fontSize: '0.85rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
    >
      {loading ? '⏳' : isBlocked ? '✅ Desbloqueado' : '🚫 Bloquear'}
    </button>
  );
};

export default BlockButton;

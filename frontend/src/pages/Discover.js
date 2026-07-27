// ============================================================
// Discover.js — Página "Descobrir Pessoas"
// Seções: Perto de você, Online agora, Jogadores disponíveis
// Mostra apenas nick e avatar — NUNCA nome real
// Dark mode com gradientes neon do projeto
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { suggestionsAPI, presenceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Estilos inline (sem CSS externo para não conflitar) ───────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#0d0d1a',
    color: '#f1f5f9',
    fontFamily: 'Nunito, sans-serif',
    paddingBottom: '2rem',
  },
  header: {
    background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(236,72,153,0.15) 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '1.5rem 1rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 800,
    fontFamily: 'Poppins, sans-serif',
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '0.95rem',
    marginTop: '0.25rem',
  },
  content: {
    maxWidth: '680px',
    margin: '0 auto',
    padding: '1.5rem 1rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    fontFamily: 'Poppins, sans-serif',
    color: '#f1f5f9',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: 'linear-gradient(135deg, rgba(26,26,46,0.9) 0%, rgba(30,30,53,0.9) 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '1.25rem 1rem',
    textAlign: 'center',
    transition: 'border-color 0.2s, transform 0.2s',
    cursor: 'default',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(168,85,247,0.5)',
    margin: '0 auto 0.75rem',
    display: 'block',
  },
  avatarFallback: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.75rem',
    margin: '0 auto 0.75rem',
  },
  username: {
    fontWeight: 700,
    fontSize: '0.95rem',
    color: '#f1f5f9',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  state: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '0.2rem',
  },
  onlineDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4ade80',
    boxShadow: '0 0 6px #4ade80',
    marginRight: '4px',
  },
  btnRow: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.75rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnChat: {
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.4rem 0.75rem',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: '36px',
    fontFamily: 'inherit',
  },
  btnGame: {
    background: 'linear-gradient(135deg, #ec4899, #f97316)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.4rem 0.75rem',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: '36px',
    fontFamily: 'inherit',
  },
  empty: {
    color: '#64748b',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '2rem 0',
  },
  loading: {
    color: '#94a3b8',
    textAlign: 'center',
    padding: '2rem 0',
  },
  heartbeatBtn: {
    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: '48px',
    fontFamily: 'inherit',
    display: 'block',
    margin: '0 auto 1.5rem',
  },
};

// ── Componente de card de usuário ─────────────────────────────────────────
const UserCard = ({ user, onChat, onInvite }) => (
  <div style={S.card}>
    {user.avatar_url ? (
      <img src={user.avatar_url} alt="" style={S.avatar} />
    ) : (
      <div style={S.avatarFallback}>🎮</div>
    )}
    <div style={S.username}>@{user.username}</div>
    {user.state && <div style={S.state}>📍 {user.state}</div>}
    <div style={S.btnRow}>
      <button style={S.btnChat} onClick={() => onChat(user)} title="Iniciar conversa">
        💬 Chat
      </button>
      <button style={S.btnGame} onClick={() => onInvite(user)} title="Convidar para jogar">
        🎮 Jogar
      </button>
    </div>
  </div>
);

// ── Página principal ──────────────────────────────────────────────────────
const Discover = () => {
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [nearby,  setNearby]  = useState([]);
  const [online,  setOnline]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [myState, setMyState] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nearbyRes, onlineRes] = await Promise.allSettled([
        suggestionsAPI.getNearby(),
        suggestionsAPI.getOnline(),
      ]);

      if (nearbyRes.status === 'fulfilled') {
        setNearby(nearbyRes.value.data?.suggestions || []);
        setMyState(nearbyRes.value.data?.myState || '');
      }
      if (onlineRes.status === 'fulfilled') {
        setOnline(onlineRes.value.data?.online || []);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSetState = async () => {
    const state = prompt('Digite seu estado (ex: SP, RJ, MG):');
    if (!state) return;
    try {
      await presenceAPI.heartbeat(state.toUpperCase().trim());
      alert('Estado atualizado! Recarregando sugestões...');
      load();
    } catch {
      alert('Erro ao atualizar estado.');
    }
  };

  const handleChat = (user) => navigate(`/chat/${user.username}`);

  const handleInvite = (user) => {
    alert(`Convite enviado para @${user.username}! 🎮\n\n(Funcionalidade de convite em desenvolvimento)`);
  };

  // Remove duplicatas entre seções
  const nearbyIds = new Set(nearby.map(u => u.id));
  const onlineOnly = online.filter(u => !nearbyIds.has(u.id));

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>🌎 Descobrir Pessoas</h1>
        <p style={S.subtitle}>Conecte-se com jogadores da sua região e online agora</p>
      </div>

      <div style={S.content}>
        {/* Botão para definir estado */}
        <button style={S.heartbeatBtn} onClick={handleSetState}>
          📍 {myState ? `Meu estado: ${myState} (alterar)` : 'Definir meu estado/região'}
        </button>

        {loading ? (
          <div style={S.loading}>Buscando pessoas... ⏳</div>
        ) : (
          <>
            {/* Seção: Perto de você */}
            <div style={S.section}>
              <div style={S.sectionTitle}>
                📍 Perto de você
                {myState && <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 400 }}>
                  — {myState}
                </span>}
              </div>
              {nearby.length === 0 ? (
                <div style={S.empty}>
                  Ninguém da sua região online agora.<br />
                  <small>Defina seu estado acima para ver pessoas próximas.</small>
                </div>
              ) : (
                <div style={S.grid}>
                  {nearby.map(u => (
                    <UserCard key={u.id} user={u} onChat={handleChat} onInvite={handleInvite} />
                  ))}
                </div>
              )}
            </div>

            {/* Seção: Online agora */}
            <div style={S.section}>
              <div style={S.sectionTitle}>
                <span style={S.onlineDot} />
                Online agora
              </div>
              {onlineOnly.length === 0 ? (
                <div style={S.empty}>Ninguém mais online no momento.</div>
              ) : (
                <div style={S.grid}>
                  {onlineOnly.map(u => (
                    <UserCard key={u.id} user={u} onChat={handleChat} onInvite={handleInvite} />
                  ))}
                </div>
              )}
            </div>

            {/* Seção: Jogadores disponíveis (todos juntos) */}
            {nearby.length === 0 && onlineOnly.length === 0 && (
              <div style={S.empty}>
                🎮 Nenhum jogador online agora.<br />
                <small>Volte mais tarde ou convide amigos!</small>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Discover;

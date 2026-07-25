// ============================================================
// PrivacySettings.js — CORRIGIDO
// PROBLEMA: import { AuthContext } + useContext(AuthContext)
// SOLUÇÃO:  import { useAuth } + useAuth()
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ CORRETO
import '../styles/PrivacySettings.css';

const PrivacySettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ CORRETO — sem useContext, sem AuthContext

  const API = process.env.REACT_APP_API_URL || 'http://localhost:8787';

  const [settings, setSettings] = useState({
    profile_public: true,
    show_online: true,
    allow_messages: 'everyone', // 'everyone' | 'followers' | 'nobody'
    show_in_search: true,
  });

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // ── Carrega configurações e lista de bloqueados ───────────
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/users/privacy-settings`, { headers }).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/users/blocked`, { headers }).then(r => r.json()).catch(() => ({ blocked: [] })),
    ]).then(([privData, blockData]) => {
      if (privData && !privData.error) {
        setSettings(prev => ({ ...prev, ...privData }));
      }
      setBlockedUsers(blockData?.blocked || []);
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Salva configurações ───────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API}/api/users/privacy-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        showToast('✅ Configurações salvas!');
      } else {
        showToast('❌ Erro ao salvar. Tente novamente.');
      }
    } catch {
      showToast('❌ Sem conexão com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  // ── Desbloquear usuário ───────────────────────────────────
  const handleUnblock = async (userId, username) => {
    const token = localStorage.getItem('access_token');
    try {
      await fetch(`${API}/api/users/${userId}/unblock`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      showToast(`✅ @${username} foi desbloqueado.`);
    } catch {
      showToast('❌ Erro ao desbloquear.');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="privacy-page">
        <div className="privacy-loading">
          <div className="privacy-spinner" />
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="privacy-page">
      {/* Toast */}
      {toast && <div className="privacy-toast">{toast}</div>}

      <div className="privacy-container">
        {/* Header */}
        <div className="privacy-header">
          <button className="privacy-back" onClick={() => navigate('/settings')}>
            ← Voltar
          </button>
          <h1 className="privacy-title">🔒 Privacidade</h1>
          <p className="privacy-subtitle">Controle quem pode ver seu perfil e interagir com você</p>
        </div>

        {/* Seção: Visibilidade do Perfil */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">👤 Visibilidade do Perfil</h2>

          <div className="privacy-item">
            <div className="privacy-item-info">
              <span className="privacy-item-label">Perfil público</span>
              <span className="privacy-item-desc">
                {settings.profile_public
                  ? 'Qualquer pessoa pode ver seu perfil'
                  : 'Apenas seus seguidores podem ver seu perfil'}
              </span>
            </div>
            <button
              className={`privacy-toggle ${settings.profile_public ? 'active' : ''}`}
              onClick={() => toggle('profile_public')}
              aria-label="Alternar perfil público"
            >
              <span className="privacy-toggle-thumb" />
            </button>
          </div>

          <div className="privacy-item">
            <div className="privacy-item-info">
              <span className="privacy-item-label">Aparecer nas buscas</span>
              <span className="privacy-item-desc">
                {settings.show_in_search
                  ? 'Seu perfil aparece nos resultados de busca'
                  : 'Seu perfil não aparece nas buscas'}
              </span>
            </div>
            <button
              className={`privacy-toggle ${settings.show_in_search ? 'active' : ''}`}
              onClick={() => toggle('show_in_search')}
              aria-label="Alternar visibilidade na busca"
            >
              <span className="privacy-toggle-thumb" />
            </button>
          </div>

          <div className="privacy-item">
            <div className="privacy-item-info">
              <span className="privacy-item-label">Mostrar status online</span>
              <span className="privacy-item-desc">
                {settings.show_online
                  ? 'Outros usuários podem ver quando você está online'
                  : 'Seu status online fica oculto'}
              </span>
            </div>
            <button
              className={`privacy-toggle ${settings.show_online ? 'active' : ''}`}
              onClick={() => toggle('show_online')}
              aria-label="Alternar status online"
            >
              <span className="privacy-toggle-thumb" />
            </button>
          </div>
        </div>

        {/* Seção: Mensagens */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">💬 Mensagens Privadas</h2>
          <p className="privacy-section-desc">Quem pode te enviar mensagens diretas?</p>

          <div className="privacy-radio-group">
            {[
              { value: 'everyone', label: '🌍 Todos', desc: 'Qualquer usuário pode te enviar mensagem' },
              { value: 'followers', label: '👥 Apenas seguidores', desc: 'Somente quem você segue de volta' },
              { value: 'nobody', label: '🚫 Ninguém', desc: 'Desativar mensagens privadas' },
            ].map(opt => (
              <label key={opt.value} className={`privacy-radio ${settings.allow_messages === opt.value ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="allow_messages"
                  value={opt.value}
                  checked={settings.allow_messages === opt.value}
                  onChange={() => setSettings(prev => ({ ...prev, allow_messages: opt.value }))}
                />
                <div className="privacy-radio-content">
                  <span className="privacy-radio-label">{opt.label}</span>
                  <span className="privacy-radio-desc">{opt.desc}</span>
                </div>
                {settings.allow_messages === opt.value && (
                  <span className="privacy-radio-check">✓</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Seção: Usuários Bloqueados */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">🚫 Usuários Bloqueados</h2>
          <p className="privacy-section-desc">
            Usuários bloqueados não podem ver seu perfil, posts ou te enviar mensagens.
          </p>

          {blockedUsers.length === 0 ? (
            <div className="privacy-empty">
              <span style={{ fontSize: '2rem' }}>✅</span>
              <p>Nenhum usuário bloqueado</p>
            </div>
          ) : (
            <div className="privacy-blocked-list">
              {blockedUsers.map(u => (
                <div key={u.id} className="privacy-blocked-item">
                  <div className="privacy-blocked-avatar">
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt={u.username} />
                      : <span>{(u.display_name || u.username || '?')[0].toUpperCase()}</span>
                    }
                  </div>
                  <div className="privacy-blocked-info">
                    <span className="privacy-blocked-name">{u.display_name || u.username}</span>
                    <span className="privacy-blocked-username">@{u.username}</span>
                  </div>
                  <button
                    className="privacy-unblock-btn"
                    onClick={() => handleUnblock(u.id, u.username)}
                  >
                    Desbloquear
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão Salvar */}
        <div className="privacy-actions">
          <button
            className="privacy-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '⏳ Salvando...' : '💾 Salvar configurações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;

/**
 * Desafio+ — Navbar Component
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { searchAPI } from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQ, setSearchQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 'var(--navbar-h)',
      background: 'rgba(13,13,26,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 1rem', gap: '1rem',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <span style={{ fontSize: '1.5rem' }}>🎯</span>
        <span className="gradient-text" style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.1rem' }}>
          Desafio+
        </span>
      </Link>

      {/* Search */}
      {user && (
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 320 }}>
          <input
            className="input"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="🔍 Buscar usuários, posts..."
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          />
        </form>
      )}

      {/* Nav links */}
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
          <NavBtn to="/feed" icon="🏠" label="Feed" active={isActive('/feed')} />
          <NavBtn to="/explore" icon="🔭" label="Explorar" active={isActive('/explore')} />
          <NavBtn to="/challenges" icon="🎯" label="Desafios" active={isActive('/challenges')} />
          <NavBtn to="/games" icon="🎮" label="Jogos" active={isActive('/games')} />
          <NavBtn to="/chat" icon="💬" label="Chat" active={isActive('/chat')} />
          <NavBtn to="/notifications" icon="🔔" label="Notificações" active={isActive('/notifications')} badge={unreadCount} />

          {/* Avatar menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--bg-hover)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)', padding: '0.3rem 0.75rem',
                color: 'var(--text-primary)', cursor: 'pointer',
              }}
            >
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" className="avatar avatar-sm" />
                : <span style={{ fontSize: '1.2rem' }}>👤</span>
              }
              <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'none' }}
                className="hide-mobile">{user.username}</span>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '110%',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '0.5rem',
                minWidth: 180, boxShadow: 'var(--shadow-lg)', zIndex: 200,
              }}>
                <MenuItem to={`/profile/${user.username}`} icon="👤" label="Meu Perfil" onClick={() => setMenuOpen(false)} />
                <MenuItem to="/settings" icon="⚙️" label="Configurações" onClick={() => setMenuOpen(false)} />
                <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                    color: '#ef4444', fontSize: '0.9rem', cursor: 'pointer',
                    background: 'none', border: 'none',
                  }}
                >
                  🚪 Sair
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Entrar</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Cadastrar</Link>
        </div>
      )}
    </nav>
  );
}

function NavBtn({ to, icon, label, active, badge }) {
  return (
    <Link to={to} style={{ position: 'relative' }}>
      <button style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--bg-hover)' : 'none',
        color: active ? 'var(--purple-light)' : 'var(--text-secondary)',
        border: 'none', cursor: 'pointer', fontSize: '1.2rem',
        transition: 'var(--transition)',
      }}>
        {icon}
        {badge > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#ef4444', color: 'white',
            borderRadius: '50%', width: 16, height: 16,
            fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700,
          }}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>
    </Link>
  );
}

function MenuItem({ to, icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
      color: 'var(--text-primary)', fontSize: '0.9rem',
      transition: 'var(--transition)',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
    onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {icon} {label}
    </Link>
  );
}

/**
 * Desafio+ — Navbar Component
 * Desktop: top bar com logo, busca, nav links, avatar menu
 * Mobile (<=768px): top bar simplificado + bottom nav fixo
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
// REMOVIDO: searchAPI foi retirado daqui para corrigir o erro do ESLint

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
    <>
      {/* ── Top Bar (sempre visível) ── */}
      <nav className="navbar-top" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.75rem 1.5rem' }}>
        <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span>
          <span className="gradient-text" style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.1rem' }}>
            Desafio+
          </span>
        </Link>

        {user && (
          <form onSubmit={handleSearch} className="navbar-search" style={{ flex: 1, maxWidth: '320px' }}>
            <input
              className="input"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="🔍 Buscar..."
              style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            />
          </form>
        )}

        {user ? (
          <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginLeft: 'auto' }}>
            {/* Desktop nav links — adicionado gap de 0.5rem para afastar os botões */}
            <div className="navbar-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <NavBtn to="/feed" icon="🏠" label="Feed" active={isActive('/feed')} />
              <NavBtn to="/explore" icon="🔭" label="Explorar" active={isActive('/explore')} />
              <NavBtn to="/challenges" icon="🎯" label="Desafios" active={isActive('/challenges')} />
              <NavBtn to="/games" icon="🎮" label="Jogos" active={isActive('/games')} />
              <NavBtn to="/chat" icon="💬" label="Chat" active={isActive('/chat')} />
              <NavBtn to="/notifications" icon="🔔" label="Notif." active={isActive('/notifications')} badge={unreadCount} />
            </div>

            {/* Avatar menu — com sutil espaçamento interno */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="navbar-avatar-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" className="avatar avatar-sm" />
                  : <span style={{ fontSize: '1.2rem' }}>👤</span>
                }
                <span className="hide-mobile" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {user.username}
                </span>
              </button>

              {menuOpen && (
                <div className="navbar-dropdown" style={{ zIndex: 10 }}>
                  <MenuItem to={`/profile/${user.username}`} icon="👤" label="Meu Perfil" onClick={() => setMenuOpen(false)} />
                  <MenuItem to="/settings" icon="⚙️" label="Configurações" onClick={() => setMenuOpen(false)} />
                  <MenuItem to="/discover" icon="🌍" label="Descobrir Pessoas" onClick={() => setMenuOpen(false)} />
                  <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />
                  <button onClick={handleLogout} className="navbar-logout-btn">
                    🚪 Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Entrar</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Cadastrar</Link>
          </div>
        )}
      </nav>

      {/* ── Bottom Nav (mobile only, user logged in) ── */}
      {user && (
        <nav className="navbar-bottom">
          <BottomNavBtn to="/feed" icon="🏠" active={isActive('/feed')} badge={0} />
          <BottomNavBtn to="/explore" icon="🔍" active={isActive('/explore')} badge={0} />
          <BottomNavBtn to="/challenges" icon="🎯" active={isActive('/challenges')} badge={0} />
          <BottomNavBtn to="/games" icon="🎮" active={isActive('/games')} badge={0} />
          <BottomNavBtn to="/chat" icon="💬" active={isActive('/chat')} badge={0} />
          <BottomNavBtn to="/notifications" icon="🔔" active={isActive('/notifications')} badge={unreadCount} />
        </nav>
      )}
    </>
  );
}

function NavBtn({ to, icon, label, active, badge }) {
  return (
    <Link to={to} style={{ position: 'relative', textDecoration: 'none' }}>
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
          <span className="navbar-badge">{badge > 9 ? '9+' : badge}</span>
        )}
      </button>
    </Link>
  );
}

function BottomNavBtn({ to, icon, active, badge }) {
  return (
    <Link to={to} className="bottom-nav-item" style={{ color: active ? 'var(--purple-light)' : 'var(--text-muted)', textDecoration: 'none' }}>
      <span style={{ fontSize: '1.3rem', position: 'relative', display: 'inline-block' }}>
        {icon}
        {badge > 0 && (
          <span className="navbar-badge" style={{ top: -4, right: -8 }}>{badge > 9 ? '9+' : badge}</span>
        )}
      </span>
    </Link>
  );
}

function MenuItem({ to, icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="navbar-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {icon} {label}
    </Link>
  );
}

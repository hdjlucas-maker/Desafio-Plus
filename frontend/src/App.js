// ============================================================
// App.js — ATUALIZADO v7 (Com Correção de Espaçamento Global)
// Adicionado: rota /discover, OnlineNotification no layout
// Mantido: tudo o mais idêntico ao original
// ============================================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // ✅ useAuth, não AuthContext

// Páginas de autenticação
import Login from './pages/Login';
import Register from './pages/Register';
import GoogleCallback from './pages/GoogleCallback';
import ForgotPassword from './pages/ForgotPassword';

// Páginas principais
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Challenges from './pages/Challenges';
import Games from './pages/Games';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import Settings from './pages/Settings';
import PrivacySettings from './pages/PrivacySettings';
import Discover from './pages/Discover'; // ✅ NOVO
import Ranking from './pages/Ranking'; // ✅ NOVO

// Componentes
import Navbar from './components/Navbar';
import OnlineNotification from './components/OnlineNotification'; // ✅ NOVO

// ──────────────────────────────────────────────────────────────────────────
// Rota protegida — redireciona para /login se não autenticado
// ✅ usa useAuth() em vez de useContext(AuthContext)
// ──────────────────────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth(); // ✅ CORRETO
  if (loading) return <div className="app-loading">Carregando...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

// ──────────────────────────────────────────────────────────────────────────
// Rota pública — redireciona para /feed se já autenticado
// ✅ usa useAuth() em vez de useContext(AuthContext)
// ──────────────────────────────────────────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth(); // ✅ CORRETO
  if (loading) return <div className="app-loading">Carregando...</div>;
  return !user ? children : <Navigate to="/feed" replace />;
};

// ──────────────────────────────────────────────────────────────────────────
// Rotas da aplicação
// ✅ usa useAuth() em vez de useContext(AuthContext)
// ──────────────────────────────────────────────────────────────────────────
const AppRoutes = () => {
  const { user } = useAuth(); // ✅ CORRETO

  return (
    <>
      {user && <Navbar />}
      {user && <OnlineNotification />} {/* ✅ NOVO — toast de presença */}
      
      {/* 
        AJUSTE: Adicionada tag <main> com espaçamento dinâmico.
        Se o usuário estiver logado, cria uma margem segura para não colar na Navbar (desktop) 
        e na BottomNav (mobile).
      */}
      <main style={{ 
        padding: user ? '1.5rem 1rem 5rem 1rem' : '0', 
        maxWidth: user ? '1200px' : '100%', 
        margin: '0 auto',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}>
        <Routes>
          {/* ── Rotas públicas ── */}
          <Route path="/" element={<Navigate to={user ? '/feed' : '/login'} replace />} />

          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />

          <Route path="/register" element={
            <PublicRoute><Register /></PublicRoute>
          } />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Callback do Google OAuth — sempre acessível */}
          <Route path="/auth/google/callback" element={<GoogleCallback />} />

          {/* ── Rotas protegidas ── */}
          <Route path="/feed" element={
            <PrivateRoute><Feed /></PrivateRoute>
          } />

          <Route path="/explore" element={
            <PrivateRoute><Explore /></PrivateRoute>
          } />

          <Route path="/profile/:username?" element={
            <PrivateRoute><Profile /></PrivateRoute>
          } />

          <Route path="/chat" element={
            <PrivateRoute><Chat /></PrivateRoute>
          } />

          <Route path="/chat/:username" element={
            <PrivateRoute><Chat /></PrivateRoute>
          } />

          <Route path="/challenges" element={
            <PrivateRoute><Challenges /></PrivateRoute>
          } />

          <Route path="/games" element={
            <PrivateRoute><Games /></PrivateRoute>
          } />

          <Route path="/notifications" element={
            <PrivateRoute><Notifications /></PrivateRoute>
          } />

          <Route path="/search" element={
            <PrivateRoute><Search /></PrivateRoute>
          } />

          <Route path="/settings" element={
            <PrivateRoute><Settings /></PrivateRoute>
          } />

          <Route path="/settings/privacy" element={
            <PrivateRoute><PrivacySettings /></PrivateRoute>
          } />

          {/* ✅ NOVO — Página Descobrir Pessoas */}
          <Route path="/discover" element={
            <PrivateRoute><Discover /></PrivateRoute>
          } />

          {/* ✅ NOVO — Ranking */}
          <Route path="/ranking" element={
            <PrivateRoute><Ranking /></PrivateRoute>
          } />

          {/* 404 */}
          <Route path="*" element={
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', minHeight: '80vh', color: '#fff',
              background: '#0a0a1a', gap: '16px'
            }}>
              <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Página não encontrada</p>
              <a href="/feed" style={{ color: '#a855f7', textDecoration: 'none' }}>← Voltar ao Feed</a>
            </div>
          } />
        </Routes>
      </main>
    </>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// App raiz — AuthProvider envolve tudo
// ──────────────────────────────────────────────────────────────────────────
const App = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
    </Router>
  </AuthProvider>
);

export default App;

// ============================================================
// Login.js — CORRIGIDO v6
// Botão Google: mostra toast "Em breve" em vez de redirecionar
// para rota inexistente (evita erro silencioso)
// ============================================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleMsg, setGoogleMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      await login(form.email.trim().toLowerCase(), form.password);
      navigate('/feed');
    } catch (err) {
      console.error('Erro no login:', err);
      const msg = err?.response?.data?.error || err?.message || '';
      if (msg.includes('senha') || msg.includes('password') || msg.includes('credencial')) {
        setError('E-mail ou senha incorretos.');
      } else if (msg.includes('servidor') || !msg) {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth ainda não configurado — mostra aviso amigável
  const handleGoogleLogin = () => {
    setGoogleMsg('🔧 Login com Google ainda não está disponível. Use e-mail e senha por enquanto.');
    setTimeout(() => setGoogleMsg(''), 5000);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-text">Desafio<span className="logo-plus">+</span></span>
        </div>

        <h1 className="auth-title">Entrar</h1>
        <p className="auth-subtitle">Bem-vindo de volta! Continue seus desafios.</p>

        {error && (
          <div className="alert alert-error">
            <span>❌</span> {error}
          </div>
        )}

        {googleMsg && (
          <div className="alert alert-success" style={{ background: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.3)', color: '#c4b5fd' }}>
            {googleMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Sua senha"
              autoComplete="current-password"
            />
          </div>

          <div className="form-forgot">
            <Link to="/forgot-password" className="auth-link">Esqueci minha senha</Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" /> Entrando...
              </span>
            ) : (
              'Entrar 🎮'
            )}
          </button>
        </form>

        <div className="auth-divider"><span>ou</span></div>

        {/* Botão Google — desabilitado até OAuth ser configurado */}
        <button
          type="button"
          className="btn btn-google"
          onClick={handleGoogleLogin}
          title="Em breve — Login com Google ainda não configurado"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Entrar com Google
          <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: 4 }}>(em breve)</span>
        </button>

        <p className="auth-footer-text">
          Não tem conta?{' '}
          <Link to="/register" className="auth-link">Criar conta grátis</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

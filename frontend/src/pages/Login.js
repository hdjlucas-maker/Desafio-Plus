import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.head.querySelector('script[src*="accounts.google.com"]')?.remove();
  }, []);

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
            <span>✕</span> {error}
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
              'Entrar'
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          Não tem conta?{' '}
          <Link to="/register" className="auth-link">Criar conta grátis</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
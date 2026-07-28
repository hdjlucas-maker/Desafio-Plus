import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const Login = () => {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gError, setGError] = useState('');
  const googleContainerRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || initializedRef.current) return;
    initializedRef.current = true;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        if (!window.google?.accounts?.id) {
          setGError('Erro ao carregar Google. Recarregue a página.');
          return;
        }
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            setLoading(true);
            setError('');
            googleLogin(response.credential)
              .then(() => navigate('/feed'))
              .catch((err) => {
                setError(err?.response?.data?.error || 'Erro ao entrar com Google');
              })
              .finally(() => setLoading(false));
          },
        });
        const renderGoogleButton = () => {
          const containerWidth = googleContainerRef.current?.offsetWidth || 300;
          googleContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleContainerRef.current, {
            theme: 'outline',
            size: 'large',
            width: Math.min(containerWidth, 400),
            text: 'signin_with',
            shape: 'rectangular',
            locale: 'pt_BR',
          });
        };

        // Espera o layout estabilizar (fontes, rotação de tela) antes de medir
        requestAnimationFrame(renderGoogleButton);
        window.addEventListener('resize', renderGoogleButton);
        window.addEventListener('orientationchange', renderGoogleButton);
      } catch (e) {
        setGError('Google indisponível no momento. Tente de novo.');
        console.error('Google init error:', e);
      }
    };
    script.onerror = () => {
      setGError('Falha ao carregar Google. Verifique sua conexão.');
    };
    document.head.appendChild(script);
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

        {GOOGLE_CLIENT_ID ? (
          <>
            <div className="auth-divider"><span>ou</span></div>
            {gError ? (
              <div className="alert alert-error" style={{ fontSize: '0.85rem' }}>{gError}</div>
            ) : null}
            <div ref={googleContainerRef} style={{ width: '100%', minHeight: '48px' }} />
          </>
        ) : null}

        <p className="auth-footer-text">
          Não tem conta?{' '}
          <Link to="/register" className="auth-link">Criar conta grátis</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
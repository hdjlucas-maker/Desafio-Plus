import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Informe seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Erro ao processar solicitação.';
      setError(msg);
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

        <h1 className="auth-title">Esqueci minha senha</h1>
        <p className="auth-subtitle">
          Informe seu e-mail e enviaremos instruções para redefinir sua senha.
        </p>

        {error && (
          <div className="alert alert-error">
            <span>✕</span> {error}
          </div>
        )}

        {sent ? (
          <div className="alert alert-success">
            Se o e-mail existir na nossa base, você receberá as instruções em breve.
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">E-mail</label>
              <input
                id="forgot-email"
                className="form-input"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" /> Enviando...
                </span>
              ) : (
                'Enviar instruções'
              )}
            </button>
          </form>
        )}

        <p className="auth-footer-text">
          Lembrou a senha?{' '}
          <Link to="/login" className="auth-link">Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
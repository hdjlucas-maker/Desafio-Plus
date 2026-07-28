import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import '../styles/Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Link inválido ou expirado. Solicite a recuperação novamente.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      toast.success('Senha alterada com sucesso! Faça login.');
      navigate('/login');
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Erro ao redefinir senha.';
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

        <h1 className="auth-title">Redefinir senha</h1>
        <p className="auth-subtitle">Escolha uma nova senha para sua conta.</p>

        {!token && (
          <div className="alert alert-error">
            <span>✕</span> Link inválido ou expirado.
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span>✕</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reset-password">Nova senha</label>
            <input
              id="reset-password"
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-confirm-password">Confirmar nova senha</label>
            <input
              id="reset-confirm-password"
              className="form-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !token}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" /> Salvando...
              </span>
            ) : (
              'Salvar nova senha'
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          <Link to="/login" className="auth-link">Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
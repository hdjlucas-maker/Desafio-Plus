import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const InputField = ({ label, type, name, value, onChange, placeholder, hint, autoComplete }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input
      className="form-input"
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete || 'off'}
    />
    {hint && <span className="form-hint">{hint}</span>}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    display_name: '', username: '', email: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { display_name, username, email, password, confirmPassword } = form;

    if (!display_name.trim() || !username.trim() || !email.trim() || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, username.trim(), display_name.trim());
      navigate('/feed');
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Erro ao cadastrar';
      if (msg.includes('já')) {
        setError(msg);
      } else {
        setError('Erro ao criar conta. Tente novamente.');
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

        <h1 className="auth-title">Criar Conta</h1>
        <p className="auth-subtitle">Entre para o Desafio+ e comece sua jornada!</p>

        {error && (
          <div className="alert alert-error">
            <span>✕</span> {error}
          </div>
        )}

        <div className="alert alert-info" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
          Cadastre-se com e-mail e senha para participar.
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <InputField label="Nome" type="text" name="display_name" value={form.display_name} onChange={handleChange} placeholder="Seu nome completo" autoComplete="name" />
          <InputField label="Usuário" type="text" name="username" value={form.username} onChange={handleChange} placeholder="apelido" hint="Apenas letras, números e underscore" autoComplete="username" />
          <InputField label="E-mail" type="email" name="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" autoComplete="email" />
          <InputField label="Senha" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          <InputField label="Confirmar Senha" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repita a senha" autoComplete="new-password" />

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" /> Criando conta...
              </span>
            ) : (
              'Criar Conta'
            )}
          </button>
        </form>

        <p className="auth-footer-text">
          Já tem conta?{' '}
          <Link to="/login" className="auth-link">Fazer login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
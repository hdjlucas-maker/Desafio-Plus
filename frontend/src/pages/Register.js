// ============================================================
// Register.js — CORRIGIDO (dupla correção)
//
// BUG 1 CORRIGIDO: import { AuthContext } + useContext(AuthContext)
//   → substituído por import { useAuth } + useAuth()
//
// BUG 2 CORRIGIDO: InputField definido DENTRO do Register
//   → movido para FORA (evita re-criação a cada keystroke → perde foco)
//
// BUG 3 CORRIGIDO: login(token, user) → register(email, pass, username, name)
//   → usa o método register() do AuthContext que já salva tokens
// ============================================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ CORRETO
import '../styles/Auth.css';

// ✅ CORRETO: componente definido FORA do Register
// Se estivesse dentro, seria recriado a cada render → perde foco
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
  const { register } = useAuth(); // ✅ CORRETO — usa register() do AuthContext

  // ✅ Um único objeto de estado — evita múltiplos re-renders
  const [form, setForm] = useState({
    display_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ Handler genérico — usa name do input para atualizar o campo certo
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.display_name.trim()) return 'Nome completo é obrigatório.';
    if (!form.username.trim()) return 'Username é obrigatório.';
    if (!/^[a-z0-9._]{3,20}$/.test(form.username))
      return 'Username: 3-20 chars, letras minúsculas, números, . e _';
    if (!form.email.trim()) return 'E-mail é obrigatório.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'E-mail inválido.';
    if (form.password.length < 6) return 'Senha deve ter pelo menos 6 caracteres.';
    if (form.password !== form.confirmPassword) return 'As senhas não coincidem.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      // ✅ Usa register() do AuthContext — já salva tokens e seta user
      await register(
        form.email.trim().toLowerCase(),
        form.password,
        form.username.trim().toLowerCase(),
        form.display_name.trim()
      );
      setSuccess('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => navigate('/feed'), 1500);
    } catch (err) {
      console.error('Erro no cadastro:', err);
      const msg = err?.response?.data?.error || err?.message || '';
      if (msg.includes('email') || msg.includes('e-mail')) {
        setError('Este e-mail já está cadastrado.');
      } else if (msg.includes('username')) {
        setError('Este username já está em uso.');
      } else if (!msg) {
        setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const API = process.env.REACT_APP_API_URL || 'http://localhost:8787';
    window.location.href = `${API}/api/auth/google`;
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="logo-text">Desafio<span className="logo-plus">+</span></span>
        </div>

        <h1 className="auth-title">Criar conta</h1>
        <p className="auth-subtitle">Junte-se à comunidade e comece a se desafiar!</p>

        {/* Mensagens de feedback */}
        {error && (
          <div className="alert alert-error">
            <span>❌</span> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <span>✅</span> {success}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} noValidate>
          {/* ✅ Usando o componente externo com name= para o handler genérico */}
          <InputField
            label="Nome completo"
            type="text"
            name="display_name"
            value={form.display_name}
            onChange={handleChange}
            placeholder="Seu nome"
            autoComplete="name"
          />
          <InputField
            label="Username"
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="seu_username"
            hint="3-20 chars, letras minúsculas, números, . e _"
            autoComplete="username"
          />
          <InputField
            label="E-mail"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="seu@email.com"
            autoComplete="email"
          />
          <InputField
            label="Senha"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
          <InputField
            label="Confirmar senha"
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repita a senha"
            autoComplete="new-password"
          />

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
              'Criar conta grátis 🚀'
            )}
          </button>
        </form>

        {/* Divisor */}
        <div className="auth-divider">
          <span>ou</span>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          className="btn btn-google"
          onClick={handleGoogleLogin}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Cadastrar com Google
        </button>

        <p className="auth-footer-text">
          Já tem conta?{' '}
          <Link to="/login" className="auth-link">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

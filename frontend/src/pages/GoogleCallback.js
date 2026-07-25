// ============================================================
// GoogleCallback.js — CORRIGIDO
// PROBLEMA: import { AuthContext } + useContext(AuthContext)
// SOLUÇÃO:  import { useAuth } + useAuth()
//
// Esta página recebe o token do Google OAuth via query string
// e autentica o usuário automaticamente.
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ CORRETO

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { googleLogin } = useAuth(); // ✅ CORRETO — sem useContext, sem AuthContext

  const [status, setStatus] = useState('loading'); // 'loading' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      // Tenta pegar token da query string (?token=xxx ou ?code=xxx)
      const token = searchParams.get('token');
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      // Erro retornado pelo Google/backend
      if (error) {
        setErrorMsg('Login com Google cancelado ou negado.');
        setStatus('error');
        return;
      }

      // Fluxo 1: backend retorna JWT diretamente (?token=xxx)
      if (token) {
        try {
          await googleLogin(token);
          navigate('/feed', { replace: true });
        } catch (err) {
          console.error('Erro ao autenticar com Google:', err);
          setErrorMsg('Não foi possível autenticar com o Google. Tente novamente.');
          setStatus('error');
        }
        return;
      }

      // Fluxo 2: backend retorna código OAuth (?code=xxx) — troca pelo token
      if (code) {
        try {
          const API = process.env.REACT_APP_API_URL || 'http://localhost:8787';
          const res = await fetch(`${API}/api/auth/google/callback?code=${code}`);
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Erro no callback do Google');
          }

          await googleLogin(data.token || data.access_token);
          navigate('/feed', { replace: true });
        } catch (err) {
          console.error('Erro no callback Google:', err);
          setErrorMsg('Falha ao completar login com Google. Tente novamente.');
          setStatus('error');
        }
        return;
      }

      // Nenhum parâmetro válido
      setErrorMsg('Parâmetros inválidos no callback do Google.');
      setStatus('error');
    };

    handleCallback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading ──────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>
            Desafio<span style={styles.plus}>+</span>
          </div>
          <div style={styles.spinner} />
          <p style={styles.text}>Autenticando com Google...</p>
          <p style={styles.sub}>Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // ── Erro ─────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          Desafio<span style={styles.plus}>+</span>
        </div>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
        <h2 style={{ color: '#fff', marginBottom: '8px' }}>Falha no login</h2>
        <p style={styles.sub}>{errorMsg}</p>
        <button
          onClick={() => navigate('/login')}
          style={styles.btn}
        >
          Voltar ao Login
        </button>
      </div>
    </div>
  );
};

// ── Estilos inline (sem depender de CSS externo) ──────────
const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    padding: '48px 40px',
    textAlign: 'center',
    maxWidth: '360px',
    width: '90%',
  },
  logo: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#fff',
    marginBottom: '32px',
  },
  plus: {
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(168,85,247,0.2)',
    borderTop: '4px solid #a855f7',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 24px',
  },
  text: {
    color: '#fff',
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: '0 0 8px',
  },
  sub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.9rem',
    margin: '0 0 24px',
  },
  btn: {
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
  },
};

// Injeta keyframe de animação do spinner
const styleTag = document.createElement('style');
styleTag.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(styleTag);

export default GoogleCallback;

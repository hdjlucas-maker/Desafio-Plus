import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

const MODES = [
  { key: 'points', label: 'Pontos' },
  { key: 'xp', label: 'XP' },
  { key: 'streak', label: 'Streak' },
];

export default function Ranking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'points';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, [mode]);

  const loadRanking = async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.getRanking({ mode, limit: 50 });
      setRows(data);
    } catch (err) {
      toast.error('Não foi possível carregar o ranking.');
    } finally {
      setLoading(false);
    }
  };

  const setMode = (key) => {
    setSearchParams(key === 'points' ? {} : { mode: key });
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>🏆 Ranking</h1>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {MODES.map(m => (
          <button key={m.key} onClick={() => setMode(m.key)} className="btn" style={{
            background: mode === m.key ? 'var(--purple)' : 'var(--bg-card)',
            color: mode === m.key ? '#fff' : 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}>
            {m.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</div>}

      {!loading && rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Nenhum usuário neste ranking ainda.
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {rows.map((u, idx) => (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '0.75rem 1rem',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: idx < 3 ? 'var(--purple)' : 'var(--bg-secondary)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem'
            }}>
              {idx + 1}
            </div>
            <div className="avatar avatar-sm" style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
            }}>
              {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : '👤'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u.display_name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@{u.username} · Lvl {u.level}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: 'var(--purple-light)' }}>
                {mode === 'xp' ? u.xp : mode === 'streak' ? u.streak : u.points}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {mode === 'xp' ? 'XP' : mode === 'streak' ? 'Dias' : 'Pontos'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAPI } from '../services/api';

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length >= 2) {
      setLoading(true);
      searchAPI.search(q).then(({ data }) => setResults(data)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [q]);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>🔍 Resultados para "{q}"</h1>
      {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>}
      {results.users?.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>👤 Usuários</h2>
          {results.users.map(u => (
            <Link key={u.id} to={`/profile/${u.username}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="avatar avatar-md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)', fontSize: '1.2rem' }}>
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="avatar avatar-md" /> : '👤'}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{u.display_name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{u.username} · Nível {u.level}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {results.posts?.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>📝 Posts</h2>
          {results.posts.map(p => (
            <div key={p.id} className="card" style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.display_name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@{p.username}</span>
              </div>
              <p style={{ fontSize: '0.9rem' }}>{p.content.slice(0, 200)}{p.content.length > 200 ? '...' : ''}</p>
            </div>
          ))}
        </div>
      )}
      {!loading && !results.users?.length && !results.posts?.length && q.length >= 2 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem' }}>😕</div><p>Nenhum resultado encontrado</p>
        </div>
      )}
    </div>
  );
}

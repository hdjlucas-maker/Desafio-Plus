/**
 * Desafio+ — Profile Page
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';

const RARITY_COLORS = { comum: '#94a3b8', raro: '#60a5fa', epico: '#a78bfa', lendario: '#fbbf24' };

export default function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('posts');
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]); // eslint-disable-line

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        usersAPI.getProfile(username),
        usersAPI.getPosts(username),
      ]);
      setProfile(profileRes.data);
      setFollowing(profileRes.data.is_following);
      setPosts(postsRes.data);
    } catch { toast.error('Perfil não encontrado'); }
    finally { setLoading(false); }
  };

  const handleFollow = async () => {
    try {
      const { data } = await usersAPI.follow(username);
      setFollowing(data.following);
      setProfile(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          followers: data.following ? prev.stats.followers + 1 : prev.stats.followers - 1,
        },
      }));
    } catch { toast.error('Erro ao seguir'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <span className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (!profile) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem' }}>😕</div>
      <h3>Usuário não encontrado</h3>
    </div>
  );

  const isMe = me?.id === profile.id;
  const xpForNextLevel = profile.level * 500;
  const xpProgress = Math.min((profile.xp % 500) / 500 * 100, 100);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem' }}>
      {/* Profile Header */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" className="avatar avatar-xl" />
            : <div className="avatar avatar-xl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)', fontSize: '2.5rem' }}>👤</div>
          }
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.3rem' }}>{profile.display_name}</h2>
              <span style={{
                background: 'var(--grad-main)', color: 'white',
                borderRadius: 'var(--radius-full)', padding: '0.15rem 0.6rem',
                fontSize: '0.75rem', fontWeight: 700,
              }}>Nível {profile.level}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>@{profile.username}</p>
            {profile.bio && <p style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>{profile.bio}</p>}

            {/* XP Bar */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <span>⚡ {profile.xp} XP</span>
                <span>Próximo nível: {xpForNextLevel} XP</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${xpProgress}%`, background: 'var(--grad-main)', borderRadius: 3, transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
              {[
                { label: 'Posts', value: profile.stats?.posts || 0 },
                { label: 'Seguidores', value: profile.stats?.followers || 0 },
                { label: 'Seguindo', value: profile.stats?.following || 0 },
                { label: 'Desafios', value: profile.stats?.challenges_completed || 0 },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Streak & Points */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span className="badge badge-raro">🔥 {profile.streak} dias</span>
              <span className="badge badge-epico">⭐ {profile.points} pts</span>
            </div>

            {/* Actions */}
            {!isMe && (
              <button
                onClick={handleFollow}
                className={`btn ${following ? 'btn-secondary' : 'btn-primary'}`}
              >
                {following ? '✓ Seguindo' : '+ Seguir'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      {profile.badges?.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>🏆 Conquistas</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {profile.badges.map(b => (
              <div key={b.id} title={b.description} style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                background: 'var(--bg-hover)', borderRadius: 'var(--radius-full)',
                padding: '0.3rem 0.75rem', fontSize: '0.8rem',
                border: `1px solid ${RARITY_COLORS[b.rarity] || '#94a3b8'}22`,
                color: RARITY_COLORS[b.rarity] || '#94a3b8',
              }}>
                {b.icon} {b.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div>
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem' }}>📭</div>
            <p>Nenhum post ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}

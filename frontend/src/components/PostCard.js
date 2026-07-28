/**
 * Desafio+ — PostCard Component
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:8787/api').replace(/\/api\/?$/, '');

function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

const CATEGORY_LABELS = {
  geral: '🌐 Geral', solo: '🧘 Solo', a_dois: '💑 A Dois', turma: '🎉 Turma',
};

export default function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLike = async () => {
    try {
      const { data } = await postsAPI.like(post.id);
      setLiked(data.liked);
      setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
    } catch { toast.error('Erro ao curtir'); }
  };

  const loadComments = async () => {
    if (!showComments) {
      try {
        const { data } = await postsAPI.getComments(post.id);
        setComments(data);
      } catch {}
    }
    setShowComments(!showComments);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setLoadingComment(true);
    try {
      const { data } = await postsAPI.addComment(post.id, { content: commentText });
      setComments(prev => [...prev, data]);
      setCommentText('');
      onUpdate?.(post.id, { comments_count: post.comments_count + 1 });
    } catch { toast.error('Erro ao comentar'); }
    finally { setLoadingComment(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remover este post?')) return;
    try {
      await postsAPI.delete(post.id);
      onDelete?.(post.id);
      toast.success('Post removido');
    } catch { toast.error('Erro ao remover'); }
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR });

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <Link to={`/profile/${post.username}`} style={{ display: 'block', flexShrink: 0 }}>
          {post.avatar_url
            ? <img src={post.avatar_url} alt="" className="avatar avatar-md" />
            : <div className="avatar avatar-md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', background: 'var(--bg-hover)' }}>👤</div>
          }
        </Link>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <Link to={`/profile/${post.username}`} style={{ fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', color: 'inherit' }}>
            {post.display_name}
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>@{post.username}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>·</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{timeAgo}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-comum" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
            {CATEGORY_LABELS[post.category] || post.category}
          </span>
          {user?.id === post.user_id && (
            <div style={{ position: 'relative' }}>
              <button className="btn-ghost" onClick={() => setMenuOpen(!menuOpen)} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}>⋯</button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '120%',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '0.35rem',
                  zIndex: 10, minWidth: 130, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <button onClick={handleDelete} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.75rem',
                    color: '#ef4444', fontSize: '0.85rem', textAlign: 'left',
                    background: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                  }}>🗑️ Remover</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p style={{ marginBottom: '1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{post.content}</p>

      {/* Media */}
      {post.media_urls?.length > 0 && (
        <div style={{ marginBottom: '1rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {post.media_type === 'video'
            ? <video src={resolveMediaUrl(post.media_urls[0])} controls style={{ width: '100%', maxHeight: 420, objectFit: 'cover' }} />
            : <img src={resolveMediaUrl(post.media_urls[0])} alt="" style={{ width: '100%', maxHeight: 420, objectFit: 'cover' }} />
          }
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <ActionBtn
          icon={liked ? '❤️' : '🤍'}
          count={likesCount}
          onClick={handleLike}
          active={liked}
          label="Curtir"
        />
        <ActionBtn
          icon="💬"
          count={post.comments_count}
          onClick={loadComments}
          label="Comentar"
        />
        <ActionBtn
          icon="🔗"
          count={post.shares_count}
          onClick={() => { navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`); toast.success('Link copiado!'); }}
          label="Compartilhar"
        />
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div className="avatar avatar-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)', fontSize: '0.9rem', flexShrink: 0 }}>👤</div>
              <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.display_name} </span>
                <span style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{c.content}</span>
              </div>
            </div>
          ))}
          {user && (
            <form onSubmit={submitComment} style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <input
                className="input"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Escreva um comentário..."
                style={{ flex: 1, padding: '0.6rem 0.85rem', fontSize: '0.9rem' }}
              />
              <button type="submit" className="btn btn-primary" disabled={loadingComment} style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loadingComment ? '...' : '→'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, count, onClick, active, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.45rem',
        color: active ? 'var(--pink)' : 'var(--text-secondary)',
        fontSize: '0.9rem', background: 'none', border: 'none',
        cursor: 'pointer', padding: '0.4rem 0.5rem', borderRadius: 'var(--radius-sm)',
        transition: 'background 0.2s'
      }}
    >
      <span>{icon}</span>
      <span style={{ fontWeight: 600 }}>{count}</span>
    </button>
  );
}

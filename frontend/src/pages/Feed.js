/**
 * Desafio+ — Feed Page
 */

import React, { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useFeed } from '../hooks/useFeed';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { postsAPI, uploadAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Feed() {
  const { user } = useAuth();
  const { posts, loading, hasMore, fetchPosts, refresh, updatePost, removePost, prependPost } = useFeed('feed');
  const [postText, setPostText] = useState('');
  const [category, setCategory] = useState('geral');
  const [posting, setPosting] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);

  useEffect(() => { fetchPosts(true); }, []); // eslint-disable-line

  const handlePost = async (e) => {
    e.preventDefault();
    if (!postText.trim()) return;
    setPosting(true);
    try {
      let media_urls = [];
      let media_type = 'none';
      if (mediaFile) {
        const url = await uploadAPI.uploadToR2(mediaFile, 'posts');
        media_urls = [url];
        media_type = mediaFile.type.startsWith('video') ? 'video' : 'image';
      }
      const { data } = await postsAPI.create({ content: postText, category, media_urls, media_type });
      prependPost(data);
      setPostText('');
      setMediaFile(null);
      toast.success('Post publicado! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao publicar');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem' }}>
      {/* Create Post */}
      {user && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <form onSubmit={handlePost}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div className="avatar avatar-md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)', fontSize: '1.2rem', flexShrink: 0 }}>
                {user.avatar_url ? <img src={user.avatar_url} alt="" className="avatar avatar-md" /> : '👤'}
              </div>
              <textarea
                className="input"
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder={`O que você está vivendo, ${user.display_name?.split(' ')[0]}? 🌟`}
                rows={3}
                style={{ resize: 'none', flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                className="input"
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="geral">🌐 Geral</option>
                <option value="solo">🧘 Solo</option>
                <option value="a_dois">💑 A Dois</option>
                <option value="turma">🎉 Turma</option>
              </select>
              <label style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                📷 {mediaFile ? mediaFile.name.slice(0, 20) + '...' : 'Foto/Vídeo'}
                <input type="file" accept="image/*,video/*" style={{ display: 'none' }}
                  onChange={e => setMediaFile(e.target.files[0])} />
              </label>
              <button type="submit" className="btn btn-primary" disabled={posting || !postText.trim()} style={{ marginLeft: 'auto' }}>
                {posting ? '...' : 'Publicar 🚀'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed */}
      <InfiniteScroll
        dataLength={posts.length}
        next={() => fetchPosts(false)}
        hasMore={hasMore}
        loader={<div style={{ textAlign: 'center', padding: '1rem' }}><span className="spinner" /></div>}
        endMessage={<p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>Você chegou ao fim do feed! 🎉</p>}
      >
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onUpdate={updatePost}
            onDelete={removePost}
          />
        ))}
      </InfiniteScroll>

      {!loading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌟</div>
          <h3>Seu feed está vazio</h3>
          <p>Siga pessoas para ver os posts delas aqui!</p>
        </div>
      )}
    </div>
  );
}

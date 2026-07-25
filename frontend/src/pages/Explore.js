import React, { useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useFeed } from '../hooks/useFeed';
import PostCard from '../components/PostCard';

export default function Explore() {
  const { posts, loading, hasMore, fetchPosts, updatePost, removePost } = useFeed('explore');
  useEffect(() => { fetchPosts(true); }, []); // eslint-disable-line
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>🔭 Explorar</h1>
      <InfiniteScroll dataLength={posts.length} next={() => fetchPosts(false)} hasMore={hasMore}
        loader={<div style={{ textAlign: 'center', padding: '1rem' }}><span className="spinner" /></div>}>
        {posts.map(p => <PostCard key={p.id} post={p} onUpdate={updatePost} onDelete={removePost} />)}
      </InfiniteScroll>
      {!loading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem' }}>🌟</div><p>Nenhum post ainda</p>
        </div>
      )}
    </div>
  );
}

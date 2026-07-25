/**
 * Desafio+ — useFeed hook (scroll infinito)
 */

import { useState, useCallback, useRef } from 'react';
import { feedAPI } from '../services/api';

export function useFeed(type = 'feed') {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const LIMIT = 20;

  const fetchPosts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const offset = reset ? 0 : offsetRef.current;
    try {
      const fetcher = type === 'explore' ? feedAPI.getExplore : feedAPI.getFeed;
      const { data } = await fetcher({ limit: LIMIT, offset });
      if (reset) {
        setPosts(data);
        offsetRef.current = data.length;
      } else {
        setPosts(prev => [...prev, ...data]);
        offsetRef.current += data.length;
      }
      setHasMore(data.length === LIMIT);
    } catch (err) {
      console.error('Feed error:', err);
    } finally {
      setLoading(false);
    }
  }, [type, loading]);

  const refresh = () => {
    offsetRef.current = 0;
    setHasMore(true);
    fetchPosts(true);
  };

  const updatePost = (postId, updates) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
  };

  const removePost = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const prependPost = (post) => {
    setPosts(prev => [post, ...prev]);
  };

  return { posts, loading, hasMore, fetchPosts, refresh, updatePost, removePost, prependPost };
}

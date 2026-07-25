/**
 * Desafio+ — services/api.js
 * Cliente axios pré-configurado para o backend.
 *
 * A URL base é lida de REACT_APP_API_URL (arquivo .env do frontend).
 * Se não estiver definida, usa http://localhost:8787/api como padrão.
 *
 * Exporta:
 *  - default: instância axios configurada (para uso direto)
 *  - named exports: postsAPI, feedAPI, notificationsAPI, challengesAPI,
 *    chatAPI, uploadAPI, gamesAPI, usersAPI, searchAPI, authAPI,
 *    presenceAPI, suggestionsAPI
 */

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8787/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Interceptor: injeta token JWT em todas as requisições ──────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Interceptor: trata token expirado globalmente ──────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && err?.response?.data?.code === 'TOKEN_EXPIRED') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Named exports ──────────────────────────────────────────────────────────

export const authAPI = {
  login:    (email, password)  => api.post('/auth/login', { email, password }),
  register: (data)             => api.post('/auth/register', data),
  logout:   ()                 => api.post('/auth/logout'),
  me:       ()                 => api.get('/auth/me'),
  refresh:  (refreshToken)     => api.post('/auth/refresh', { refreshToken }),
};

export const postsAPI = {
  create:      (data)           => api.post('/posts', data),
  delete:      (id)             => api.delete(`/posts/${id}`),
  like:        (id)             => api.post(`/posts/${id}/like`),
  unlike:      (id)             => api.delete(`/posts/${id}/like`),
  getComments: (id)             => api.get(`/posts/${id}/comments`),
  addComment:  (id, content)    => api.post(`/posts/${id}/comments`, { content }),
};

export const feedAPI = {
  getFeed:    (page = 1)        => api.get(`/feed?page=${page}`),
  getExplore: (page = 1)        => api.get(`/feed/explore?page=${page}`),
};

export const notificationsAPI = {
  getAll:        ()             => api.get('/notifications'),
  getUnreadCount:()             => api.get('/notifications/unread-count'),
  markAllRead:   ()             => api.put('/notifications/read-all'),
  markRead:      (id)           => api.put(`/notifications/${id}/read`),
};

export const challengesAPI = {
  getAll:      ()               => api.get('/challenges'),
  getDaily:    ()               => api.get('/challenges/daily'),
  complete:    (id, data)       => api.post(`/challenges/${id}/complete`, data),
  generateAI:  ()               => api.post('/challenges/generate'),
};

export const chatAPI = {
  getConversations: ()          => api.get('/chat/conversations'),
  getMessages:      (userId)    => api.get(`/chat/messages/${userId}`),
  sendMessage:      (userId, content) => api.post(`/chat/messages/${userId}`, { content }),
};

export const uploadAPI = {
  uploadToR2:  (file, folder)   => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder || 'posts');
    return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  presign:     (mimetype, folder) => api.post('/upload/presign', { mimetype, folder }),
};

export const gamesAPI = {
  getAll:        ()             => api.get('/games'),
  recordSession: (data)         => api.post('/games/session', data),
};

export const usersAPI = {
  getProfile:    (username)     => api.get(`/users/${username}`),
  getPosts:      (username)     => api.get(`/users/${username}/posts`),
  follow:        (userId)       => api.post(`/users/${userId}/follow`),
  unfollow:      (userId)       => api.delete(`/users/${userId}/follow`),
  updateProfile: (data)         => api.put('/users/me', data),
  getSettings:   ()             => api.get('/users/settings'),
  updateSettings:(data)         => api.put('/users/settings', data),
  block:         (userId)       => api.post(`/users/${userId}/block`),
  unblock:       (userId)       => api.delete(`/users/${userId}/block`),
  getBlocked:    ()             => api.get('/users/blocked'),
};

export const searchAPI = {
  search: (q, type = 'all', limit = 10) =>
    api.get(`/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`),
};

export const presenceAPI = {
  heartbeat: (state)            => api.post('/presence/heartbeat', { state }),
  getOnline: ()                 => api.get('/presence/online'),
  getNearby: ()                 => api.get('/presence/nearby'),
};

export const suggestionsAPI = {
  getNearby: ()                 => api.get('/suggestions/nearby'),
  getOnline: ()                 => api.get('/suggestions/online'),
};

export default api;

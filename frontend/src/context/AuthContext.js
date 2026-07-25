/**
 * Desafio+ — AuthContext
 * Gerencia estado de autenticação global
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));

  // Configura o token no axios
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Carrega o usuário ao iniciar
  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch (err) {
      if (err.response?.data?.code === 'TOKEN_EXPIRED') {
        await tryRefresh();
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const tryRefresh = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) { logout(); return; }
    try {
      const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken });
      saveTokens(data.access_token, data.refresh_token);
      setUser(data.user);
    } catch {
      logout();
    }
  };

  const saveTokens = (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setToken(accessToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, username, display_name) => {
    const { data } = await api.post('/auth/register', { email, password, username, display_name });
    saveTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const googleLogin = async (idToken) => {
    const { data } = await api.post('/auth/google', { id_token: idToken });
    saveTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) await api.post('/auth/logout', { refresh_token: refreshToken });
    } catch {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  // Interceptor para refresh automático
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry && err.response?.data?.code === 'TOKEN_EXPIRED') {
          original._retry = true;
          await tryRefresh();
          return api(original);
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, updateUser, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

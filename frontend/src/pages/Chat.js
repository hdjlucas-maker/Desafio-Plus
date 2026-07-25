/**
 * Desafio+ — Chat Page
 */

import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = async () => {
    try {
      const { data } = await chatAPI.getConversations();
      setConversations(data);
    } catch {}
  };

  const openConversation = async (conv) => {
    setActiveConv(conv);
    try {
      const { data } = await chatAPI.getMessages(conv.id);
      setMessages(data);
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    } catch {}
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv) return;
    setSending(true);
    try {
      const { data } = await chatAPI.sendMessage(activeConv.id, { content: text });
      setMessages(prev => [...prev, data]);
      setText('');
    } catch { toast.error('Erro ao enviar mensagem'); }
    finally { setSending(false); }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--navbar-h))', maxWidth: 900, margin: '0 auto' }}>
      {/* Conversations List */}
      <div style={{
        width: 280, borderRight: '1px solid var(--border)',
        overflowY: 'auto', flexShrink: 0,
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.1rem' }}>💬 Mensagens</h2>
        </div>
        {conversations.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem' }}>💬</div>
            <p style={{ fontSize: '0.85rem' }}>Nenhuma conversa ainda</p>
          </div>
        )}
        {conversations.map(conv => (
          <button key={conv.id} onClick={() => openConversation(conv)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem', background: activeConv?.id === conv.id ? 'var(--bg-hover)' : 'none',
            border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}>
            <div className="avatar avatar-md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)', fontSize: '1.2rem', flexShrink: 0 }}>
              {conv.peer_avatar ? <img src={conv.peer_avatar} alt="" className="avatar avatar-md" /> : '👤'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{conv.peer_name}</span>
                {conv.unread_count > 0 && (
                  <span style={{ background: 'var(--purple)', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {conv.last_message || 'Iniciar conversa'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeConv ? (
          <>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="avatar avatar-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hover)', fontSize: '1rem' }}>
                {activeConv.peer_avatar ? <img src={activeConv.peer_avatar} alt="" className="avatar avatar-sm" /> : '👤'}
              </div>
              <span style={{ fontWeight: 600 }}>{activeConv.peer_name}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {messages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '0.6rem 0.9rem',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe ? 'var(--grad-purple)' : 'var(--bg-hover)',
                      color: 'var(--text-primary)', fontSize: '0.9rem',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
              <input className="input" value={text} onChange={e => setText(e.target.value)}
                placeholder="Digite uma mensagem..." style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
                {sending ? '...' : '→'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💬</div>
              <p>Selecione uma conversa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

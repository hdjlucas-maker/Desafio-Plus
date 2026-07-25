/**
 * Desafio+ — Challenges Page
 */

import React, { useState, useEffect } from 'react';
import { challengesAPI } from '../services/api';
import toast from 'react-hot-toast';

const MODE_LABELS = { solo: '🧘 Solo', a_dois: '💑 A Dois', turma: '🎉 Turma' };
const DIFF_COLORS = { facil: '#22c55e', medio: '#f59e0b', dificil: '#ef4444', epico: '#a855f7' };
const RARITY_COLORS = { comum: '#94a3b8', raro: '#60a5fa', epico: '#a78bfa', lendario: '#fbbf24' };

export default function Challenges() {
  const [daily, setDaily] = useState([]);
  const [all, setAll] = useState([]);
  const [mode, setMode] = useState('');
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { loadChallenges(); }, [mode]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const [dailyRes, allRes] = await Promise.all([
        challengesAPI.getDaily({ mode }),
        challengesAPI.getAll({ mode, limit: 20 }),
      ]);
      setDaily(dailyRes.data);
      setAll(allRes.data);
    } catch {} finally { setLoading(false); }
  };

  const complete = async (challenge) => {
    setCompleting(challenge.id);
    try {
      const { data } = await challengesAPI.complete({ challenge_id: challenge.id });
      toast.success(`${data.message} +${data.xp_earned} XP, +${data.points_earned} pts 🔥`);
      loadChallenges();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao completar desafio');
    } finally { setCompleting(null); }
  };

  const generateAI = async () => {
    setAiLoading(true);
    try {
      const { data } = await challengesAPI.generateAI({ mode: mode || 'solo', category: 'geral' });
      toast.success(`${data.length} desafios gerados pela IA! 🤖`);
      loadChallenges();
    } catch { toast.error('Erro ao gerar desafios'); }
    finally { setAiLoading(false); }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>🎯 Desafios</h1>
        <button className="btn btn-secondary" onClick={generateAI} disabled={aiLoading}>
          {aiLoading ? '🤖 Gerando...' : '🤖 Gerar com IA'}
        </button>
      </div>

      {/* Mode Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['', '🌐 Todos'], ['solo', '🧘 Solo'], ['a_dois', '💑 A Dois'], ['turma', '🎉 Turma']].map(([v, l]) => (
          <button key={v} onClick={() => setMode(v)} className={`btn ${mode === v ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Daily Challenges */}
      {daily.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>⚡ Desafios do Dia</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {daily.map(ch => <ChallengeCard key={ch.id} challenge={ch} onComplete={complete} completing={completing} />)}
          </div>
        </div>
      )}

      {/* All Challenges */}
      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>📋 Todos os Desafios</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {all.map(ch => <ChallengeCard key={ch.id} challenge={ch} onComplete={complete} completing={completing} />)}
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ challenge: ch, onComplete, completing }) {
  return (
    <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ fontSize: '2rem', flexShrink: 0 }}>
        {ch.mode === 'solo' ? '🧘' : ch.mode === 'a_dois' ? '💑' : '🎉'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          <span style={{ fontWeight: 700 }}>{ch.title}</span>
          <span style={{ fontSize: '0.75rem', color: DIFF_COLORS[ch.difficulty], fontWeight: 600 }}>
            {ch.difficulty}
          </span>
          <span style={{ fontSize: '0.75rem', color: RARITY_COLORS[ch.rarity], fontWeight: 600 }}>
            ✦ {ch.rarity}
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{ch.description}</p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⚡ +{ch.xp_reward} XP</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⭐ +{ch.points_reward} pts</span>
          <button
            className="btn btn-primary"
            style={{ padding: '0.3rem 0.9rem', fontSize: '0.85rem', marginLeft: 'auto' }}
            onClick={() => onComplete(ch)}
            disabled={completing === ch.id}
          >
            {completing === ch.id ? '...' : '✓ Completar'}
          </button>
        </div>
      </div>
    </div>
  );
}

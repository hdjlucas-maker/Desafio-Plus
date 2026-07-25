/**
 * Desafio+ — Games Page
 * Integra os 10 jogos com o sistema de pontos da API
 */

import React, { useState } from 'react';
import { gamesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const GAMES = [
  { slug: 'jogo-da-velha', name: 'Jogo da Velha', icon: '⭕', desc: 'Clássico X e O vs CPU', points: 50 },
  { slug: 'quiz', name: 'Quiz "Você Sabia?"', icon: '🧠', desc: '10 perguntas de curiosidade', points: 100 },
  { slug: 'memoria', name: 'Jogo da Memória', icon: '🃏', desc: 'Encontre os pares', points: 70 },
  { slug: 'roleta', name: 'Roleta do Desafio', icon: '🎰', desc: 'Gire e descubra seu desafio', points: 40 },
  { slug: 'verdade-ou-desafio', name: 'Verdade ou Desafio', icon: '🤔', desc: 'Cartas com flip animado', points: 30 },
  { slug: 'palavra-embaralhada', name: 'Palavra Embaralhada', icon: '🔤', desc: 'Descubra a palavra', points: 60 },
  { slug: 'enquete', name: 'Enquete Relâmpago', icon: '📊', desc: 'Vote e veja resultados', points: 20 },
  { slug: 'caca-palavras', name: 'Caça-Palavras', icon: '🔍', desc: 'Encontre as palavras escondidas', points: 90 },
  { slug: 'adivinhe-o-numero', name: 'Adivinhe o Número', icon: '🔢', desc: 'Maior ou menor?', points: 50 },
  { slug: 'damas', name: 'Damas', icon: '🔴', desc: 'Tabuleiro clássico vs CPU', points: 80 },
];

export default function Games() {
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState(null);
  const [totalPoints, setTotalPoints] = useState(user?.points || 0);

  const handleGameEnd = async (slug, score, result) => {
    try {
      const { data } = await gamesAPI.recordSession({ game_slug: slug, score, result });
      setTotalPoints(prev => prev + data.points_earned);
      toast.success(`+${data.points_earned} pontos! 🎉`);
    } catch {}
    setActiveGame(null);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎮 Jogos</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Jogue e ganhe pontos reais no seu perfil!</p>
        {user && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem',
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)',
            padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
            ⭐ <strong>{totalPoints}</strong> pontos totais
          </div>
        )}
      </div>

      {/* Game Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {GAMES.map(game => (
          <button
            key={game.slug}
            onClick={() => setActiveGame(game)}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '1.5rem 1rem',
              cursor: 'pointer', transition: 'var(--transition)', textAlign: 'center',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{game.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.95rem' }}>{game.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{game.desc}</div>
            <div style={{ color: 'var(--purple-light)', fontSize: '0.8rem', fontWeight: 600 }}>+{game.points} pts</div>
          </button>
        ))}
      </div>

      {/* Game Modal */}
      {activeGame && (
        <GameModal game={activeGame} onClose={() => setActiveGame(null)} onEnd={handleGameEnd} />
      )}
    </div>
  );
}

function GameModal({ game, onClose, onEnd }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600, maxHeight: '90vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>{game.icon} {game.name}</h2>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: '1.2rem' }}>✕</button>
        </div>
        <GameRenderer slug={game.slug} onEnd={(score, result) => onEnd(game.slug, score, result)} />
      </div>
    </div>
  );
}

function GameRenderer({ slug, onEnd }) {
  switch (slug) {
    case 'jogo-da-velha': return <TicTacToe onEnd={onEnd} />;
    case 'quiz': return <Quiz onEnd={onEnd} />;
    case 'memoria': return <Memory onEnd={onEnd} />;
    case 'adivinhe-o-numero': return <GuessNumber onEnd={onEnd} />;
    case 'roleta': return <Roleta onEnd={onEnd} />;
    case 'verdade-ou-desafio': return <VerdadeDesafio onEnd={onEnd} />;
    case 'palavra-embaralhada': return <PalavraEmbaralhada onEnd={onEnd} />;
    case 'enquete': return <Enquete onEnd={onEnd} />;
    default: return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Jogo em breve! 🚧</div>;
  }
}

// ── Jogo da Velha ─────────────────────────────────────────
function TicTacToe({ onEnd }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true);
  const [winner, setWinner] = useState(null);
  const [score, setScore] = useState(0);

  const checkWinner = (b) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b2,c] of lines) if (b[a] && b[a] === b[b2] && b[a] === b[c]) return b[a];
    return b.every(Boolean) ? 'draw' : null;
  };

  const cpuMove = (b) => {
    const empty = b.map((v,i) => v ? null : i).filter(v => v !== null);
    if (!empty.length) return b;
    const idx = empty[Math.floor(Math.random() * empty.length)];
    const nb = [...b]; nb[idx] = 'O';
    return nb;
  };

  const handleClick = (i) => {
    if (board[i] || winner) return;
    let nb = [...board]; nb[i] = 'X';
    const w1 = checkWinner(nb);
    if (w1) { setBoard(nb); setWinner(w1); if (w1 === 'X') setScore(s => s + 50); return; }
    nb = cpuMove(nb);
    const w2 = checkWinner(nb);
    setBoard(nb);
    if (w2) setWinner(w2);
  };

  const reset = () => { setBoard(Array(9).fill(null)); setWinner(null); };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Você é X · CPU é O</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 80px)', gap: 8, justifyContent: 'center', marginBottom: '1rem' }}>
        {board.map((cell, i) => (
          <button key={i} onClick={() => handleClick(i)} style={{
            width: 80, height: 80, fontSize: '2rem', fontWeight: 700,
            background: 'var(--bg-hover)', border: '2px solid var(--border)',
            borderRadius: 'var(--radius-md)', cursor: cell || winner ? 'default' : 'pointer',
            color: cell === 'X' ? 'var(--purple-light)' : 'var(--pink)',
            transition: 'var(--transition)',
          }}>{cell}</button>
        ))}
      </div>
      {winner && (
        <div>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
            {winner === 'X' ? '🎉 Você venceu! +50 pts' : winner === 'draw' ? '🤝 Empate!' : '😅 CPU venceu!'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={reset}>Jogar de novo</button>
            <button className="btn btn-primary" onClick={() => onEnd(score, winner === 'X' ? 'won' : 'completed')}>
              Finalizar (+{score} pts)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quiz ──────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { q: 'Qual é o maior planeta do sistema solar?', opts: ['Terra', 'Saturno', 'Júpiter', 'Netuno'], a: 2 },
  { q: 'Quantos ossos tem o corpo humano adulto?', opts: ['206', '180', '250', '300'], a: 0 },
  { q: 'Qual país tem mais espécies de animais do mundo?', opts: ['Austrália', 'Brasil', 'China', 'Índia'], a: 1 },
  { q: 'Em que ano o Brasil foi descoberto?', opts: ['1492', '1500', '1510', '1488'], a: 1 },
  { q: 'Qual é o elemento mais abundante no universo?', opts: ['Oxigênio', 'Carbono', 'Hidrogênio', 'Hélio'], a: 2 },
  { q: 'Quantas cores tem o arco-íris?', opts: ['5', '6', '7', '8'], a: 2 },
  { q: 'Qual é a capital da Austrália?', opts: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], a: 2 },
  { q: 'Quem pintou a Mona Lisa?', opts: ['Michelangelo', 'Rafael', 'Leonardo da Vinci', 'Botticelli'], a: 2 },
  { q: 'Qual é o oceano mais profundo?', opts: ['Atlântico', 'Índico', 'Ártico', 'Pacífico'], a: 3 },
  { q: 'Quantos lados tem um hexágono?', opts: ['5', '6', '7', '8'], a: 1 },
];

function Quiz({ onEnd }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);

  const q = QUIZ_QUESTIONS[idx];

  const handleAnswer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.a) setScore(s => s + 10);
    setTimeout(() => {
      if (idx + 1 >= QUIZ_QUESTIONS.length) setFinished(true);
      else { setIdx(i2 => i2 + 1); setSelected(null); }
    }, 1000);
  };

  if (finished) return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</div>
      <h3>Quiz finalizado!</h3>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--purple-light)', margin: '0.5rem 0' }}>
        {score}/{QUIZ_QUESTIONS.length * 10} pontos
      </p>
      <button className="btn btn-primary" onClick={() => onEnd(score, 'completed')}>
        Salvar resultado
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span>Pergunta {idx + 1}/{QUIZ_QUESTIONS.length}</span>
        <span>⭐ {score} pts</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-hover)', borderRadius: 2, marginBottom: '1.5rem' }}>
        <div style={{ height: '100%', width: `${(idx / QUIZ_QUESTIONS.length) * 100}%`, background: 'var(--grad-main)', borderRadius: 2 }} />
      </div>
      <h3 style={{ marginBottom: '1.5rem', lineHeight: 1.4 }}>{q.q}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {q.opts.map((opt, i) => {
          let bg = 'var(--bg-hover)';
          let border = 'var(--border)';
          if (selected !== null) {
            if (i === q.a) { bg = 'rgba(34,197,94,0.2)'; border = '#22c55e'; }
            else if (i === selected) { bg = 'rgba(239,68,68,0.2)'; border = '#ef4444'; }
          }
          return (
            <button key={i} onClick={() => handleAnswer(i)} style={{
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              background: bg, border: `2px solid ${border}`,
              color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer',
              transition: 'var(--transition)', fontSize: '0.95rem',
            }}>{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Adivinhe o Número ─────────────────────────────────────
function GuessNumber({ onEnd }) {
  const [secret] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState('');
  const [won, setWon] = useState(false);
  const MAX = 7;

  const handleGuess = (e) => {
    e.preventDefault();
    const n = parseInt(guess);
    if (isNaN(n) || n < 1 || n > 100) { setHint('Digite um número entre 1 e 100'); return; }
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (n === secret) { setWon(true); setHint(`🎉 Acertou em ${newAttempts} tentativas!`); }
    else if (newAttempts >= MAX) { setHint(`😅 Era ${secret}! Tente novamente.`); }
    else { setHint(n < secret ? '📈 Maior!' : '📉 Menor!'); }
    setGuess('');
  };

  const score = won ? Math.max(10, 70 - attempts * 10) : 0;

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Adivinhe o número entre 1 e 100</p>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Tentativas: {attempts}/{MAX}
      </div>
      {hint && <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: won ? '#22c55e' : 'var(--text-primary)' }}>{hint}</p>}
      {!won && attempts < MAX && (
        <form onSubmit={handleGuess} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <input className="input" type="number" value={guess} onChange={e => setGuess(e.target.value)}
            placeholder="1-100" min={1} max={100} style={{ width: 120, textAlign: 'center' }} />
          <button type="submit" className="btn btn-primary">Tentar</button>
        </form>
      )}
      {(won || attempts >= MAX) && (
        <button className="btn btn-primary" style={{ marginTop: '1rem' }}
          onClick={() => onEnd(score, won ? 'won' : 'completed')}>
          Finalizar (+{score} pts)
        </button>
      )}
    </div>
  );
}

// ── Roleta ────────────────────────────────────────────────
const DESAFIOS_ROLETA = ['Faça 10 flexões!', 'Cante uma música!', 'Dance por 30 segundos!', 'Conte uma piada!', 'Imite alguém!', 'Faça uma careta!', 'Diga 3 coisas boas sobre você!', 'Ligue para alguém especial!'];

function Roleta({ onEnd }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const extra = 1440 + Math.floor(Math.random() * 360);
    setRotation(r => r + extra);
    setTimeout(() => {
      const idx = Math.floor(Math.random() * DESAFIOS_ROLETA.length);
      setResult(DESAFIOS_ROLETA[idx]);
      setSpinning(false);
    }, 3000);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 200, height: 200, borderRadius: '50%', margin: '0 auto 1rem',
        background: 'conic-gradient(var(--purple) 0deg 45deg, var(--pink) 45deg 90deg, var(--blue) 90deg 135deg, var(--orange) 135deg 180deg, var(--purple) 180deg 225deg, var(--pink) 225deg 270deg, var(--blue) 270deg 315deg, var(--orange) 315deg 360deg)',
        transform: `rotate(${rotation}deg)`,
        transition: spinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
        border: '4px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem',
      }}>🎯</div>
      {result && (
        <div className="card" style={{ marginBottom: '1rem', background: 'var(--grad-card)' }}>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>🎲 Seu desafio:</p>
          <p style={{ color: 'var(--purple-light)', fontSize: '1rem', marginTop: '0.25rem' }}>{result}</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={spin} disabled={spinning}>
          {spinning ? '🌀 Girando...' : '🎰 Girar!'}
        </button>
        {result && <button className="btn btn-secondary" onClick={() => onEnd(40, 'completed')}>Finalizar</button>}
      </div>
    </div>
  );
}

// ── Verdade ou Desafio ────────────────────────────────────
const VERDADES = ['Qual é seu maior medo?', 'Já mentiu para um amigo?', 'Qual é seu segredo mais bobo?', 'Já teve uma crush secreta?', 'O que você nunca contaria para seus pais?'];
const DESAFIOS_VD = ['Faça uma dança engraçada!', 'Imite o som de um animal!', 'Diga um elogio para cada pessoa presente!', 'Cante o refrão de uma música!', 'Faça 5 polichinelos!'];

function VerdadeDesafio({ onEnd }) {
  const [flipped, setFlipped] = useState(false);
  const [card, setCard] = useState(null);
  const [type, setType] = useState(null);

  const draw = (t) => {
    const list = t === 'verdade' ? VERDADES : DESAFIOS_VD;
    setCard(list[Math.floor(Math.random() * list.length)]);
    setType(t);
    setFlipped(false);
    setTimeout(() => setFlipped(true), 100);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={() => draw('verdade')}>🤔 Verdade</button>
        <button className="btn btn-secondary" onClick={() => draw('desafio')} style={{ borderColor: 'var(--pink)', color: 'var(--pink)' }}>🎯 Desafio</button>
      </div>
      {card && (
        <div style={{
          background: type === 'verdade' ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)',
          border: `2px solid ${type === 'verdade' ? 'var(--blue)' : 'var(--pink)'}`,
          borderRadius: 'var(--radius-xl)', padding: '2rem',
          transform: flipped ? 'rotateY(0deg)' : 'rotateY(90deg)',
          transition: 'transform 0.4s ease',
          marginBottom: '1rem',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{type === 'verdade' ? '🤔' : '🎯'}</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{card}</p>
        </div>
      )}
      <button className="btn btn-secondary" onClick={() => onEnd(30, 'completed')}>Finalizar</button>
    </div>
  );
}

// ── Palavra Embaralhada ───────────────────────────────────
const PALAVRAS = [
  { word: 'DESAFIO', hint: 'O que você aceita neste app' },
  { word: 'AMIZADE', hint: 'Laço entre pessoas' },
  { word: 'AVENTURA', hint: 'Experiência emocionante' },
  { word: 'CONQUISTA', hint: 'Algo que você alcança' },
  { word: 'DIVERSAO', hint: 'O que buscamos na vida' },
];

function PalavraEmbaralhada({ onEnd }) {
  const [idx] = useState(() => Math.floor(Math.random() * PALAVRAS.length));
  const { word, hint } = PALAVRAS[idx];
  const [shuffled] = useState(() => word.split('').sort(() => Math.random() - 0.5).join(''));
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [lives, setLives] = useState(3);

  const check = (e) => {
    e.preventDefault();
    if (guess.toUpperCase() === word) {
      setResult('win');
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives === 0) setResult('lose');
      else setGuess('');
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>💡 Dica: {hint}</p>
      <div style={{ fontSize: '2rem', letterSpacing: '0.5rem', fontWeight: 700, color: 'var(--purple-light)', marginBottom: '1rem' }}>
        {shuffled}
      </div>
      <p style={{ marginBottom: '1rem' }}>{'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}</p>
      {!result ? (
        <form onSubmit={check} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <input className="input" value={guess} onChange={e => setGuess(e.target.value.toUpperCase())}
            placeholder="Digite a palavra..." style={{ width: 200, textAlign: 'center', letterSpacing: '0.2rem' }} />
          <button type="submit" className="btn btn-primary">✓</button>
        </form>
      ) : (
        <div>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
            {result === 'win' ? '🎉 Acertou!' : `😅 Era: ${word}`}
          </p>
          <button className="btn btn-primary" onClick={() => onEnd(result === 'win' ? 60 : 10, result === 'win' ? 'won' : 'completed')}>
            Finalizar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Enquete ───────────────────────────────────────────────
const ENQUETES = [
  { q: 'Qual é melhor?', opts: ['Pizza', 'Hambúrguer', 'Sushi', 'Churrasco'] },
  { q: 'Prefere...', opts: ['Praia', 'Campo', 'Cidade', 'Montanha'] },
  { q: 'Melhor estação?', opts: ['Verão', 'Outono', 'Inverno', 'Primavera'] },
];

function Enquete({ onEnd }) {
  const [eq] = useState(() => ENQUETES[Math.floor(Math.random() * ENQUETES.length)]);
  const [votes, setVotes] = useState(eq.opts.map(() => Math.floor(Math.random() * 50) + 10));
  const [voted, setVoted] = useState(null);

  const vote = (i) => {
    if (voted !== null) return;
    const nv = [...votes]; nv[i]++;
    setVotes(nv);
    setVoted(i);
  };

  const total = votes.reduce((a, b) => a + b, 0);

  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{eq.q}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {eq.opts.map((opt, i) => {
          const pct = Math.round((votes[i] / total) * 100);
          return (
            <button key={i} onClick={() => vote(i)} style={{
              position: 'relative', padding: '0.75rem 1rem',
              background: 'var(--bg-hover)', border: `2px solid ${voted === i ? 'var(--purple)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)', cursor: voted !== null ? 'default' : 'pointer',
              color: 'var(--text-primary)', textAlign: 'left', overflow: 'hidden',
            }}>
              {voted !== null && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pct}%`, background: 'rgba(124,58,237,0.2)', transition: 'width 0.5s ease',
                }} />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between' }}>
                <span>{opt}</span>
                {voted !== null && <span style={{ fontWeight: 700, color: 'var(--purple-light)' }}>{pct}%</span>}
              </span>
            </button>
          );
        })}
      </div>
      {voted !== null && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Total: {total} votos</p>
          <button className="btn btn-primary" onClick={() => onEnd(20, 'completed')}>Finalizar</button>
        </div>
      )}
    </div>
  );
}

// ── Memory ────────────────────────────────────────────────
const EMOJIS = ['🎯', '🎮', '🏆', '🔥', '⭐', '💎', '🎲', '🎪'];

function Memory({ onEnd }) {
  const [cards] = useState(() => {
    const doubled = [...EMOJIS, ...EMOJIS].map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }));
    return doubled.sort(() => Math.random() - 0.5);
  });
  const [state, setState] = useState(cards);
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);

  const flip = (id) => {
    if (selected.length === 2) return;
    const card = state.find(c => c.id === id);
    if (card.flipped || card.matched) return;

    const newState = state.map(c => c.id === id ? { ...c, flipped: true } : c);
    setState(newState);
    const newSel = [...selected, id];
    setSelected(newSel);

    if (newSel.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newSel.map(sid => newState.find(c => c.id === sid));
      if (a.emoji === b.emoji) {
        setTimeout(() => {
          setState(s => s.map(c => newSel.includes(c.id) ? { ...c, matched: true } : c));
          setMatched(m => m + 1);
          setSelected([]);
        }, 500);
      } else {
        setTimeout(() => {
          setState(s => s.map(c => newSel.includes(c.id) ? { ...c, flipped: false } : c));
          setSelected([]);
        }, 800);
      }
    }
  };

  const done = matched === EMOJIS.length;
  const score = done ? Math.max(10, 70 - moves * 2) : 0;

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Movimentos: {moves} | Pares: {matched}/{EMOJIS.length}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: '1rem' }}>
        {state.map(card => (
          <button key={card.id} onClick={() => flip(card.id)} style={{
            height: 60, fontSize: '1.5rem', borderRadius: 'var(--radius-md)',
            background: card.flipped || card.matched ? 'var(--bg-hover)' : 'var(--purple)',
            border: `2px solid ${card.matched ? '#22c55e' : 'var(--border)'}`,
            cursor: 'pointer', transition: 'var(--transition)',
          }}>
            {(card.flipped || card.matched) ? card.emoji : '?'}
          </button>
        ))}
      </div>
      {done && (
        <div>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.75rem' }}>🎉 Parabéns! {moves} movimentos</p>
          <button className="btn btn-primary" onClick={() => onEnd(score, 'won')}>Finalizar (+{score} pts)</button>
        </div>
      )}
    </div>
  );
}

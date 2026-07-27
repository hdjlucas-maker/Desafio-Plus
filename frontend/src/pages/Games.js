/**
 * Desafio+ — Games Page
 * 10 jogos internos + 30 jogos GameDistribution (iframe)
 */

import React, { useState, useEffect, useRef } from 'react';
import { gamesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const GD_BASE = 'https://html5.gamedistribution.com';
const REF = '?gd_sdk_referrer_url=https://desafio-plus.pages.dev/games';

const GAMES = [
  { slug: 'jogo-da-velha', name: 'Jogo da Velha', icon: '⭕', desc: 'Clássico X e O vs CPU', points: 50 },
  { slug: 'quiz', name: 'Quiz "Você Sabia?"', icon: '🧠', desc: '10 perguntas de curiosidade', points: 100 },
  { slug: 'memoria', name: 'Jogo da Memória', icon: '🃏', desc: 'Encontre os pares', points: 70 },
  { slug: 'roleta', name: 'Roleta do Desafio', icon: '🎰', desc: 'Gire e descubra seu desafio', points: 40 },
  { slug: 'verdade-ou-desafio', name: 'Verdade ou Desafio', icon: '🤔', desc: 'Cartas com flip animado', points: 30 },
  { slug: 'palavra-embaralhada', name: 'Palavra Embaralhada', icon: '🔤', desc: 'Descubra a palavra', points: 60 },
  { slug: 'enquete', name: 'Enquete Relâmpago', icon: '📊', desc: 'Vote e veja resultados', points: 20 },
  { slug: 'caca-palavras', name: 'Caça-Palavras', icon: '🔍', desc: 'Encontre as palavras', points: 90 },
  { slug: 'adivinhe-o-numero', name: 'Adivinhe o Número', icon: '🔢', desc: 'Maior ou menor?', points: 50 },
  { slug: 'damas', name: 'Damas', icon: '🔴', desc: 'Tabuleiro clássico vs CPU', points: 80 },
  { slug: 'gd-mahjong-triple', name: 'Mahjong Triple 3D', icon: '🀄', desc: 'Match tiles 3D', points: 80, gdId: 'a93152c0e931494987338969f804c732' },
  { slug: 'gd-bus-escape', name: 'Bus Escape', icon: '🚌', desc: 'Clear the jam!', points: 70, gdId: '7a94bf0ebef34eb4a3c6f7dc6a6d59c4' },
  { slug: 'gd-fruit-sort', name: 'Fruit Sort Logic', icon: '🍎', desc: 'Sort the fruits', points: 60, gdId: '54794eb4734d4c0cb480bc876a5851cf' },
  { slug: 'gd-bubble-shooter', name: 'Bubble Shooter', icon: '🫧', desc: 'Crystal Hunt', points: 50, gdId: '11abb92c950f4b29a60b36037fde6951' },
  { slug: 'gd-thread-match', name: 'Thread Match 2', icon: '🧵', desc: 'Match the threads', points: 60, gdId: '58e78963f24c4305931be1bffa305a19' },
  { slug: 'gd-stacking-match', name: 'Stacking Match', icon: '📚', desc: 'Stack and match', points: 60, gdId: '59560ac116da4d729dd6a07439d3995e' },
  { slug: 'gd-hidden-objects', name: 'Hidden Objects Island', icon: '🏝️', desc: 'Find hidden items', points: 70, gdId: '5948fe24b0c6400092ac91535c240ae7' },
  { slug: 'gd-fruit-match', name: 'Fruit Match', icon: '🍊', desc: 'Match fruits', points: 50, gdId: 'f5ae294cbfe1417aa49bcb08b3eec042' },
  { slug: 'gd-mahjong-connect', name: 'Grand Mahjong Connect', icon: '🀄', desc: 'Connect tiles', points: 80, gdId: '92211d47448849d189bbc32d0d4d8f6f' },
  { slug: 'gd-farm-blast', name: 'Farm Blast', icon: '🌾', desc: 'Blast the farm!', points: 60, gdId: '8e9f68b6765f4c39a4c243c4dc6a4ec5' },
  { slug: 'gd-arrow-tap', name: 'Arrow Tap Puzzle', icon: '🎯', desc: 'Tap the arrows', points: 50, gdId: '88f891a7716540f8b47c46e701931ef6' },
  { slug: 'gd-color-nuts', name: 'Color Nuts', icon: '🥜', desc: 'Match colors', points: 50, gdId: '2d1d3313a58943e89a8b7bfbccbc1b0e' },
  { slug: 'gd-wordmix', name: 'WordMix', icon: '📝', desc: 'Mix the words', points: 70, gdId: '77601506ef614bc49a4d3d37b3bf43d6' },
  { slug: 'gd-sweet-match', name: 'Sweet Match', icon: '🍬', desc: 'Match sweets', points: 50, gdId: '51a4f4e24d24459898bf7608c8093846' },
  { slug: 'gd-daily-match', name: 'Daily Match', icon: '📅', desc: 'Daily puzzle', points: 50, gdId: 'c0976190581740f087418870793853d6' },
  { slug: 'gd-sophies-farm', name: "Sophie's Farm", icon: '🐷', desc: 'Farm adventure', points: 60, gdId: 'df725a3a7e6143529417611af41098cb' },
  { slug: 'gd-match-garden', name: 'Match Dream Garden', icon: '🌸', desc: 'Garden matching', points: 60, gdId: '5f8a3b33a8ea4c908ea4a3fb4c4c3004' },
  { slug: 'gd-jewel-coloring', name: 'Jewel Coloring', icon: '💎', desc: 'Color jewels', points: 40, gdId: '33a108e9663d4f40892946f6d9e3b410' },
  { slug: 'gd-tank-stars', name: 'Tank Stars', icon: '🔫', desc: 'Tank battle', points: 90, gdId: '36803a34126d42a3b4e4b26045f0e4e7' },
  { slug: 'gd-sand-sort', name: 'Sand Sort Puzzle', icon: '⏳', desc: 'Sort the sand', points: 60, gdId: 'abb97dc299864544ad4d776045b937f1' },
  { slug: 'gd-scala-40', name: 'Scala 40', icon: '♠️', desc: 'Classic card game', points: 70, gdId: '02d38357f24a45e5b4c8d047e7c1d166' },
  { slug: 'gd-cake-merge', name: 'Cake Merge', icon: '🎂', desc: 'Merge cakes', points: 50, gdId: '15a4a8a56a664f01920b781f42c75dd6' },
  { slug: 'gd-juice-merge', name: 'Juice Merge', icon: '🧃', desc: 'Merge juices', points: 50, gdId: '0345a829b5c14a13b2d7308b38f566f0' },
  { slug: 'gd-thread-sort', name: 'Thread Sort', icon: '🪡', desc: 'Sort threads', points: 50, gdId: '3c2b10e281774f22ad1b6e800c7d2f05' },
  { slug: 'gd-merge-home', name: 'Merge Home Mania', icon: '🏠', desc: 'Merge & build', points: 60, gdId: 'b4e32c2eb72e4a109e34f6c54e0c3e8a' },
  { slug: 'gd-arrow-escape-master', name: 'Arrow Escape Master', icon: '🏹', desc: 'Escape the arrows', points: 70, gdId: '363948cd6f9e46708139db7e7732b913' },
  { slug: 'gd-arrow-escape', name: 'Arrow Escape', icon: '↗️', desc: 'Arrow puzzle', points: 60, gdId: 'c075542df9c44d878f2b5d0dc4eb600b' },
  { slug: 'gd-popsortica', name: 'PopSortica', icon: '🎈', desc: 'Pop & sort', points: 50, gdId: 'a4e92e0f06dd4e28b3e22cb4c91a450c' },
  { slug: 'gd-world-wars', name: 'World Wars Tanks', icon: '🗺️', desc: 'Tank warfare', points: 90, gdId: '63e19f492b9e43259d55fcf97d83e767' },
  { slug: 'gd-pixel-shoot', name: 'Pixel Shoot', icon: '👾', desc: 'Pixel shooter', points: 80, gdId: '2b69c7e7c32f4a978426e6e0e19de84b' },
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

      {activeGame && (
        <GameModal game={activeGame} onClose={() => setActiveGame(null)} onEnd={handleGameEnd} />
      )}
    </div>
  );
}

function GameModal({ game, onClose, onEnd }) {
  const isGd = !!game.gdId;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: isGd ? 960 : 600, maxHeight: '90vh', padding: isGd ? '0.5rem' : undefined }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0 1rem' }}>
          <h2>{game.icon} {game.name}</h2>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: '1.2rem' }}>✕</button>
        </div>
        <GameRenderer game={game} onEnd={(score, result) => onEnd(game.slug, score, result)} />
      </div>
    </div>
  );
}

function GameRenderer({ game, onEnd }) {
  if (game.gdId) {
    return <GdIframe game={game} onEnd={onEnd} />;
  }
  switch (game.slug) {
    case 'jogo-da-velha': return <TicTacToe onEnd={onEnd} />;
    case 'quiz': return <Quiz onEnd={onEnd} />;
    case 'memoria': return <Memory onEnd={onEnd} />;
    case 'adivinhe-o-numero': return <GuessNumber onEnd={onEnd} />;
    case 'roleta': return <Roleta onEnd={onEnd} />;
    case 'verdade-ou-desafio': return <VerdadeDesafio onEnd={onEnd} />;
    case 'palavra-embaralhada': return <PalavraEmbaralhada onEnd={onEnd} />;
    case 'enquete': return <Enquete onEnd={onEnd} />;
    case 'caca-palavras': return <CacaPalavras onEnd={onEnd} />;
    case 'damas': return <Damas onEnd={onEnd} />;
    default: return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Jogo em breve!</div>;
  }
}

function GdIframe({ game, onEnd }) {
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const startGame = () => {
    setPlaying(true);
    timerRef.current = setTimeout(() => {
      onEnd(100, 'completed');
      toast.success('Jogo registrado! + pontos');
    }, 120000);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (!playing) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{game.icon}</div>
        <h3 style={{ marginBottom: '0.5rem' }}>{game.name}</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Clique para jogar e ganhar pontos!</p>
        <button onClick={startGame} className="btn btn-primary">
          ▶ Jogar
        </button>
      </div>
    );
  }

  return (
    <iframe
      src={`${GD_BASE}/${game.gdId}/${REF}`}
      style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}
      allowFullScreen
      title={game.name}
    />
  );
}

// ── Jogo da Velha ─────────────────────────────────────────
function TicTacToe({ onEnd }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true);

  const checkWinner = (b) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,c,d] of lines) { if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]; }
    return null;
  };

  const cpuMove = (b) => {
    const empty = b.map((v,i) => v === null ? i : null).filter(v => v !== null);
    if (!empty.length) return;
    const move = empty[Math.floor(Math.random() * empty.length)];
    const nb = [...b]; nb[move] = 'O';
    setBoard(nb);
    if (checkWinner(nb)) return onEnd(0, 'lost');
    if (nb.every(v => v !== null)) return onEnd(50, 'draw');
    setIsX(true);
  };

  const handleClick = (i) => {
    if (board[i] || !isX) return;
    const nb = [...board]; nb[i] = 'X'; setBoard(nb);
    if (checkWinner(nb)) return onEnd(100, 'won');
    if (nb.every(v => v !== null)) return onEnd(50, 'draw');
    setIsX(false);
    setTimeout(() => cpuMove(nb), 400);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,80px)', gap: '4px', justifyContent: 'center', marginBottom: '1rem' }}>
        {board.map((v,i) => (
          <button key={i} onClick={() => handleClick(i)}
            style={{ width: 80, height: 80, fontSize: '2rem', fontWeight: 700, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: v === 'X' ? 'var(--purple-light)' : '#f87171' }}>
            {v}
          </button>
        ))}
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{isX ? 'Sua vez (X)' : 'CPU jogando...'}</p>
    </div>
  );
}

// ── Quiz ─────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { q: 'Qual é o planeta mais próximo do Sol?', o: ['Mercúrio','Vênus','Marte','Júpiter'], a: 0 },
  { q: 'Quem pintou a Mona Lisa?', o: ['Da Vinci','Van Gogh','Picasso','Michelangelo'], a: 0 },
  { q: 'Qual é o maior oceano?', o: ['Atlântico','Índico','Pacífico','Ártico'], a: 2 },
  { q: 'Quantos ossos tem o corpo humano adulto?', o: ['106','206','306','186'], a: 1 },
  { q: 'Qual é a capital do Japão?', o: ['Pequim','Seul','Tóquio','Bangkok'], a: 2 },
  { q: 'Qual gas é mais abundante na atmosfera?', o: ['Oxigênio','Hidrogênio','Nitrogênio','CO2'], a: 2 },
  { q: 'Quem escreveu "O Pequeno Príncipe"?', o: ['Machado de Assis','Saint-Exupéry','Clarice Lispector','Hemingway'], a: 1 },
  { q: 'Qual é o rio mais longo do mundo?', o: ['Amazonas','Nilo','Mississipi','Yangtze'], a: 1 },
  { q: 'Em que ano o homem pisou na Lua?', o: ['1965','1969','1972','1960'], a: 1 },
  { q: 'Qual é o elemento químico do ouro?', o: ['Ag','Fe','Au','Cu'], a: 2 },
];

function Quiz({ onEnd }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const q = QUIZ_QUESTIONS[idx];

  const handleAnswer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === q.a;
    if (correct) setScore(s => s + 10);
    setTimeout(() => {
      setSelected(null);
      if (idx + 1 < QUIZ_QUESTIONS.length) setIdx(idx + 1);
      else onEnd(correct ? score + 10 : score, score + (correct ? 10 : 0) >= 60 ? 'won' : 'lost');
    }, 800);
  };

  return (
    <div style={{ padding: '1rem', textAlign: 'center' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Pergunta {idx + 1}/{QUIZ_QUESTIONS.length}</div>
      <h3 style={{ marginBottom: '1rem' }}>{q.q}</h3>
      <div style={{ display: 'grid', gap: '0.5rem', maxWidth: 400, margin: '0 auto' }}>
        {q.o.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)}
            style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)',
              background: selected === i ? (i === q.a ? '#22c55e33' : '#ef444433') : 'var(--bg-card)',
              color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem' }}>
            {opt}
          </button>
        ))}
      </div>
      <div style={{ marginTop: '1rem', color: 'var(--purple-light)', fontWeight: 600 }}>Score: {score}</div>
    </div>
  );
}

// ── Memória ─────────────────────────────────────────────
function Memory({ onEnd }) {
  const [cards] = useState(() => {
    const emojis = ['🎮','🎯','🎲','🏆','🎨','🎵','🎪','🎬'];
    const pairs = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    return pairs.map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }));
  });
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [attempts, setAttempts] = useState(0);

  const handleClick = (id) => {
    if (flipped.length === 2 || flipped.includes(id) || matched.has(id)) return;
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setAttempts(a => a + 1);
      const [a, b] = newFlipped;
      if (cards[a].emoji === cards[b].emoji) {
        const newMatched = new Set([...matched, a, b]);
        setMatched(newMatched);
        setFlipped([]);
        if (newMatched.size === cards.length) onEnd(Math.max(0, 200 - attempts * 10), 'won');
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,60px)', gap: '6px', justifyContent: 'center', marginBottom: '1rem' }}>
        {cards.map((c, i) => (
          <button key={i} onClick={() => handleClick(i)}
            style={{ width: 60, height: 60, fontSize: '1.5rem', borderRadius: 8, border: '1px solid var(--border)',
              background: flipped.includes(i) || matched.has(i) ? 'var(--bg-secondary)' : 'var(--purple)',
              cursor: 'pointer', color: 'var(--text-primary)' }}>
            {flipped.includes(i) || matched.has(i) ? c.emoji : '?'}
          </button>
        ))}
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tentativas: {attempts}</p>
    </div>
  );
}

// ── Adivinhe o Número ────────────────────────────────────
function GuessNumber({ onEnd }) {
  const [target] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState('');

  const handleGuess = () => {
    const n = parseInt(guess);
    if (isNaN(n)) return;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (n === target) { onEnd(Math.max(0, 200 - newAttempts * 20), 'won'); }
    else if (n < target) { setHint('Maior! ↑'); }
    else { setHint('Menor! ↓'); }
    setGuess('');
  };

  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <h3>Adivinhe o número (1-100)</h3>
      <div style={{ margin: '1rem 0' }}>
        <input type="number" value={guess} onChange={e => setGuess(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGuess()}
          style={{ width: 100, padding: '0.5rem', fontSize: '1.2rem', textAlign: 'center', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
      </div>
      <button onClick={handleGuess} className="btn btn-primary">Tentar</button>
      {hint && <p style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>{hint}</p>}
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tentativas: {attempts}</p>
    </div>
  );
}

// ── Roleta ──────────────────────────────────────────────
const ROULETTE_ITEMS = [
  { text: '+100 pontos', points: 100, color: '#22c55e' },
  { text: '+50 pontos', points: 50, color: '#3b82f6' },
  { text: '+200 pontos!', points: 200, color: '#f59e0b' },
  { text: 'Sem pontos', points: 0, color: '#ef4444' },
  { text: '+75 pontos', points: 75, color: '#8b5cf6' },
  { text: '+10 pontos', points: 10, color: '#6b7280' },
  { text: '+300 pontos!!', points: 300, color: '#f59e0b' },
  { text: '+150 pontos', points: 150, color: '#06b6d4' },
];

function Roleta({ onEnd }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const idx = Math.floor(Math.random() * ROULETTE_ITEMS.length);
    const angle = 360 / ROULETTE_ITEMS.length;
    const newRot = 1440 + (360 - idx * angle - angle / 2);
    setRotation(prev => prev + newRot);
    setTimeout(() => {
      setSpinning(false);
      setResult(ROULETTE_ITEMS[idx]);
      onEnd(ROULETTE_ITEMS[idx].points, 'won');
    }, 3000);
  };

  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <div style={{ width: 200, height: 200, borderRadius: '50%', border: '4px solid var(--border)',
        margin: '0 auto 1rem', position: 'relative', overflow: 'hidden', background: 'conic-gradient(' +
        ROULETTE_ITEMS.map((r, i) => `${r.color} ${i * (360 / ROULETTE_ITEMS.length)}deg ${(i + 1) * (360 / ROULETTE_ITEMS.length)}deg`).join(',') + ')' }}>
        <div style={{ position: 'absolute', inset: '35%', borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `rotate(${rotation}deg)`, transition: 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' }}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span>
        </div>
      </div>
      {!result ? (
        <button onClick={spin} className="btn btn-primary" disabled={spinning}>
          {spinning ? 'Girando...' : 'Girar Roleta!'}
        </button>
      ) : (
        <div>
          <p style={{ fontSize: '1.3rem', fontWeight: 700, color: result.color }}>{result.text}</p>
          <button onClick={spin} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Girar de novo</button>
        </div>
      )}
    </div>
  );
}

// ── Verdade ou Desafio ──────────────────────────────────
const VD_CARDS = [
  { type: 'verdade', text: 'Qual é o seu maior medo?' },
  { type: 'desafio', text: 'Faça 10 flexões agora!' },
  { type: 'verdade', text: 'Qual é o seu sonho?' },
  { type: 'desafio', text: 'Imite um animal por 30 segundos' },
  { type: 'verdade', text: 'Qual foi a maior vergonha da sua vida?' },
  { type: 'desafio', text: 'Cante uma música em voz alta' },
  { type: 'verdade', text: 'Qual pessoa você mais admira?' },
  { type: 'desafio', text: 'Faça uma selfie engraçada' },
];

function VerdadeDesafio({ onEnd }) {
  const [cards, setCards] = useState(VD_CARDS.sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [points, setPoints] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [showBack, setShowBack] = useState(true);

  const card = cards[idx % cards.length];

  const flip = () => {
    if (flipping) return;
    setFlipping(true);
    setShowBack(false);
    setTimeout(() => {
      setPoints(p => p + (card.type === 'desafio' ? 20 : 10));
      setFlipping(false);
    }, 1000);
  };

  const next = () => {
    setShowBack(true);
    if (idx + 1 >= cards.length) {
      onEnd(points, points >= 80 ? 'won' : 'lost');
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div onClick={flip}
        style={{ width: 250, height: 350, margin: '0 auto 1rem', perspective: 1000, cursor: 'pointer' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d',
          transform: showBack ? 'rotateY(0deg)' : 'rotateY(180deg)', transition: 'transform 0.6s' }}>
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 16,
            background: 'linear-gradient(135deg, var(--purple), var(--purple-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', color: 'white' }}>❓</div>
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 16, transform: 'rotateY(180deg)',
            background: card.type === 'verdade' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem', color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.8 }}>{card.type}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{card.text}</div>
          </div>
        </div>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Score: {points}</p>
      {!showBack && <button onClick={next} className="btn btn-primary">Próximo →</button>}
    </div>
  );
}

// ── Palavra Embaralhada ─────────────────────────────────
const WORDS = ['REACT','NODEJS','PYTHON','JAVASCRIPT','CSS','HTML','SERVER','DATABASE','CLOUD','GITHUB'];
function PalavraEmbaralhada({ onEnd }) {
  const [word] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [shuffled] = useState(() => word.split('').sort(() => Math.random() - 0.5).join(''));
  const [guess, setGuess] = useState('');

  const check = () => {
    if (guess.toUpperCase() === word) onEnd(100, 'won');
    else onEnd(0, 'lost');
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Embaralhado:</p>
      <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: 8, marginBottom: '1.5rem', color: 'var(--purple-light)' }}>{shuffled}</div>
      <input value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()}
        placeholder="Sua resposta..." autoFocus
        style={{ padding: '0.75rem 1rem', fontSize: '1.1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', textAlign: 'center', width: 200 }} />
      <div style={{ marginTop: '1rem' }}>
        <button onClick={check} className="btn btn-primary">Confirmar</button>
      </div>
    </div>
  );
}

// ── Enquete Relâmpago ───────────────────────────────────
const POLL = {
  question: 'Melhor linguagem de programação?',
  options: ['JavaScript','Python','Rust','Go'],
  correct: 0,
};
function Enquete({ onEnd }) {
  const [voted, setVoted] = useState(false);
  const [selected, setSelected] = useState(null);

  const vote = () => {
    if (selected === null) return;
    setVoted(true);
    setTimeout(() => onEnd(selected === POLL.correct ? 100 : 30, 'completed'), 2000);
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>{POLL.question}</h3>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {POLL.options.map((opt, i) => (
          <button key={i} onClick={() => !voted && setSelected(i)}
            style={{ padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--border)',
              background: voted ? (i === POLL.correct ? '#22c55e33' : (i === selected ? '#ef444433' : 'var(--bg-card)')) :
                (selected === i ? 'var(--purple)' : 'var(--bg-card)'),
              color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}>
            {opt}
          </button>
        ))}
      </div>
      {!voted && <div style={{ textAlign: 'center', marginTop: '1rem' }}><button onClick={vote} className="btn btn-primary">Votar</button></div>}
      {voted && <p style={{ textAlign: 'center', marginTop: '1rem', fontWeight: 700 }}>{selected === POLL.correct ? '✅ Correto!' : '❌ Errado!'}</p>}
    </div>
  );
}

// ── Caça-Palavras ─────────────────────────────────────
const WORDS_GRID = ['REACT','NODE','SERVER','CODIGO','APP','DADOS','WEB','FUNCAO','CLASSE','OBJETO'];

function CacaPalavras({ onEnd }) {
  const [grid] = useState(() => {
    const size = 12;
    const g = Array.from({ length: size }, () => Array(size).fill(''));
    const placed = [];
    for (const word of WORDS_GRID.slice(0, 5)) {
      let ok = false;
      for (let att = 0; att < 30 && !ok; att++) {
        const dir = [[0,1],[1,0]][Math.floor(Math.random() * 2)];
        const r = Math.floor(Math.random() * size);
        const c = Math.floor(Math.random() * (size - word.length));
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const nr = r + dir[0] * i, nc = c + dir[1] * i;
          if (g[nr][nc] && g[nr][nc] !== word[i]) { canPlace = false; break; }
        }
        if (canPlace) {
          for (let i = 0; i < word.length; i++) g[r + dir[0] * i][c + dir[1] * i] = word[i];
          placed.push(word);
          ok = true;
        }
      }
    }
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (!g[r][c]) g[r][c] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    return { grid: g, words: placed };
  });

  const [found, setFound] = useState([]);
  const [selected, setSelected] = useState([]);

  const handleCell = (r, c) => {
    const key = `${r},${c}`;
    if (selected.includes(key)) return setSelected(selected.filter(k => k !== key));
    if (selected.length < 5) setSelected([...selected, key]);
  };

  const checkSelection = () => {
    const letters = selected.map(k => { const [r,c] = k.split(',').map(Number); return grid.grid[r][c]; }).join('');
    const rev = [...selected].reverse().map(k => { const [r,c] = k.split(',').map(Number); return grid.grid[r][c]; }).join('');
    const matched = grid.words.find(w => (letters === w || rev === w) && !found.includes(w));
    if (matched) {
      const newFound = [...found, matched];
      setFound(newFound);
      setSelected([]);
      if (newFound.length >= grid.words.length) onEnd(newFound.length * 30, 'won');
    } else {
      setSelected([]);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '1rem' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        Palavras: {grid.words.join(', ')}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--purple-light)', marginBottom: '0.5rem' }}>
        Encontradas: {found.join(', ') || 'nenhuma'}
      </div>
      <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${grid.grid.length}, 28px)`, gap: 2, marginBottom: '0.5rem' }}>
        {grid.grid.map((row, r) => row.map((letter, c) => (
          <button key={`${r},${c}`} onClick={() => handleCell(r, c)}
            style={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700, borderRadius: 4,
              background: selected.includes(`${r},${c}`) ? 'var(--purple)' : 'var(--bg-card)',
              border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}>
            {letter}
          </button>
        )))}
      </div>
      {selected.length > 0 && (
        <div><button onClick={checkSelection} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Confirmar</button></div>
      )}
    </div>
  );
}

// ── Damas ───────────────────────────────────────────────
function Damas({ onEnd }) {
  const [board] = useState(() => {
    const b = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = 'b';
    for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = 'w';
    return b;
  });
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState('w');
  const [pieces, setPieces] = useState({ w: 12, b: 12 });

  const handleClick = (r, c) => {
    if (turn !== 'w') return;
    if (board[r][c] === 'w') { setSelected([r, c]); return; }
    if (selected && board[r][c] === null) {
      const [sr, sc] = selected;
      const dr = r - sr, dc = c - sc;
      if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
        board[r][c] = 'w'; board[sr][sc] = null;
        setPieces(p => ({ ...p, b: p.b - 1 }));
        setSelected(null);
        setTurn('b');
        if (pieces.b <= 1) onEnd(200, 'won');
      }
    }
  };

  useEffect(() => {
    if (turn === 'b' && pieces.b > 0) {
      const timer = setTimeout(() => {
        const empty = [];
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c] === null) empty.push([r, c]);
        if (empty.length) {
          const [r, c] = empty[Math.floor(Math.random() * empty.length)];
          const above = empty.filter(([er, ec]) => er === r - 1 && Math.abs(ec - c) === 1);
          const src = above.length ? above[Math.floor(Math.random() * above.length)] : null;
          if (src) {
            const [sr, sc] = src;
            if (board[sr][sc] === 'b') {
              board[r][c] = 'b'; board[sr][sc] = null;
              setPieces(p => ({ ...p, w: p.w - 1 }));
              if (pieces.w <= 1) onEnd(0, 'lost');
            }
          }
        }
        setTurn('w');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [turn]); // eslint-disable-line

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(8, 40px)', gap: 0, marginBottom: '0.5rem' }}>
        {board.map((row, r) => row.map((cell, c) => (
          <button key={`${r}-${c}`} onClick={() => handleClick(r, c)}
            style={{ width: 40, height: 40, border: '1px solid var(--border)',
              background: (r + c) % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-card)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              outline: selected && selected[0] === r && selected[1] === c ? '2px solid var(--purple-light)' : 'none' }}>
            {cell === 'w' && <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f8fafc', border: '2px solid #94a3b8' }} />}
            {cell === 'b' && <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e293b', border: '2px solid #475569' }} />}
          </button>
        )))}
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Suas peças: {pieces.w} | CPU: {pieces.b} | {turn === 'w' ? 'Sua vez' : 'CPU jogando...'}</p>
    </div>
  );
}

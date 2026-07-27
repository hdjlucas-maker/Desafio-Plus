/**
 * Desafio+ — Seed Script
 * Insere 15 badges + 48 desafios (16 solo, 16 a_dois, 16 turma)
 * Rodar: node seed.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'desafio-plus.db');
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// ── BADGES (15 do schema.sql) ────────────────────────────────────────────────
const badges = [
  ['primeiro-desafio', 'Primeiro Passo', 'Completou seu primeiro desafio', '🎯', 'comum', 50],
  ['streak-7', 'Semana Perfeita', '7 dias consecutivos de desafios', '🔥', 'raro', 200],
  ['streak-30', 'Mês Imparável', '30 dias consecutivos de desafios', '⚡', 'epico', 500],
  ['streak-100', 'Lendário', '100 dias consecutivos de desafios', '👑', 'lendario', 2000],
  ['social-butterfly', 'Borboleta Social', 'Seguiu 10 pessoas', '🦋', 'comum', 30],
  ['influencer', 'Influenciador', 'Ganhou 100 seguidores', '⭐', 'raro', 300],
  ['quiz-master', 'Mestre do Quiz', 'Acertou 10 quizzes seguidos', '🧠', 'raro', 150],
  ['game-champion', 'Campeão dos Jogos', 'Venceu 50 partidas de jogos', '🏆', 'epico', 400],
  ['desafio-solo', 'Lobo Solitário', 'Completou 10 desafios Solo', '🐺', 'comum', 80],
  ['desafio-duo', 'Dupla Dinâmica', 'Completou 10 desafios A Dois', '💑', 'raro', 150],
  ['desafio-turma', 'Alma da Festa', 'Completou 10 desafios em Turma', '🎉', 'raro', 150],
  ['nivel-10', 'Veterano', 'Atingiu o nível 10', '💎', 'epico', 600],
  ['nivel-50', 'Elite', 'Atingiu o nível 50', '🌟', 'lendario', 3000],
  ['primeiro-post', 'Criador de Conteúdo', 'Publicou seu primeiro post', '📸', 'comum', 20],
  ['viral', 'Viral', 'Recebeu 100 curtidas em um post', '🚀', 'epico', 500],
];

// ── DESAFIOS SOLO (16) ──────────────────────────────────────────────────────
const soloChallenges = [
  ['Meditação Matinal', 'Medite por 10 minutos ao acordar e registre como se sentiu', 'bem-estar', 'facil', 50, 10, 'comum', 1],
  ['Diário de Gratidão', 'Escreva 3 coisas pelas quais é grato hoje e tire foto', 'autoconhecimento', 'facil', 50, 10, 'comum', 0],
  ['Desafio Sem Redes', 'Fique 4 horas sem redes sociais e registre o que fez', 'digital-detox', 'medio', 100, 20, 'raro', 0],
  ['Novo Hobby', 'Experimente algo que nunca fez antes e documente', 'aventura', 'dificil', 200, 40, 'epico', 0],
  ['Caminhada de 30min', 'Caminhe por pelo menos 30 minutos e registre o trajeto', 'saude', 'facil', 60, 12, 'comum', 1],
  ['Leitura Express', 'Leia 20 páginas de um livro e compartilhe o que aprendeu', 'cultura', 'facil', 50, 10, 'comum', 0],
  ['Receita Nova', 'Prepare uma receita que nunca fez e tire foto do resultado', 'gastronomia', 'medio', 80, 16, 'comum', 0],
  ['Desafio Fitness', 'Faça 20 flexões, 20 abdominal e 20 agachamentos', 'saude', 'medio', 100, 20, 'raro', 1],
  ['Toque o Dia', 'Acordar antes das 7h e registrar como foi o início do dia', 'disciplina', 'dificil', 150, 30, 'raro', 0],
  ['Carta pra Mim', 'Escreva uma carta para você mesmo daqui 1 ano', 'autoconhecimento', 'medio', 80, 16, 'comum', 0],
  ['Limpa o Ambiente', 'Organize e limpe um cômodo da sua casa completamente', 'bem-estar', 'facil', 50, 10, 'comum', 0],
  ['Desafio Fotográfico', 'Tire 5 fotos criativas em lugares diferentes hoje', 'criatividade', 'medio', 90, 18, 'comum', 0],
  ['Sem Glicose', 'Passe o dia sem comer doces ou bebidas açucaradas', 'saude', 'dificil', 150, 30, 'raro', 0],
  ['Aprenda Algo', 'Assista um tutorial e aprenda uma habilidade nova', 'cultura', 'medio', 80, 16, 'comum', 0],
  ['Desafio 10K', 'Caminhe até completar 10.000 passos hoje', 'saude', 'dificil', 200, 40, 'epico', 0],
  ['Gratidão Ativa', 'Agradeça pessoalmente a 3 pessoas diferentes hoje', 'conexao', 'facil', 60, 12, 'comum', 1],
];

// ── DESAFIOS A DOIS (16) ────────────────────────────────────────────────────
const duoChallenges = [
  ['Jantar Surpresa', 'Prepare uma refeição surpresa para a outra pessoa', 'romance', 'medio', 100, 20, 'raro', 1],
  ['Carta Manuscrita', 'Escreva uma carta de mão para a outra pessoa', 'conexao', 'facil', 60, 12, 'comum', 0],
  ['Aventura Juntos', 'Façam algo que nunca fizeram juntos e registrem', 'aventura', 'dificil', 200, 40, 'epico', 0],
  ['Pôr do Sol', 'Assistam ao pôr do sol juntos e tirem uma foto', 'romance', 'facil', 50, 10, 'comum', 1],
  ['Cozinhar Juntos', 'Escolham uma receita e cozinhem juntos do zero', 'gastronomia', 'medio', 80, 16, 'comum', 0],
  ['Desafio Workout', 'Façam um treino juntos — podem ser calistenia em casa', 'saude', 'medio', 100, 20, 'raro', 0],
  ['Noite de Jogos', 'Joguem um jogo de tabuleiro ou cartas por 1 hora', 'diversao', 'facil', 50, 10, 'comum', 0],
  ['Música Dedicada', 'Escolham uma música que representa a amizade/relação', 'conexao', 'facil', 60, 12, 'comum', 0],
  ['Piquenique', 'Montem um piquenique em um parque ou praça', 'aventura', 'medio', 90, 18, 'comum', 0],
  ['Desafio Conversa', 'Conversem por 1 hora sem usar celular', 'conexao', 'dificil', 150, 30, 'raro', 0],
  ['Foto Clássica', 'Recriem uma foto antiga ou de meme juntos', 'diversao', 'facil', 50, 10, 'comum', 0],
  ['Aula Juntos', 'Façam uma aula online de algo que ambos querem aprender', 'cultura', 'medio', 80, 16, 'comum', 0],
  ['Desafio Aprendizado', 'Ensine algo que você sabe bem para a outra pessoa', 'conexao', 'medio', 90, 18, 'comum', 0],
  ['Noite Estrelada', 'Passem a noite olhando as estrelas e contando histórias', 'romance', 'dificil', 150, 30, 'raro', 0],
  ['Desafio Doação', 'Doem juntos roupas ou itens que não usam mais', 'solidariedade', 'medio', 100, 20, 'raro', 0],
  ['Maratona de Séries', 'Assistam 3 episódios de uma série e discutam o final', 'diversao', 'facil', 50, 10, 'comum', 0],
];

// ── DESAFIOS TURMA (16) ─────────────────────────────────────────────────────
const turmaChallenges = [
  ['Foto em Grupo', 'Tirem uma foto criativa em grupo em local público', 'social', 'facil', 50, 10, 'comum', 1],
  ['Desafio Culinário', 'Cada um traz um prato e fazem um jantar coletivo', 'gastronomia', 'medio', 120, 24, 'raro', 0],
  ['Karaokê Surpresa', 'Cantem uma música juntos em público', 'coragem', 'dificil', 250, 50, 'epico', 0],
  ['Pelada no Parque', 'Organizem uma pelada de futebol em um parque', 'esporte', 'medio', 100, 20, 'raro', 0],
  ['Noite de Jogos', 'Juntem-se para uma noite de jogos de tabuleiro', 'diversao', 'facil', 50, 10, 'comum', 0],
  ['Trilha em Grupo', 'Façam uma trilha ou caminhada longa juntos', 'aventura', 'dificil', 200, 40, 'epico', 0],
  ['Churrasco Coletivo', 'Organizem um churrasco onde cada um traz um item', 'gastronomia', 'medio', 100, 20, 'raro', 0],
  ['Mutirão de Limpeza', 'Limjem um espaço público juntos (praia, parque)', 'solidariedade', 'medio', 120, 24, 'raro', 0],
  ['Desafio Dança', 'Aprendam uma coreografia e gravem o vídeo', 'criatividade', 'dificil', 200, 40, 'epico', 0],
  ['Café Coletivo', 'Marquem um café onde cada um traz um livro pra trocar', 'cultura', 'facil', 50, 10, 'comum', 0],
  ['Gincana', 'Dividam-se em times e façam uma gincana com provas', 'diversao', 'medio', 150, 30, 'raro', 0],
  ['Passeio de Bicicleta', 'Façam um passeio de bike em grupo por um trajeto novo', 'aventura', 'medio', 100, 20, 'raro', 0],
  ['Show Caseiro', 'Montem um "show" onde cada um apresenta um talento', 'criatividade', 'dificil', 180, 36, 'epico', 0],
  ['Dia Sem Celular', 'Passem o dia todo juntos sem nenhum celular', 'conexao', 'dificil', 200, 40, 'epico', 0],
  ['Surpresa Coletiva', 'Organizem uma surpresa para um amigo do grupo', 'solidariedade', 'medio', 100, 20, 'raro', 0],
  ['Maratona de Filmes', 'Assistam 3 filmes clássicos e votem no melhor', 'diversao', 'facil', 50, 10, 'comum', 0],
];

// ── INSERÇÃO ─────────────────────────────────────────────────────────────────
const insertBadge = db.prepare(
  'INSERT OR IGNORE INTO badges (slug, name, description, icon, rarity, xp_reward) VALUES (?, ?, ?, ?, ?, ?)'
);
const insertChallenge = db.prepare(
  'INSERT OR IGNORE INTO challenges (id, title, description, mode, category, difficulty, xp_reward, points_reward, rarity, is_daily) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

const seedAll = db.transaction(() => {
  let badgeCount = 0;
  for (const b of badges) {
    const r = insertBadge.run(...b);
    if (r.changes > 0) badgeCount++;
  }

  let challengeCount = 0;
  const modes = [
    { mode: 'solo', challenges: soloChallenges, prefix: 'ch-solo' },
    { mode: 'a_dois', challenges: duoChallenges, prefix: 'ch-duo' },
    { mode: 'turma', challenges: turmaChallenges, prefix: 'ch-turma' },
  ];

  for (const { mode, challenges: list, prefix } of modes) {
    list.forEach((c, i) => {
      const id = `${prefix}-${String(i + 1).padStart(2, '0')}`;
      const r = insertChallenge.run(id, c[0], c[1], mode, c[2], c[3], c[4], c[5], c[6], c[7]);
      if (r.changes > 0) challengeCount++;
    });
  }

  return { badgeCount, challengeCount };
});

const result = seedAll();

// ── VERIFICAÇÃO ──────────────────────────────────────────────────────────────
const totalBadges = db.prepare('SELECT COUNT(*) AS c FROM badges').get().c;
const totalChallenges = db.prepare('SELECT COUNT(*) AS c FROM challenges').get().c;
const byMode = db.prepare('SELECT mode, COUNT(*) AS c FROM challenges GROUP BY mode').all();

console.log(`\n✅ Seed concluído!`);
console.log(`   Badges: ${result.badgeCount} inseridos (${totalBadges} total)`);
console.log(`   Desafios: ${result.challengeCount} inseridos (${totalChallenges} total)`);
for (const m of byMode) {
  console.log(`     ${m.mode}: ${m.c}`);
}

db.close();

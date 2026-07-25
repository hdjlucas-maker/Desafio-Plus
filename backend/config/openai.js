/**
 * Desafio+ — OpenAI Integration (com lazy init + fallback)
 * O backend NÃO crasha se OPENAI_API_KEY não estiver configurada.
 * As funções retornam valores padrão quando a key está ausente.
 */

let _client = null;

function getClient() {
  if (_client) return _client;

  const key = process.env.OPENAI_API_KEY;
  if (!key || key.trim() === '' || key === 'sua-chave-aqui') {
    return null; // sem key → fallback
  }

  try {
    const OpenAI = require('openai');
    _client = new OpenAI({ apiKey: key });
    return _client;
  } catch (err) {
    console.warn('[OpenAI] Falha ao inicializar client:', err.message);
    return null;
  }
}

// ─── Fallbacks (usados quando não há API key) ────────────────────────────────

const FALLBACK_CHALLENGES = [
  {
    title: 'Desafio Surpresa',
    description: 'Faça algo diferente hoje — saia da rotina e surpreenda alguém!',
    difficulty: 'facil',
    rarity: 'comum',
    xp_reward: 30,
    points_reward: 10,
  },
  {
    title: 'Conexão Real',
    description: 'Ligue para um amigo que você não fala há muito tempo.',
    difficulty: 'facil',
    rarity: 'comum',
    xp_reward: 40,
    points_reward: 15,
  },
  {
    title: 'Aventura Local',
    description: 'Explore um lugar da sua cidade que você nunca foi.',
    difficulty: 'medio',
    rarity: 'raro',
    xp_reward: 80,
    points_reward: 25,
  },
];

const FALLBACK_TIPS = [
  'Você consegue! Cada passo conta. 💪',
  'Acredite em você — esse desafio foi feito para ser vencido! 🚀',
  'Vai lá! A melhor hora é agora. ⚡',
];

// ─── Funções exportadas ───────────────────────────────────────────────────────

/**
 * Gera desafios personalizados com IA.
 * Retorna fallback se não houver API key.
 */
async function generateChallenges({ mode, category = 'geral', completedIds = [], count = 3 }) {
  const client = getClient();

  if (!client) {
    console.info('[OpenAI] Sem API key — usando desafios fallback.');
    return FALLBACK_CHALLENGES.slice(0, count);
  }

  const modeLabel = {
    solo: 'individual',
    a_dois: 'para casal ou dupla',
    turma: 'para grupo de amigos',
  }[mode] || mode;

  const prompt = `Você é o gerador de desafios do app Desafio+, uma rede social brasileira de desafios reais.
Gere ${count} desafios ${modeLabel} na categoria "${category}".
Cada desafio deve:
- Ser divertido, seguro e realizável no mundo real
- Incentivar conexão humana e experiências fora da tela
- Ter título curto (máx 50 chars) e descrição clara (máx 150 chars)
- Ter dificuldade: facil | medio | dificil | epico
- Ter raridade: comum | raro | epico | lendario

Responda APENAS com JSON válido no formato:
[
  {
    "title": "...",
    "description": "...",
    "difficulty": "facil",
    "rarity": "comum",
    "xp_reward": 50,
    "points_reward": 10
  }
]`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0].message.content;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.challenges || FALLBACK_CHALLENGES.slice(0, count);
  } catch (err) {
    console.warn('[OpenAI] generateChallenges falhou:', err.message);
    return FALLBACK_CHALLENGES.slice(0, count);
  }
}

/**
 * Modera conteúdo de texto (posts, comentários).
 * Retorna { safe: true } como fallback (fail-open).
 */
async function moderateContent(text) {
  const client = getClient();

  if (!client) {
    return { safe: true, reason: null }; // sem key → aprova tudo (fail-open)
  }

  try {
    const result = await client.moderations.create({ input: text });
    const flagged = result.results[0]?.flagged || false;
    const categories = result.results[0]?.categories || {};
    const reason = Object.entries(categories)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ');
    return { safe: !flagged, reason: reason || null };
  } catch (err) {
    console.warn('[OpenAI] moderateContent falhou:', err.message);
    return { safe: true, reason: null }; // fail-open
  }
}

/**
 * Gera uma dica motivacional para o usuário.
 * Retorna dica padrão se não houver API key.
 */
async function generateChallengeTip(challengeTitle, userName) {
  const client = getClient();

  if (!client) {
    const tip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
    return tip;
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Dê uma dica motivacional curta (máx 2 frases) em português brasileiro para ${userName} completar o desafio: "${challengeTitle}". Seja animado e encorajador!`,
      }],
      max_tokens: 100,
      temperature: 0.9,
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.warn('[OpenAI] generateChallengeTip falhou:', err.message);
    return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  }
}

module.exports = { generateChallenges, moderateContent, generateChallengeTip };

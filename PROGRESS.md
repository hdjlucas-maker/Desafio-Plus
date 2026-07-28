# PROGRESS.md — Desafio+

> Atualizado a cada sessão de trabalho, por qualquer IA. Toda IA nova LÊ ISTO PRIMEIRO antes de tocar em qualquer arquivo.
> Local deste arquivo: D:\desafio-plus\PROGRESS.md

---

## Stack (não mude sem aprovação)
- **Frontend:** React 18 (Create React App) — `frontend/`
- **Backend:** Node.js + Express rodando como Cloudflare Workers (via `worker-adapter.js` + Wrangler) — `backend/`
- **Banco:** Cloudflare D1 / SQLite — schema em `backend/schema.sql` + `backend/schema-additions.sql`, auto-migração em `backend/config/db.js`
- **Storage de mídia:** Upload local via multer para `backend/uploads/` — R2 configurado em `backend/config/r2.js` mas NÃO utilizado (era pra Cloudflare Workers)
- **Geração de conteúdo por IA:** OpenAI — `backend/config/openai.js`, endpoint `POST /api/challenges/ai-generate`
- **Auth:** JWT (access 15min + refresh 30d) com token rotation + Google OAuth (id_token via `google-auth-library`)
- **Deploy:** Wrangler CLI (Workers pro backend, Pages pro frontend) — **DEPLOYADO!**
  - Backend Workers: `https://desafio-plus-api.hdjlucas.workers.dev`
  - Frontend Pages: `https://6c2a3df4.desafio-plus.pages.dev`

---

## Mapa completo do projeto (não re-auditar, consulte aqui)

### Frontend — Arquitetura

| Caminho | Função |
|---------|--------|
| `frontend/src/index.js` | Entry point — importa `global.css` + `accessibility.css` |
| `frontend/src/App.js` | Rotas + AuthProvider + Navbar + OnlineNotification |
| `frontend/src/context/AuthContext.js` | Auth state, login/logout/register/googleLogin, refresh token |
| `frontend/src/services/api.js` | Axios client com 12 módulos: authAPI, postsAPI, feedAPI, notificationsAPI, challengesAPI, chatAPI, uploadAPI, gamesAPI, usersAPI, searchAPI, presenceAPI, suggestionsAPI |
| `frontend/src/hooks/useFeed.js` | Scroll infinito com offset-based pagination (20/página) |
| `frontend/src/hooks/useNotifications.js` | Notificações + unread count com polling 30s |
| `frontend/src/components/Navbar.js` | Top bar (desktop) + Bottom nav (mobile) + avatar dropdown menu |
| `frontend/src/components/PostCard.js` | Card de post com mídia, likes, comentários, delete |
| `frontend/src/components/OnlineNotification.js` | Toast quando usuários ficam online (polling 30s) |
| `frontend/src/components/BlockButton.js` | **NÃO USADO** — componente morto |

### Frontend — Páginas

| Rota | Arquivo | Status | Largura desktop | Notas |
|------|---------|--------|-----------------|-------|
| `/login` | `pages/Login.js` | OK | Auth card centralizado | Google botão desabilitado ("em breve") |
| `/register` | `pages/Register.js` | OK | Auth card centralizado | Google botão redireciona (funciona se backend configurado) |
| `/auth/google/callback` | `pages/GoogleCallback.js` | OK | — | Handler OAuth, inline styles |
| `/feed` | `pages/Feed.js` | OK | `maxWidth: 680` | Post creation + infinite scroll + mídia (corrigido sessão passada) |
| `/explore` | `pages/Explore.js` | OK | `maxWidth: 680` | Feed público via useFeed('explore') |
| `/profile/:username` | `pages/Profile.js` | OK | `maxWidth: 680` | Stats, badges, XP bar, follow, posts |
| `/chat` | `pages/Chat.js` | OK | `maxWidth: 900` | Sidebar 280px + messages. **Mobile: toggle lista/msg com botão voltar** |
| `/challenges` | `pages/Challenges.js` | OK | `maxWidth: 680` | Daily + all, filtro por modo, AI generate. **Tabela challenges vazia no banco** |
| `/games` | `pages/Games.js` | **10/10 OK** | `maxWidth: 900` | Grid 10 jogos, todos implementados |
| `/notifications` | `pages/Notifications.js` | OK | `maxWidth: 680` | Lista com read/unread, mark all read |
| `/search` | `pages/Search.js` | OK | `maxWidth: 680` | Busca users + posts |
| `/settings` | `pages/Settings.js` | OK | `maxWidth: 480` | Editar nome, bio, privacidade |
| `/settings/privacy` | `pages/PrivacySettings.js` | OK | `maxWidth: 680` | Toggles + blocked list. Usa `fetch()` em vez de axios |
| `/discover` | `pages/Discover.js` | Parcial | `maxWidth: 900` | Nearby/online users. Convite de jogo = stub |

### Frontend — CSS

| Arquivo | Importado? | Função |
|---------|-----------|--------|
| `src/styles/global.css` | **SIM** (index.js) | Design system: variáveis, utilitários (.card, .btn, .input, .avatar, .badge, .spinner), layout, navbar, bottom nav, modal, responsivo |
| `src/styles/accessibility.css` | **SIM** (index.js) | Touch targets, font sizes, reduced motion |
| `src/styles/Auth.css` | **SIM** (Login.js, Register.js) | Estilos das páginas de auth |
| `src/styles/PrivacySettings.css` | **SIM** (PrivacySettings.js) | Toggle switches customizados |
| `styles/App.css` | **NÃO** (fora de src/) | Design system v9 alternativo, NÃO utilizado |

### Backend — Arquitetura

| Caminho | Função |
|---------|--------|
| `backend/server.js` | Entry point Express (local dev) — CORS, rotas, static uploads |
| `backend/worker.js` | Entry point Hono (Cloudflare Workers) — adapter Express→Hono, todas as rotas |
| `backend/worker-adapter.js` | Legacy adapter (substituído por worker.js) |
| `backend/config/db.js` | Dual-mode: better-sqlite3 (local) / D1 (Workers via globalThis.__CF_ENV__) |
| `backend/config/openai.js` | OpenAI client config |
| `backend/config/r2.js` | Cloudflare R2 config — **NÃO UTILIZADO** |
| `backend/middleware/auth.js` | requireAuth, optionalAuth, generate tokens, verifyRefreshToken |
| `backend/middleware/rateLimiter.js` | Rate limits (1000/15min dev, 200/15min prod) |
| `backend/middleware/sanitize.js` | XSS basic sanitization |

### Backend — Rotas (53 endpoints)

| Prefixo | Arquivo | Status | Notas |
|---------|---------|--------|-------|
| `/health` | server.js inline | OK | GET health check |
| `/api/auth` | routes/auth.js | OK | register, login, google, refresh, logout, forgot/reset-password, me |
| `/api/users` | routes/users.js | OK | suggestions, ranking, profile, posts, follow/unfollow, block, update |
| `/api/posts` | routes/posts.js | OK | CRUD, like, comments |
| `/api/feed` | routes/feed.js | OK | GET / (auth required), GET /explore (optional auth) — aceita limit+offset |
| `/api/blocks` | routes/blockRoutes.js | OK | block/unblock, blocked list, privacy |
| `/api/challenges` | routes/challenges.js | OK | daily, all, complete, history, ai-generate, tip |
| `/api/games` | routes/games.js | ⚠️ | recordSession, leaderboard, history, stats — **tabelas game_sessions/game_leaderboard NÃO existem no db.js** |
| `/api/chat` | routes/chat.js | ⚠️ | conversations, messages — **tabelas conversations/messages NÃO existem no db.js** |
| `/api/notifications` | routes/notifications.js | OK | list, unread-count, mark-all-read, mark-read |
| `/api/search` | routes/search.js | OK | Busca users + posts |
| `/api/upload` | routes/upload.js | OK | Upload local via multer → `/uploads/filename.ext` |
| `/api/reports` | routes/reports.js | ⚠️ | **Tabela reports NÃO existe no db.js** |
| `/api/presence` | routes/presence.js | ⚠️ | **NÃO MONTADO** — código morto em server.js (após return) |
| `/api/suggestions` | routes/suggestions.js | ⚠️ | **NÃO MONTADO** — código morto em server.js (após return) |

### Backend — Controllers

| Arquivo | Função | Notas |
|---------|--------|-------|
| controllers/authController.js | Login, register, Google, refresh, forgot/reset | Google: id_token verification (não redirect) |
| controllers/postsController.js | CRUD posts, like, comments | AI moderation no create |
| controllers/usersController.js | Profile, follow, block, ranking, suggestions | Ranking: points/xp/streak modes |
| controllers/gamesController.js | Record session, leaderboard, stats | OK — tabelas criadas na sessão anterior |
| controllers/challengesController.js | Daily, all, complete, AI generate, tips | Funcional — 48 desafios + 15 badges populados |
| controllers/chatController.js | Conversations, messages | OK — tabelas criadas na sessão anterior |
| controllers/notificationsController.js | List, unread, mark read | OK |
| controllers/blockController.js | — | **CÓDIGO MORTO** — usa padrão D1, nunca importado |

### Backend — Models

| Arquivo | Função |
|---------|--------|
| models/userModel.js | CRUD users, XP, streak, follow, badges, stats (16 funções) |
| models/postModel.js | CRUD posts, feed, explore, like, comments. `findById` faz JSON.parse em media_urls |
| models/chatModel.js | Conversations, messages | OK — tabelas criadas na sessão anterior |
| models/notificationModel.js | CRUD notifications (5 funções) |

---

## Bugs conhecidos / débito técnico

### Críticos (funcionalidade quebrada)
1. ~~**Usuários de teste**~~ **RESOLVIDO** — alice@test.com/alice123 e bob@test.com/bob12345 criados no D1
2. ~~**Tabela challenges vazia**~~ **RESOLVIDO** — 48 desafios populados via seed.js + wrangler d1 execute
3. ~~**Tabela badges vazia**~~ **RESOLVIDO** — 15 badges populados via seed.js + wrangler d1 execute
20. ~~**Explore feed retornava 0 posts**~~ **CORRIGIDO** — argumentos invertidos no `getExplorePosts()` do worker.js

### Médios
4. **Google OAuth não configurado**: `.env` tem `GOOGLE_CLIENT_ID=` e `GOOGLE_CLIENT_SECRET=` vazios. Login.js mostra "em breve". Register.js redireciona para backend (funciona se configurado).
5. **Password reset sem envio de email**: Token logado no console. `nodemailer` instalado mas não usado.
6. **PrivacySettings usa fetch() em vez de axios** — usa `access_token` do localStorage (consistente com AuthContext).
7. ~~**Two localStorage keys**: `api.js` lê `token`, AuthContext usa `access_token`~~ **CORRIGIDO** — `api.js` agora usa `access_token`.
8. **R2 storage configurado mas NÃO habilitado na conta Cloudflare** — precisa habilitar R2 no Dashboard antes de usar uploads no Workers. Uploads locais continuam funcionando.
9. ~~**2 jogos não implementados**: Caça-Palavras e Damas~~ **CORRIGIDO** — ambos implementados em Games.js.
10. **Game invite no Discover é stub**: `alert('Funcionalidade em desenvolvimento')`.
11. **BlockButton.js nunca é importado** — componente morto.
12. **Profile.js**: variável `tab` declarada mas nunca usada no render.
17. ~~**PostCard media URL relativo**~~ **CORRIGIDO** — `resolveMediaUrl()` prefixa com API base.
18. ~~**Chat API desalinhada**~~ **CORRIGIDO** — frontend `chatAPI` agora casa com backend routes.
19. ~~**Discover chat com userId**~~ **CORRIGIDO** — agora usa `username` e Chat.js auto-abre conversa.

### Baixos
13. **Login.js link "Esqueci senha"** → rota `/forgot-password` não existe.
14. **Share count não incrementa** — botão copia link mas não atualiza `shares_count`.
15. **Sem ranking page no frontend** — endpoint backend `GET /api/users/ranking` existe mas sem página.
16. **Sem sistema de temporadas** — tabelas seasons/season_rankings não criadas, sem controller.

---

## Checklist geral (marque conforme evolui)

- [x] Cadastro e login funcionando (JWT) — alice@test.com/alice123, bob@test.com/bob12345
- [ ] Login com Google testado de ponta a ponta (precisa configurar `.env`)
- [x] Deploy em produção confirmado (Workers + Pages) — Backend em Hono, frontend com REACT_APP_API_URL configurado
- [x] **15+ desafios ativos por modo (solo/a_dois/turma) — 48 desafios (16 por modo)**
- [x] **15 badges com critério de desbloqueio — inseridos via seed.js**
- [x] Tabelas game_sessions/game_leaderboard/conversations/messages/reports criadas no db.js
- [x] Schema challenges alinhado com colunas que controllers esperam
- [x] Presence/Suggestions routes adicionadas ao server.js
- [x] PostCard media URL relativo corrigido (resolveMediaUrl)
- [x] localStorage unificado (access_token)
- [x] Chat API alinhada frontend↔backend
- [x] Discover→Chat navega com username, Chat.js auto-abre conversa
- [x] Challenges API alinhada frontend↔backend
- [x] getDailyChallenges params bug corrigido
- [x] 10/10 jogos implementados (Caça-Palavras + Damas)
- [ ] Pontos, XP, nível, streak calculando certo
- [x] Feed com post, mídia, like, comentário funcionando — **TESTADO EM PRODUÇÃO**
- [x] Explore feed funcionando (bug args invertidos corrigido)
- [x] Chat, follow, presence, search, ranking — **TESTADO EM PRODUÇÃO**
- [x] Responsividade mobile: bottom nav, chat toggle, global.css importado
- [x] 3+ jogos jogáveis testados de ponta a ponta
  - Testados: Jogo da Velha, Quiz e Memória
  - Endpoints: POST /api/games/session, GET /api/games/my-history, GET /api/games/my-stats, GET /api/games/leaderboard
  - Pontos e XP atualizados corretamente no perfil do usuário (verificado em produção)
- [x] Ranking page no frontend
  - Página /ranking criada com abas Pontos/XP/Streak
  - Navbar e bottom nav com link para /ranking
  - Consome GET /api/users/ranking - testado em produção
- [x] App publicado e acessível por URL pública — Workers API + Pages frontend
- [x] 16/16 endpoints testados em produção (register, login, me, feed, explore, post, like, comment, chat, follow, profile, challenges, game session, stats, notifications, presence, search, ranking)

---

## Última sessão
- Data: 26/07/2026
- IA usada: opencode (big-pickle)
- O que foi feito (Deploy + pendências):
  1. **Migração Express→Hono** — Express não funciona no Workers (streams indisponíveis). Criado `worker.js` com Hono + adapter Express→Hono.
  2. **db.js dual-mode** — better-sqlite3 (local) / D1 (Workers via `globalThis.__CF_ENV__`).
  3. **auth.js dinâmico** — `getJwtSecret()` em runtime.
  4. **Backend deployado** → `https://desafio-plus-api.hdjlucas.workers.dev`
  5. **Frontend deployado** → `https://6c2a3df4.desafio-plus.pages.dev`
  6. **16/16 endpoints testados** em produção (register, login, me, feed, explore, post, like, comment, chat, follow, profile, challenges, game session, stats, notifications, presence, search, ranking)
  7. **Bug explore feed corrigido** — argumentos `getExplorePosts()` invertidos no worker.js
  8. **Dados de teste limpos** — removidos testuser5/nickteste, mantidos alice/bob com posts, likes, comments, follows, games
  9. **Pages env var setada** — `REACT_APP_API_URL` como secret no Pages
  10. **worker-adapter.js marcado como deprecated**
  11. **PROGRESS.md atualizado** com estado final
- Arquivos criados: `backend/worker.js`, `frontend/.env.production`
- Arquivos alterados: `wrangler.toml`, `backend/config/db.js`, `backend/middleware/auth.js`, `backend/server.js`, `backend/routes/upload.js`, `backend/controllers/authController.js`, `backend/package.json`, `frontend/src/pages/Games.js`
- **Pendência restante**: R2 não habilitado na conta Cloudflare (precisa Dashboard manual)
- Próximo passo: **habilitar R2 para uploads** ou **testar jogos de ponta a ponta** ou **criar ranking page**

---

## Decisões já tomadas (não perguntar de novo)
- Sem apostas com dinheiro real — só pontos virtuais
- Sem live ao vivo no MVP
- Tom de conteúdo: português BR, direto, sem clichê corporativo
- Jogos com sensação de aposta/emoção usam só pontos virtuais (roleta, caixa misteriosa, bolão)
- Upload de mídia: local via multer (R2 disponível mas não usado)
- Navbar: top bar desktop + bottom nav mobile (padrão app social)
- Largura máxima de conteúdo: 680px (feed, challenges, profile, notifications), 900px (games, chat)

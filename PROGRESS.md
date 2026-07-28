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
| `/api/games` | routes/games.js | OK | recordSession, leaderboard, history, stats — tabelas existem em db.js |
| `/api/chat` | routes/chat.js | OK | conversations, messages — tabelas existem em db.js |
| `/api/notifications` | routes/notifications.js | OK | list, unread-count, mark-all-read, mark-read |
| `/api/search` | routes/search.js | OK | Busca users + posts |
| `/api/upload` | routes/upload.js | OK | Upload local via multer → `/uploads/filename.ext` |
| `/api/reports` | routes/reports.js | OK | tabela reports existe em db.js, rota inline em worker.js |
| `/api/presence` | routes/presence.js | OK | heartbeat, online, nearby — tabela user_presence em db.js, rotas inline em worker.js |
| `/api/suggestions` | routes/suggestions.js | OK | nearby, online — rotas inline em worker.js |

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
| controllers/blockController.js | — | **REMOVIDO** — código morto, arquivo eliminado |

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
21. ~~**Presence nearby usava display_name para filtrar estado**~~ **CORRIGIDO** — `/api/presence/nearby` agora usa tabela `user_presence.state`

### Médios
4. ~~**Google OAuth não configurado**~~ **REMOVIDO** — login com Google removido do frontend e backend. Restam apenas e-mail/senha.
5. **Password reset sem envio de email**: Token logado no console. `nodemailer` instalado mas não usado.
6. ~~**PrivacySettings usa fetch() em vez de axios**~~ **CORRIGIDO** — migrado para `usersAPI` com axios.
7. ~~**Two localStorage keys**: `api.js` lê `token`, AuthContext usa `access_token`~~ **CORRIGIDO** — `api.js` agora usa `access_token`.
8. **R2 storage configurado mas NÃO habilitado na conta Cloudflare** — precisa habilitar R2 no Dashboard antes de usar uploads no Workers. Uploads locais continuam funcionando.
9. ~~**2 jogos não implementados**: Caça-Palavras e Damas~~ **CORRIGIDO** — ambos implementados em Games.js.
10. **Game invite no Discover é stub**: `alert('Funcionalidade em desenvolvimento')`.
11. ~~**BlockButton.js nunca é importado**~~ **REMOVIDO** — arquivo eliminado, código morto removido.
12. ~~**Profile.js**: variável `tab` declarada mas nunca usada no render~~ **REMOVIDO** — variável não utilizada eliminada.
13. ~~**Login.js link "Esqueci senha"** → rota `/forgot-password` não existe~~ **CORRIGIDO** — rota adicionada no App.js.
14. ~~**Bio não atualizava no perfil**~~ **CORRIGIDO** — `userModel.update` estava recebendo `undefined` do controller; agora filtra valores não enviados.
17. ~~**PostCard media URL relativo**~~ **CORRIGIDO** — `resolveMediaUrl()` prefixa com API base.
18. ~~**Chat API desalinhada**~~ **CORRIGIDO** — frontend `chatAPI` agora casa com backend routes.
19. ~~**Discover chat com userId**~~ **CORRIGIDO** — agora usa `username` e Chat.js auto-abre conversa.
22. ~~**Logout/login retornava credenciais inválidas**~~ **CORRIGIDO** — logout revoga refresh token corretamente; login com e-mail/senha testado e funcionando.
15. ~~**Sem ranking page no frontend**~~ **CORRIGIDO** — página /ranking criada com abas Pontos/XP/Streak
16. **Sem sistema de temporadas** — tabelas seasons/season_rankings não criadas, sem controller.

---

## Checklist geral (marque conforme evolui)

- [x] Cadastro e login funcionando (JWT) — alice@test.com/alice123, bob@test.com/bob12345
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
- [x] Pontos, XP, nível, streak calculando certo
  - addXP calcula level = floor((total_xp) / 500) + 1 — testado via jogos (Jogo da Velha, Quiz, Memória)
  - updateStreak atualiza streak diário em challenge_completions — testado em produção
  - Jogos registram pontos corretamente e refletem no perfil
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
- Data: 28/07/2026
- IA usada: Kilo
- O que foi feito (Limpeza + Correções + Ranking):
   1. **Código morto eliminado** — removidos `backend/controllers/blockController.js`, `backend/worker-adapter.js` e `frontend/src/components/BlockButton.js`
   2. **Bug presence nearby corrigido** — `/api/presence/nearby` no `worker.js` usava `display_name` para filtrar estado; agora usa tabela `user_presence.state`
   3. **Página Ranking criada** — `/ranking` com abas Pontos/XP/Streak, integrada na Navbar e bottom nav
   4. **API client atualizado** — `usersAPI.getRanking` adicionado em `frontend/src/services/api.js`
   5. **Profile.js limpo** — removida variável `tab` declarada mas não usada
   6. **3+ jogos testados E2E** — Jogo da Velha, Quiz e Memória registram sessão e atualizam pontos no perfil
   7. **Pontos/XP/nível/streak verificados** — `addXP` e `updateStreak` calculando corretamente
   8. **PROGRESS.md atualizado** — rotas presence/suggestions/reports/games/chat corrigidas de ⚠️ para OK
   9. **.gitignore atualizado** — adicionado `backend/desafio-plus.db*` para não commitar banco local
- Arquivos criados: `frontend/src/pages/Ranking.js`
- Arquivos alterados: `PROGRESS.md`, `backend/worker.js`, `frontend/src/pages/Profile.js`, `frontend/src/pages/Ranking.js`, `frontend/src/App.js`, `frontend/src/components/Navbar.js`, `frontend/src/services/api.js`, `.gitignore`
- Arquivos eliminados: `backend/controllers/blockController.js`, `backend/worker-adapter.js`, `frontend/src/components/BlockButton.js`, `frontend/src/pages/GoogleCallback.js`
- **Pendências restantes**: R2 não habilitado na conta Cloudflare; Google OAuth removido do projeto
- Próximo passo: **habilitar R2** ou corrigir itens locais pendentes

---

## Decisões já tomadas (não perguntar de novo)
- Sem apostas com dinheiro real — só pontos virtuais
- Sem live ao vivo no MVP
- Tom de conteúdo: português BR, direto, sem clichê corporativo
- Jogos com sensação de aposta/emoção usam só pontos virtuais (roleta, caixa misteriosa, bolão)
- Upload de mídia: local via multer (R2 disponível mas não usado)
- Navbar: top bar desktop + bottom nav mobile (padrão app social)
- Largura máxima de conteúdo: 680px (feed, challenges, profile, notifications), 900px (games, chat)

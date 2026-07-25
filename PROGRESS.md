# PROGRESS.md — Desafio+

> Atualizado a cada sessão de trabalho, por qualquer IA. Toda IA nova LÊ ISTO PRIMEIRO antes de tocar em qualquer arquivo.
> Local deste arquivo: D:\desafio-plus\PROGRESS.md

## Stack (não mude sem aprovação)
- Frontend: React (Create React App) — `frontend/`, páginas em `frontend/src/pages/`, componentes em `frontend/src/components/`, API centralizada em `frontend/src/services/api.js`, auth em `frontend/src/context/AuthContext.js`
- Backend: Node.js + Express rodando como Cloudflare Workers (via `worker-adapter.js` + Wrangler) — `backend/`
- Banco: Cloudflare D1 / SQLite — schema em `backend/schema.sql` + `backend/schema-additions.sql`
- Storage de mídia: Cloudflare R2 — `backend/config/r2.js`
- Geração de conteúdo por IA: OpenAI — `backend/config/openai.js`, endpoint `POST /api/challenges/ai-generate`
- Auth: JWT (com refresh token) + Google OAuth
- Deploy: Wrangler CLI (Workers pro backend, Pages pro frontend) — status de deploy em produção: **não confirmado, verificar**

## Tabelas existentes no schema (backend/schema.sql + schema-additions.sql)
users, badges, user_badges, follows, blocks, posts, likes, comments, reactions,
challenges, challenge_completions, seasons, season_rankings, game_sessions,
game_leaderboard, conversations, messages, notifications, reports,
password_reset_tokens, refresh_tokens, user_settings

## Estado real dos dados (checado direto no `backend/desafio-plus.db` local em 25/07/2026)
- users: 3 registros (cadastro/login já testado com sucesso)
- posts: 2 registros
- **challenges: 0 registros** ⚠️ vazio — nenhum desafio cadastrado ainda
- **badges: 0 registros** ⚠️ vazio — README menciona 15 badges padrão mas eles NÃO estão no banco atual
- user_badges: 0
- challenge_completions: 0
- comments: 0 / likes: 0
- notifications: 3

## Checklist geral (marque conforme evolui)
- [x] Cadastro e login funcionando localmente (JWT) — 3 usuários de teste no banco
- [ ] Login com Google testado de ponta a ponta
- [ ] Deploy em produção confirmado (Workers + Pages) — verificar se `desafio-plus.pages.dev` está no ar
- [ ] **15+ desafios ativos por modo (solo/a_dois/turma) cadastrados no banco — PRIORIDADE ATUAL**
- [ ] **10+ badges cadastrados com critério de desbloqueio funcionando de verdade**
- [ ] Pontos, XP, nível, streak calculando certo (testar após popular desafios)
- [ ] Feed (post, like, comentário) — post básico já funciona, like/comentário testar
- [ ] 3+ jogos jogáveis do início ao fim (quiz "Você sabia?", Verdade ou Desafio, enquete relâmpago) — ver `backend/controllers/gamesController.js` e `frontend/src/pages/Games.js`, já existem mas não testados de ponta a ponta
- [ ] Ranking/temporada (`seasons`, `season_rankings`) exibindo corretamente
- [ ] App publicado e acessível por URL pública, testado em celular

## Última sessão
- Data: 25/07/2026
- IA usada: Claude (Sonnet 5, claude.ai)
- O que foi feito: inspeção do zip do projeto real, leitura do schema e do banco local, criação deste PROGRESS.md e do prompt mestre de qualificação/continuidade
- Arquivos alterados: nenhum arquivo do projeto foi alterado, só leitura/diagnóstico
- O que ficou pendente: popular `challenges` e `badges` com conteúdo real; confirmar se há deploy em produção ativo
- Próximo passo imediato: **gerar o primeiro lote de desafios (15 por modo) e badges (10+) em JSON pronto pro schema, e inserir no banco**

## Decisões já tomadas (não perguntar de novo)
- Sem apostas com dinheiro real — só pontos virtuais
- Sem live ao vivo no MVP
- Tom de conteúdo: português BR, direto, sem clichê corporativo
- Jogos com sensação de aposta/emoção usam só pontos virtuais (roleta, caixa misteriosa, bolão)
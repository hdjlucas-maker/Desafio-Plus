# 🎯 Desafio+ — Guia Completo de Deploy no Cloudflare

> Rede social de desafios reais com jogos, gamificação e conexão humana.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configurar Cloudflare D1 (Banco SQL)](#1-cloudflare-d1)
3. [Configurar Cloudflare R2 (Storage)](#2-cloudflare-r2)
4. [Configurar Google OAuth](#3-google-oauth)
5. [Deploy do Backend (Workers)](#4-backend-cloudflare-workers)
6. [Deploy do Frontend (Pages)](#5-frontend-cloudflare-pages)
7. [Configurar Domínio Customizado](#6-domínio-customizado)
8. [Testar tudo](#7-testar)
9. [Desenvolvimento Local](#desenvolvimento-local)

---

## Pré-requisitos

```bash
# Node.js 18+
node --version  # v18.x ou superior

# Instalar Wrangler (CLI do Cloudflare)
npm install -g wrangler

# Fazer login no Cloudflare
wrangler login
```

---

## 1. Cloudflare D1

O D1 é o banco de dados SQL serverless do Cloudflare (SQLite compatível).

### Criar o banco

```bash
# Criar o banco D1
wrangler d1 create desafio-plus-db

# Anote o database_id retornado e cole no wrangler.toml:
# [[d1_databases]]
# database_id = "SEU_ID_AQUI"
```

### Aplicar o schema

```bash
# Aplicar em produção
wrangler d1 execute desafio-plus-db --file=./backend/schema.sql

# Aplicar localmente (desenvolvimento)
wrangler d1 execute desafio-plus-db --local --file=./backend/schema.sql
```

### Verificar

```bash
wrangler d1 execute desafio-plus-db --command="SELECT COUNT(*) FROM badges"
# Deve retornar 15 (badges padrão inseridos pelo schema)
```

---

## 2. Cloudflare R2

O R2 é o storage de objetos do Cloudflare (compatível com S3).

### Criar o bucket

```bash
# Criar bucket de produção
wrangler r2 bucket create desafio-plus-media

# Criar bucket de preview (desenvolvimento)
wrangler r2 bucket create desafio-plus-media-preview
```

### Configurar domínio público para o R2

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com)
2. Vá em **R2** → **desafio-plus-media** → **Settings**
3. Em **Custom Domains**, adicione `media.desafio-plus.com`
4. Atualize `R2_PUBLIC_URL` no `.env` com esse domínio

### Criar API Token do R2

1. Acesse **R2** → **Manage R2 API Tokens**
2. Clique em **Create API Token**
3. Permissões: **Object Read & Write** para o bucket `desafio-plus-media`
4. Copie `Access Key ID` e `Secret Access Key` para o `.env`

---

## 3. Google OAuth

### Criar projeto no Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto: **Desafio+**
3. Vá em **APIs & Services** → **Credentials**
4. Clique em **Create Credentials** → **OAuth 2.0 Client IDs**
5. Tipo: **Web application**
6. Configure:
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `https://desafio-plus.pages.dev`
     - `https://desafio-plus.com` (se tiver domínio)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/auth/google/callback`
     - `https://desafio-plus.pages.dev/auth/google/callback`
7. Copie **Client ID** e **Client Secret** para o `.env`

---

## 4. Backend — Cloudflare Workers

### Configurar secrets

```bash
# Configure cada secret individualmente:
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put OPENAI_API_KEY
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put R2_ENDPOINT
wrangler secret put SMTP_HOST
wrangler secret put SMTP_USER
wrangler secret put SMTP_PASS
```

### Instalar dependências

```bash
cd backend
npm install
```

### Testar localmente

```bash
# Na pasta raiz do projeto
wrangler dev --local

# A API estará em: http://localhost:8787
# Teste: curl http://localhost:8787/health
```

### Deploy em produção

```bash
# Na pasta raiz do projeto
wrangler deploy

# Ou com ambiente específico:
wrangler deploy --env production
```

### Verificar deploy

```bash
curl https://desafio-plus-api.SEU_SUBDOMINIO.workers.dev/health
# Deve retornar: {"status":"ok","app":"Desafio+","version":"1.0.0"}
```

---

## 5. Frontend — Cloudflare Pages

### Instalar dependências

```bash
cd frontend
npm install
```

### Configurar variáveis de ambiente no Pages

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com)
2. Vá em **Pages** → **Create a project** → **Connect to Git**
3. Conecte seu repositório GitHub
4. Configure:
   - **Build command:** `npm run build`
   - **Build output directory:** `build`
   - **Root directory:** `frontend`
5. Em **Environment variables**, adicione:
   ```
   REACT_APP_API_URL = https://desafio-plus-api.SEU_SUBDOMINIO.workers.dev/api
   REACT_APP_GOOGLE_CLIENT_ID = seu_google_client_id
   ```

### Deploy manual (sem Git)

```bash
cd frontend

# Build
npm run build

# Deploy no Pages
wrangler pages deploy build --project-name=desafio-plus
```

### Verificar

Acesse: `https://desafio-plus.pages.dev`

---

## 6. Domínio Customizado

### Para o Frontend (Pages)

1. No Cloudflare Pages → **Custom domains**
2. Adicione `desafio-plus.com` e `www.desafio-plus.com`
3. Configure os registros DNS conforme instruído

### Para o Backend (Workers)

1. No `wrangler.toml`, descomente e configure:
   ```toml
   [[routes]]
   pattern = "api.desafio-plus.com/*"
   zone_name = "desafio-plus.com"
   ```
2. Execute: `wrangler deploy`

### Atualizar CORS

No `wrangler.toml`, atualize:
```toml
[vars]
FRONTEND_URL = "https://desafio-plus.com"
```

---

## 7. Testar

### Checklist de verificação

```bash
# 1. Health check da API
curl https://api.desafio-plus.com/health

# 2. Criar conta
curl -X POST https://api.desafio-plus.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","password":"senha123","username":"teste","display_name":"Usuário Teste"}'

# 3. Login
curl -X POST https://api.desafio-plus.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","password":"senha123"}'

# 4. Buscar desafios diários (com token)
curl https://api.desafio-plus.com/api/challenges/daily \
  -H "Authorization: Bearer SEU_TOKEN"

# 5. Verificar banco
wrangler d1 execute desafio-plus-db --command="SELECT COUNT(*) FROM users"
```

### Endpoints principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Login com Google |
| GET | `/api/auth/me` | Perfil atual |
| GET | `/api/feed` | Feed principal |
| GET | `/api/feed/explore` | Feed explorar |
| POST | `/api/posts` | Criar post |
| POST | `/api/posts/:id/like` | Curtir post |
| GET | `/api/challenges/daily` | Desafios do dia |
| POST | `/api/challenges/complete` | Completar desafio |
| POST | `/api/challenges/ai-generate` | Gerar com IA |
| POST | `/api/games/session` | Registrar partida |
| GET | `/api/chat` | Listar conversas |
| GET | `/api/notifications` | Notificações |
| GET | `/api/search?q=termo` | Buscar |

---

## Desenvolvimento Local

### Setup completo

```bash
# 1. Clone o projeto
git clone https://github.com/seu-usuario/desafio-plus.git
cd desafio-plus

# 2. Copiar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves

# 3. Instalar dependências do backend
cd backend && npm install && cd ..

# 4. Instalar dependências do frontend
cd frontend && npm install && cd ..

# 5. Criar banco local e aplicar schema
wrangler d1 execute desafio-plus-db --local --file=./backend/schema.sql

# 6. Iniciar backend (porta 8787)
wrangler dev --local

# 7. Em outro terminal, iniciar frontend (porta 3000)
cd frontend && npm start
```

### Estrutura do projeto

```
desafio-plus/
├── frontend/               # React App (Cloudflare Pages)
│   ├── public/
│   │   ├── index.html      # HTML base
│   │   ├── manifest.json   # PWA manifest
│   │   └── sw.js           # Service Worker
│   ├── src/
│   │   ├── components/     # Navbar, PostCard, etc.
│   │   ├── pages/          # Feed, Profile, Chat, Games, etc.
│   │   ├── services/       # api.js (axios)
│   │   ├── context/        # AuthContext
│   │   ├── hooks/          # useFeed, useNotifications, etc.
│   │   ├── styles/         # global.css
│   │   ├── App.js          # Roteamento
│   │   └── index.js        # Entry point
│   └── package.json
├── backend/                # Node.js + Express (Cloudflare Workers)
│   ├── routes/             # auth, users, posts, feed, etc.
│   ├── controllers/        # Lógica de negócio
│   ├── middleware/         # auth JWT, rate-limit, sanitize
│   ├── models/             # Queries SQL
│   ├── config/             # db.js, r2.js, openai.js
│   ├── schema.sql          # Criação das tabelas + seeds
│   ├── server.js           # Entry point
│   └── package.json
├── wrangler.toml           # Config Cloudflare Workers
├── .env.example            # Variáveis necessárias
└── README.md               # Este arquivo
```

---

## 🔒 Segurança em Produção

- ✅ Senhas com bcrypt (salt rounds: 12)
- ✅ JWT com refresh token rotation
- ✅ Rate limiting em todas as rotas
- ✅ Sanitização de inputs (XSS prevention)
- ✅ CORS configurado por origem
- ✅ Helmet.js para headers de segurança
- ✅ Moderação de conteúdo via OpenAI
- ✅ Sistema de denúncias e bloqueios

## 📱 PWA (Android)

O app funciona como PWA no Android:
1. Acesse o site no Chrome
2. Toque em **"Adicionar à tela inicial"**
3. O app abre em tela cheia como um app nativo

## 💰 Custos Estimados (Cloudflare)

| Serviço | Plano Gratuito | Limite |
|---------|---------------|--------|
| Workers | Free | 100k req/dia |
| D1 | Free | 5GB storage, 25M leituras/mês |
| R2 | Free | 10GB storage, 1M operações/mês |
| Pages | Free | Ilimitado |

**Para a maioria dos projetos iniciais, o plano gratuito é suficiente!**

---

## 🆘 Suporte

- Documentação Cloudflare Workers: https://developers.cloudflare.com/workers/
- Documentação D1: https://developers.cloudflare.com/d1/
- Documentação R2: https://developers.cloudflare.com/r2/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/

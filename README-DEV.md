# 🚀 Desafio+ — Guia de Desenvolvimento Local (Windows)

> **Para iniciantes** — siga passo a passo, sem pular etapas.

---

## ❌ O Problema que Aconteceu

Você rodou `wrangler dev --local` dentro da pasta `backend/` e recebeu este erro:

```
X [ERROR] Unexpected external import of "assert", "crypto", "fs", "http"...
Your worker has no default export...
```

**Por quê?** O Wrangler tenta compilar seu código como um **Cloudflare Worker** (um ambiente especial na nuvem), mas o `server.js` foi escrito como um app **Node.js tradicional** com Express. Os dois ambientes são diferentes:

| Node.js tradicional | Cloudflare Worker |
|---|---|
| Usa `require()` | Usa `import` (ES Module) |
| Tem `app.listen(porta)` | Usa `export default { fetch }` |
| Acessa `fs`, `http`, etc. | Não tem acesso direto a esses módulos |

---

## ✅ A Solução (3 arquivos corrigidos)

Você recebeu 4 arquivos corrigidos. Veja o que cada um faz:

| Arquivo | Onde colocar | O que faz |
|---|---|---|
| `wrangler.toml` | `D:\desafio-plus\` (raiz) | Aponta para o adapter, não para server.js |
| `worker-adapter.js` | `D:\desafio-plus\backend\` | Ponte entre o Worker e o Express |
| `server.js` | `D:\desafio-plus\backend\` | Versão corrigida (funciona nos dois ambientes) |
| `package.json` | `D:\desafio-plus\backend\` | Adiciona a dependência `@whatwg-node/server` |

---

## 📋 Passo a Passo para Aplicar a Correção

### Passo 1 — Faça backup dos arquivos originais

Abra o **Explorador de Arquivos** e:

1. Vá até `D:\desafio-plus\`
2. Clique com botão direito em `wrangler.toml` → **Copiar**
3. Cole na mesma pasta → vai criar `wrangler - Cópia.toml` (backup feito ✓)
4. Vá até `D:\desafio-plus\backend\`
5. Faça o mesmo com `server.js` → cria `server - Cópia.js` (backup feito ✓)

### Passo 2 — Substitua os arquivos

1. Baixe os 4 arquivos corrigidos (links no final deste guia)
2. Copie `wrangler.toml` para `D:\desafio-plus\` (substituir o original)
3. Copie `worker-adapter.js` para `D:\desafio-plus\backend\` (arquivo novo)
4. Copie `server.js` para `D:\desafio-plus\backend\` (substituir o original)
5. Copie `package.json` para `D:\desafio-plus\backend\` (substituir o original)

### Passo 3 — Instale a nova dependência

Abra o **Prompt de Comando** (CMD):

```cmd
cd D:\desafio-plus\backend
npm install
```

Aguarde terminar. Você verá algo como `added 5 packages`.

---

## 🖥️ Como Rodar em Desenvolvimento Local (RECOMENDADO)

> **Esta é a forma mais simples e que funciona sem configurar nada do Cloudflare.**

### Opção A — Com nodemon (reinicia automático ao salvar arquivos)

```cmd
cd D:\desafio-plus\backend
npm run dev
```

Você verá:
```
🚀 Desafio+ API rodando em http://localhost:8787
   Ambiente: development
   Health:   http://localhost:8787/health
```

Abra o navegador em `http://localhost:8787/health` — deve aparecer:
```json
{ "status": "ok", "app": "Desafio+", "runtime": "node" }
```

### Opção B — Com Node.js puro (sem nodemon)

```cmd
cd D:\desafio-plus\backend
node server.js
```

### Opção C — Com Wrangler (simula o ambiente Cloudflare localmente)

> Use esta opção apenas quando quiser testar como vai funcionar na nuvem.

```cmd
cd D:\desafio-plus
wrangler dev --local
```

**Atenção:** Para esta opção funcionar, você precisa primeiro criar o banco D1:
```cmd
wrangler d1 create desafio-plus-db
```
E copiar o `database_id` gerado para o `wrangler.toml`.

---

## 🗄️ Configurar o Banco de Dados Local

O banco de dados local usa SQLite (arquivo no seu computador, sem precisar de internet).

### Criar as tabelas:

```cmd
cd D:\desafio-plus\backend
npm run db:init
```

Ou manualmente:
```cmd
wrangler d1 execute desafio-plus-db --local --file=..\schema.sql
```

---

## 🌐 Rodar o Frontend (React)

Abra **outro** CMD (deixe o backend rodando no primeiro):

```cmd
cd D:\desafio-plus\frontend
npm install
npm start
```

O React vai abrir automaticamente em `http://localhost:3000`.

---

## 📁 Estrutura Final dos Arquivos

Após aplicar a correção, sua pasta deve ficar assim:

```
D:\desafio-plus\
├── wrangler.toml          ← SUBSTITUÍDO (aponta para worker-adapter.js)
├── schema.sql
├── README.md
├── .env.example
│
├── backend\
│   ├── worker-adapter.js  ← NOVO (ponte Worker ↔ Express)
│   ├── server.js          ← SUBSTITUÍDO (funciona nos dois ambientes)
│   ├── package.json       ← SUBSTITUÍDO (nova dependência adicionada)
│   ├── middleware\
│   ├── models\
│   ├── routes\
│   ├── controllers\
│   └── config\
│
└── frontend\
    ├── src\
    └── public\
```

---

## ⚙️ Arquivo .env (variáveis de ambiente)

Crie um arquivo chamado `.env` dentro de `D:\desafio-plus\backend\`:

1. Abra o **Bloco de Notas**
2. Cole o conteúdo abaixo
3. Salve como `D:\desafio-plus\backend\.env`
   - No Bloco de Notas: **Arquivo → Salvar como**
   - Em "Tipo", escolha **Todos os arquivos (\*.\*)**
   - Digite o nome: `.env` (com o ponto na frente)

```env
# Ambiente
NODE_ENV=development
PORT=8787

# JWT (coloque qualquer texto longo e aleatório aqui)
JWT_SECRET=minha-chave-secreta-super-longa-123456789
JWT_REFRESH_SECRET=outra-chave-secreta-diferente-987654321

# Frontend
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Google OAuth (opcional por enquanto — deixe em branco)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OpenAI (opcional por enquanto — deixe em branco)
OPENAI_API_KEY=

# Email (opcional por enquanto — deixe em branco)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```

---

## ❓ Perguntas Frequentes

### "Apareceu erro: 'nodemon' não é reconhecido"

Instale o nodemon globalmente:
```cmd
npm install -g nodemon
```

### "Apareceu erro: 'node' não é reconhecido"

Você precisa instalar o Node.js:
1. Acesse https://nodejs.org
2. Baixe a versão **LTS** (recomendada)
3. Instale e reinicie o CMD

### "Apareceu erro: Cannot find module './middleware/rateLimiter'"

Significa que os outros arquivos do projeto estão faltando. Certifique-se de que toda a pasta `backend/` do projeto original está presente.

### "O frontend não consegue falar com o backend"

Verifique se:
1. O backend está rodando (`http://localhost:8787/health` abre no navegador)
2. O arquivo `.env` do frontend tem `REACT_APP_API_URL=http://localhost:8787`

### "Quero usar o Wrangler mas aparece erro de database_id"

Execute:
```cmd
wrangler d1 create desafio-plus-db
```
Copie o `database_id` que aparecer e cole no `wrangler.toml` no lugar de `YOUR_D1_DATABASE_ID`.

---

## 🚀 Quando Estiver Pronto para Deploy na Nuvem

Quando o projeto estiver funcionando localmente e você quiser publicar:

```cmd
# 1. Faça login no Cloudflare
wrangler login

# 2. Crie o banco D1 na nuvem
wrangler d1 create desafio-plus-db
# Copie o database_id para o wrangler.toml

# 3. Inicialize o banco com as tabelas
npm run db:init:prod

# 4. Configure os secrets (senhas e chaves)
wrangler secret put JWT_SECRET
wrangler secret put JWT_REFRESH_SECRET

# 5. Faça o deploy
npm run deploy
```

---

## 📞 Resumo Rápido

**Para desenvolvimento local (mais simples):**
```cmd
cd D:\desafio-plus\backend
npm install
npm run dev
```

**Para simular o Cloudflare localmente:**
```cmd
cd D:\desafio-plus
wrangler dev --local
```

**Para publicar na nuvem:**
```cmd
cd D:\desafio-plus\backend
npm run deploy
```

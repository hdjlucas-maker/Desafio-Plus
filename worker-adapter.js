/**
 * Desafio+ — Cloudflare Worker Adapter
 * ======================================
 * Este arquivo é o PONTO DE ENTRADA para o Cloudflare Workers.
 *
 * O problema: o Cloudflare Workers não aceita app.listen() do Express.
 * A solução: usamos a biblioteca "@hono/node-server" ou o pacote
 * "@whatwg-node/server" para adaptar o Express ao formato fetch() do Worker.
 *
 * Este adapter:
 *   1. Importa o app Express do server.js (sem o app.listen)
 *   2. Converte cada Request do Worker em req/res do Express
 *   3. Exporta o handler no formato ES Module que o Wrangler exige
 *
 * ARQUIVO: backend/worker-adapter.js
 * Coloque este arquivo DENTRO da pasta backend/
 */

import { createServerAdapter } from '@whatwg-node/server';

// Importa o app Express (server.js não deve chamar app.listen quando
// a variável de ambiente CF_WORKER estiver definida)
import app from './server.js';

// Cria o adapter que converte Request Web → Express req/res
const adapter = createServerAdapter(app);

// ── Export padrão ES Module (obrigatório para Cloudflare Workers) ──
export default {
  /**
   * fetch() é chamado pelo Cloudflare a cada requisição HTTP.
   * Recebe um Request padrão da Web API e retorna um Response.
   */
  async fetch(request, env, ctx) {
    // Injeta as variáveis de ambiente do Cloudflare (D1, R2, KV, secrets)
    // no process.env para que o código Express as encontre normalmente
    if (env) {
      // Bindings do Cloudflare ficam disponíveis via globalThis
      globalThis.__CF_ENV__ = env;

      // Variáveis de texto do [vars] no wrangler.toml
      if (env.NODE_ENV)      process.env.NODE_ENV      = env.NODE_ENV;
      if (env.APP_NAME)      process.env.APP_NAME      = env.APP_NAME;
      if (env.FRONTEND_URL)  process.env.FRONTEND_URL  = env.FRONTEND_URL;

      // Secrets (configurados via "wrangler secret put")
      if (env.JWT_SECRET)           process.env.JWT_SECRET           = env.JWT_SECRET;
      if (env.JWT_REFRESH_SECRET)   process.env.JWT_REFRESH_SECRET   = env.JWT_REFRESH_SECRET;
      if (env.GOOGLE_CLIENT_ID)     process.env.GOOGLE_CLIENT_ID     = env.GOOGLE_CLIENT_ID;
      if (env.GOOGLE_CLIENT_SECRET) process.env.GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
      if (env.OPENAI_API_KEY)       process.env.OPENAI_API_KEY       = env.OPENAI_API_KEY;
      if (env.SMTP_HOST)            process.env.SMTP_HOST            = env.SMTP_HOST;
      if (env.SMTP_USER)            process.env.SMTP_USER            = env.SMTP_USER;
      if (env.SMTP_PASS)            process.env.SMTP_PASS            = env.SMTP_PASS;
    }

    // Passa a requisição para o Express via adapter
    return adapter.fetch(request, env, ctx);
  },
};

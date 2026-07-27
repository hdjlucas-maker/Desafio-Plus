/**
 * DEPRECATED — substituído por worker.js (Hono)
 * Mantido apenas para referência. O wrangler.toml aponta para worker.js.
 */
import { createServerAdapter } from '@whatwg-node/server';
import app from './server.js';

const adapter = createServerAdapter(app);

export default {
  async fetch(request, env, ctx) {
    if (env) {
      globalThis.__CF_ENV__ = env;
      if (env.APP_NAME) globalThis.__APP_NAME = env.APP_NAME;
      if (env.FRONTEND_URL) globalThis.__FRONTEND_URL = env.FRONTEND_URL;
      if (env.JWT_SECRET) globalThis.__JWT_SECRET = env.JWT_SECRET;
    }
    return adapter.fetch(request, env, ctx);
  },
};

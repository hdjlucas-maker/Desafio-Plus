/**
 * Desafio+ — Auth Controller (VERSÃO LOCAL — better-sqlite3)
 *
 * Compatível com:
 *   - better-sqlite3 (NÃO Cloudflare D1)
 *   - JWT_SECRET fixo via .env (process.env.JWT_SECRET)
 *   - bcryptjs para hash de senha
 *
 * Funções exportadas (todas usadas em routes/auth.js):
 *   register, login, googleAuth, refreshToken, logout,
 *   forgotPassword, resetPassword, me
 */

require('dotenv').config();

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userModel = require('../models/userModel');
const { query, queryOne, run } = require('../config/db');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../middleware/auth');

// Google OAuth — opcional: só funciona se GOOGLE_CLIENT_ID estiver no .env
let googleClient = null;
try {
  const { OAuth2Client } = require('google-auth-library');
  if (process.env.GOOGLE_CLIENT_ID) {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
} catch {
  // google-auth-library não instalado — Google OAuth desabilitado
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateUsername(base) {
  const clean = base.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
  return `${clean}${Math.floor(Math.random() * 9999)}`;
}

function tokenResponse(user) {
  const access  = generateAccessToken(user.id);
  const refresh = generateRefreshToken(user.id);
  // Nunca retorna password_hash
  const { password_hash, ...safeUser } = user;
  return { access_token: access, refresh_token: refresh, user: safeUser };
}

/**
 * Notifica TODOS os usuários existentes que um novo membro entrou.
 * Assíncrono — não bloqueia o cadastro se falhar.
 */
async function notifyAllUsersNewMember(newUser) {
  try {
    const allUsers = await query(
      'SELECT id FROM users WHERE id != ? AND is_banned = 0',
      [newUser.id]
    );
    if (!allUsers || allUsers.length === 0) return;

    const message = `🎉 ${newUser.display_name} (@${newUser.username}) acabou de entrar no Desafio+! Dê as boas-vindas!`;
    for (const u of allUsers) {
      const id = crypto.randomUUID();
      await run(
        `INSERT INTO notifications (id, user_id, type, actor_id, message, is_read, created_at)
         VALUES (?, ?, 'new_member', ?, ?, 0, datetime('now'))`,
        [id, u.id, newUser.id, message]
      ).catch(() => {}); // ignora erros individuais
    }
    console.log(`[Auth] Notificação de novo membro enviada para ${allUsers.length} usuários.`);
  } catch (err) {
    console.error('[Auth] Erro ao enviar notificação de novo membro:', err.message);
  }
}

// ── Cadastro ──────────────────────────────────────────────────────────────────

async function register(req, res) {
  try {
    const { email, password, username, display_name } = req.body;

    // Validação
    if (!email || !password || !username || !display_name) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 8 caracteres' });
    }
    if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
      return res.status(400).json({ error: 'Username inválido (3-20 chars, letras/números/._)' });
    }

    // Verifica duplicatas
    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) return res.status(409).json({ error: 'E-mail já cadastrado' });

    const existingUser = await userModel.findByUsername(username);
    if (existingUser) return res.status(409).json({ error: 'Username já em uso' });

    // Cria usuário
    const password_hash = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();
    const user = await userModel.create({ id, email, username, display_name, password_hash });

    // Salva refresh token
    const tokens = tokenResponse(user);
    const rtId = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await run(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [rtId, user.id, tokens.refresh_token, expires]
    );

    // Notifica todos os usuários existentes (assíncrono, não bloqueia)
    notifyAllUsersNewMember(user);

    res.status(201).json(tokens);
  } catch (err) {
    console.error('[AUTH] register:', err);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    const user = await userModel.findByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    if (user.is_banned) {
      return res.status(403).json({ error: 'Conta suspensa. Entre em contato com o suporte.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

    const tokens = tokenResponse(user);
    const rtId = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await run(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [rtId, user.id, tokens.refresh_token, expires]
    );

    await run("UPDATE users SET last_active = datetime('now') WHERE id = ?", [user.id]);

    res.json(tokens);
  } catch (err) {
    console.error('[AUTH] login:', err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
}

// ── Google OAuth ──────────────────────────────────────────────────────────────

async function googleAuth(req, res) {
  try {
    if (!googleClient) {
      return res.status(501).json({ error: 'Login com Google não configurado neste servidor.' });
    }

    const { id_token } = req.body;
    if (!id_token) return res.status(400).json({ error: 'Token Google necessário' });

    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let isNew = false;
    let user = await userModel.findByGoogleId(googleId);

    if (!user) {
      user = await userModel.findByEmail(email);
      if (user) {
        await run('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
      } else {
        const id = crypto.randomUUID();
        const username = generateUsername(name || email.split('@')[0]);
        user = await userModel.create({
          id, email, username,
          display_name: name || username,
          google_id: googleId,
          avatar_url: picture || null,
        });
        isNew = true;
      }
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Conta suspensa.' });
    }

    const tokens = tokenResponse(user);
    const rtId = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await run(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [rtId, user.id, tokens.refresh_token, expires]
    );

    if (isNew) notifyAllUsersNewMember(user);

    res.json(tokens);
  } catch (err) {
    console.error('[AUTH] google:', err);
    res.status(401).json({ error: 'Falha na autenticação com Google' });
  }
}

// ── Refresh Token ─────────────────────────────────────────────────────────────

async function refreshToken(req, res) {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token necessário' });

    const payload = verifyRefreshToken(refresh_token);
    const stored = await queryOne(
      'SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0 AND expires_at > datetime("now")',
      [refresh_token]
    );
    if (!stored) return res.status(401).json({ error: 'Refresh token inválido ou expirado' });

    // Rotaciona o token
    await run('UPDATE refresh_tokens SET revoked = 1 WHERE token = ?', [refresh_token]);

    const user = await userModel.findById(payload.userId);
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });

    const tokens = tokenResponse(user);
    const rtId = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await run(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [rtId, user.id, tokens.refresh_token, expires]
    );

    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────

async function logout(req, res) {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      await run('UPDATE refresh_tokens SET revoked = 1 WHERE token = ?', [refresh_token]);
    }
    res.json({ message: 'Logout realizado com sucesso' });
  } catch {
    res.json({ message: 'Logout realizado' });
  }
}

// ── Recuperação de Senha ──────────────────────────────────────────────────────

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await userModel.findByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h
      const id = crypto.randomUUID();
      await run(
        'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
        [id, user.id, token, expires]
      );
      // Em produção: enviar e-mail com link de reset
      console.log(`[AUTH] Reset token para ${email}: ${token}`);
    }
    // Sempre retorna 200 para não vazar se e-mail existe
    res.json({ message: 'Se o e-mail existir, você receberá as instruções em breve.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      return res.status(400).json({ error: 'Token e senha (mín. 8 chars) são obrigatórios' });
    }

    const record = await queryOne(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime("now")',
      [token]
    );
    if (!record) return res.status(400).json({ error: 'Token inválido ou expirado' });

    const hash = await bcrypt.hash(password, 12);
    await userModel.updatePassword(record.user_id, hash);
    await run('UPDATE password_reset_tokens SET used = 1 WHERE token = ?', [token]);
    await run('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?', [record.user_id]);

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
}

// ── Me ────────────────────────────────────────────────────────────────────────

async function me(req, res) {
  try {
    const user   = await userModel.findById(req.user.id);
    const stats  = await userModel.getStats(req.user.id);
    const badges = await userModel.getUserBadges(req.user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ ...safeUser, stats, badges });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  register,
  login,
  googleAuth,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  me,
};

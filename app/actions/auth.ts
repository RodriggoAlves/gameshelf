"use server";

import db from "../../lib/db";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { isRateLimited, RATE_LIMITS } from "../../lib/rateLimit";

const SESSION_COOKIE = "zerey_session";

// Helper para obter IP do request (para rate limiting)
async function getClientIP(): Promise<string> {
  const hdrs = await headers();
  return hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip') || 'unknown';
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 2 }).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const hashBuffer = Buffer.from(hash, "hex");
  
  try {
    // Current default N = 16384
    const verifyBuffer = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 2 });
    if (crypto.timingSafeEqual(hashBuffer, verifyBuffer)) return true;
  } catch {}
  
  try {
    // Older N = 32768
    const verifyBuffer32 = crypto.scryptSync(password, salt, 64, { N: 32768, r: 8, p: 2 });
    if (crypto.timingSafeEqual(hashBuffer, verifyBuffer32)) return true;
  } catch {}
  
  // Fallback: params padrão do Node para senhas antigas
  const verifyBufferLegacy = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hashBuffer, verifyBufferLegacy);
}

// VULN-10: Validar URLs de imagem para prevenir SSRF/XSS
function isValidImageUrl(url: string): boolean {
  if (!url || url.trim() === '') return true; // Permite limpar a URL
  if (url.startsWith('/avatars/')) return true; // Preset avatars locais
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    // Bloquear IPs locais (SSRF)
    const hostname = parsed.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) return false;
    return true;
  } catch {
    return false;
  }
}

export async function register(username: string, email: string, password: string) {
  // Rate Limiting: 3 registros por hora por IP
  const ip = await getClientIP();
  if (isRateLimited(`register:${ip}`, RATE_LIMITS.REGISTER.limit, RATE_LIMITS.REGISTER.windowMs)) {
    return { error: "Muitas tentativas. Tente novamente mais tarde." };
  }

  if (!username || !email || !password || username.length < 3 || password.length < 8) {
    return { error: "Preencha todos os campos corretamente (senha mín. 8 caracteres)." };
  }

  // Validação de força de senha
  if (!/[A-Z]/.test(password)) return { error: "A senha deve conter ao menos uma letra maiúscula." };
  if (!/[a-z]/.test(password)) return { error: "A senha deve conter ao menos uma letra minúscula." };
  if (!/[0-9]/.test(password)) return { error: "A senha deve conter ao menos um número." };

  const existing = db.prepare("SELECT id FROM User WHERE username = ? OR email = ?").get(username, email);
  if (existing) {
    return { error: "Nome de usuário ou e-mail já está em uso." };
  }

  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  
  // Check if this is the very first user
  const userCount = db.prepare("SELECT COUNT(*) as count FROM User").get() as { count: number };
  
  try {
    db.exec("BEGIN TRANSACTION");
    
    db.prepare("INSERT INTO User (id, username, email, passwordHash) VALUES (?, ?, ?, ?)").run(userId, username, email, passwordHash);
    
    // If it's the first user, migrate the legacy data
    if (userCount.count === 0) {
      const oldId = 'default-user-id';
      db.prepare("UPDATE UserGame SET userId = ? WHERE userId = ?").run(userId, oldId);
      db.prepare("UPDATE Tag SET userId = ? WHERE userId = ?").run(userId, oldId);
      db.prepare("UPDATE GameTag SET userId = ? WHERE userId = ?").run(userId, oldId);
      db.prepare("UPDATE TimelineEvent SET userId = ? WHERE userId = ?").run(userId, oldId);
      db.prepare("UPDATE PlaySession SET userId = ? WHERE userId = ?").run(userId, oldId);
    }
    
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    console.error(err);
    return { error: "Erro ao criar usuário." };
  }

  // Instead of creating session immediately, generate verification token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  db.prepare("INSERT INTO AccountVerification (id, userId, expiresAt) VALUES (?, ?, ?)").run(token, userId, expiresAt);

  // Send verification email asynchronously
  try {
    // Configuração do transporter (Nodemailer)
    // VULN-16 WARNING: Para produção, configure um domínio próprio e registros DNS (SPF, DKIM, DMARC)
    // para evitar que os e-mails caiam na caixa de spam ou sejam marcados como spoofing.
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const verifyUrl = `${siteUrl}/verify?token=${token}`;
    
    const mailOptions = {
      from: '"Zerey (Beta)" <suporte.zerey@gmail.com>',
      to: email,
      subject: "Ative sua conta no Zerey",
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d12; color: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #222;">
  <div style="text-align: center; margin-bottom: 35px;">
    <h1 style="color: #2ecc71; margin: 0; font-size: 36px; letter-spacing: -1.5px; font-weight: 900;">ZEREY</h1>
    <p style="color: #888; font-size: 13px; margin-top: 5px; text-transform: uppercase; letter-spacing: 3px;">Gaming Library Platform</p>
  </div>
  
  <div style="background-color: #16161f; padding: 35px; border-radius: 16px; border: 1px solid rgba(46, 204, 113, 0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <h2 style="margin-top: 0; color: #fff; font-size: 22px;">Olá, ${username}!</h2>
    <p style="color: #d0d0d0; line-height: 1.7; font-size: 16px;">
      Bem-vindo(a) à plataforma <strong>Zerey</strong>. Para garantir a segurança da sua conta e concluir seu cadastro, precisamos que você verifique seu e-mail.
    </p>
    
    <div style="text-align: center; margin-top: 45px; margin-bottom: 25px;">
      <a href="${verifyUrl}" style="background-color: #2ecc71; color: #000; padding: 16px 36px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 16px; display: inline-block;">Verificar meu E-mail</a>
    </div>
    <p style="color: #888; font-size: 13px; text-align: center; margin-top: 20px;">
      Este link expirará em 24 horas.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 40px; border-top: 1px solid #222; padding-top: 25px;">
    <p style="color: #666; font-size: 13px; margin: 4px 0;">© ${new Date().getFullYear()} Zerey Platform. Todos os direitos reservados.</p>
  </div>
</div>
      `
    };

    transporter.sendMail(mailOptions).catch(console.error);
  } catch (err) {
    console.error("Erro ao preparar e-mail de verificação:", err);
  }

  return { success: true, requireVerification: true };
}

export async function login(usernameOrEmail: string, password: string) {
  // Rate Limiting: 5 tentativas por minuto por IP
  const ip = await getClientIP();
  if (isRateLimited(`login:${ip}`, RATE_LIMITS.LOGIN.limit, RATE_LIMITS.LOGIN.windowMs)) {
    return { error: "Muitas tentativas de login. Aguarde 1 minuto." };
  }

  const user = db.prepare("SELECT * FROM User WHERE username = ? OR email = ?").get(usernameOrEmail, usernameOrEmail) as any;
  
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Credenciais inválidas." };
  }

  if (user.isVerified === 0) {
    return { error: "Por favor, verifique seu e-mail antes de fazer o login.", unverified: true };
  }

  await createSession(user.id);
  return { success: true };
}

export async function verifyAccount(token: string) {
  if (!token) return { error: "Token não fornecido." };

  // VULN-11: Consumir token atomicamente — DELETE RETURNING previne race condition
  const record = db.prepare("DELETE FROM AccountVerification WHERE id = ? RETURNING *").get(token) as any;
  if (!record) {
    return { error: "Link de verificação inválido ou já utilizado." };
  }

  if (new Date(record.expiresAt) < new Date()) {
    return { error: "Este link expirou. Por favor, solicite um novo." };
  }

  try {
    db.prepare("UPDATE User SET isVerified = 1 WHERE id = ?").run(record.userId);
    
    // Automatically log the user in after verification
    await createSession(record.userId);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Erro ao verificar conta." };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    db.prepare("DELETE FROM Session WHERE id = ?").run(sessionId);
  }
  cookieStore.delete(SESSION_COOKIE);
}

async function createSession(userId: string) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  // Expira em 7 dias (reduzido de 30 para mitigar session hijacking)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  db.prepare("INSERT INTO Session (id, userId, expiresAt) VALUES (?, ?, ?)").run(sessionId, userId, expiresAt);
  
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export async function getUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  // VULN-26: Limpeza de sessões expiradas (10% de chance a cada request para não impactar performance)
  if (Math.random() < 0.1) {
    db.prepare("DELETE FROM Session WHERE expiresAt < datetime('now')").run();
    db.prepare("DELETE FROM PasswordReset WHERE expiresAt < datetime('now')").run();
    db.prepare("DELETE FROM AccountVerification WHERE expiresAt < datetime('now')").run();
  }

  const session = db.prepare("SELECT * FROM Session WHERE id = ?").get(sessionId) as any;
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    db.prepare("DELETE FROM Session WHERE id = ?").run(sessionId);
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  const user = db.prepare("SELECT id, username, avatarUrl, coverUrl FROM User WHERE id = ?").get(session.userId) as any;
  return user || null;
}

export async function updateUserProfile(data: { avatarUrl?: string; coverUrl?: string }) {
  const user = await getUser();
  if (!user) return { error: "Não autenticado" };

  // VULN-10: Validar URLs para prevenir SSRF e XSS
  if (data.avatarUrl !== undefined) {
    if (!isValidImageUrl(data.avatarUrl)) {
      return { error: "URL de avatar inválida. Use apenas URLs HTTPS de imagens." };
    }
    db.prepare("UPDATE User SET avatarUrl = ? WHERE id = ?").run(data.avatarUrl, user.id);
  }
  if (data.coverUrl !== undefined) {
    if (!isValidImageUrl(data.coverUrl)) {
      return { error: "URL de capa inválida. Use apenas URLs HTTPS de imagens." };
    }
    db.prepare("UPDATE User SET coverUrl = ? WHERE id = ?").run(data.coverUrl, user.id);
  }
  return { success: true };
}

export async function requestPasswordReset(email: string) {
  if (!email) return { error: "E-mail obrigatório." };

  // Rate Limiting: 3 pedidos por hora por email
  if (isRateLimited(`forgot:${email}`, RATE_LIMITS.FORGOT_PASSWORD.limit, RATE_LIMITS.FORGOT_PASSWORD.windowMs)) {
    return { error: "Muitas solicitações. Tente novamente mais tarde." };
  }
  
  const user = db.prepare("SELECT * FROM User WHERE email = ?").get(email) as any;
  if (!user) {
    // Para evitar User Enumeration, retornamos sucesso mesmo se o e-mail não existir.
    return { success: true };
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos
  
  db.prepare("INSERT INTO PasswordReset (id, userId, expiresAt) VALUES (?, ?, ?)").run(token, user.id, expiresAt);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const mailOptions = {
    from: '"Zerey (Beta)" <suporte.zerey@gmail.com>',
    to: email,
    subject: "Redefinição de Senha - Zerey",
    html: `
      <h2>Recuperação de Senha</h2>
      <p>Você solicitou a redefinição da sua senha no Zerey.</p>
      <p>Clique no link abaixo para criar uma nova senha. Este link expira em 15 minutos.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#2ecc71;color:black;text-decoration:none;border-radius:8px;font-weight:bold;">Redefinir Senha</a>
      <p>Se você não solicitou, ignore este e-mail.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    return { error: "Falha ao enviar e-mail. Configure EMAIL_USER e EMAIL_PASS no arquivo .env" };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  // Rate Limiting: 5 tentativas por 15 minutos por token
  if (isRateLimited(`reset:${token}`, RATE_LIMITS.RESET_PASSWORD.limit, RATE_LIMITS.RESET_PASSWORD.windowMs)) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  if (!token || !newPassword || newPassword.length < 8) {
    return { error: "Senha muito curta (mín. 8 caracteres)." };
  }

  // Validação de força de senha
  if (!/[A-Z]/.test(newPassword)) return { error: "A senha deve conter ao menos uma letra maiúscula." };
  if (!/[a-z]/.test(newPassword)) return { error: "A senha deve conter ao menos uma letra minúscula." };
  if (!/[0-9]/.test(newPassword)) return { error: "A senha deve conter ao menos um número." };

  // VULN-11: Consumir token atomicamente
  const resetRecord = db.prepare("DELETE FROM PasswordReset WHERE id = ? RETURNING *").get(token) as any;
  if (!resetRecord) {
    return { error: "Link inválido ou já utilizado." };
  }

  if (new Date(resetRecord.expiresAt) < new Date()) {
    return { error: "Este link expirou. Solicite um novo." };
  }

  const passwordHash = hashPassword(newPassword);
  
  try {
    db.exec("BEGIN TRANSACTION");
    db.prepare("UPDATE User SET passwordHash = ? WHERE id = ?").run(passwordHash, resetRecord.userId);
    // VULN-07: Invalidar TODAS as sessões do usuário ao trocar a senha
    db.prepare("DELETE FROM Session WHERE userId = ?").run(resetRecord.userId);
    db.exec("COMMIT");
    return { success: true };
  } catch (err) {
    db.exec("ROLLBACK");
    console.error(err);
    return { error: "Erro ao atualizar a senha." };
  }
}

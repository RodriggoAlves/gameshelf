"use server";

import db from "../../lib/db";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { Configuration, AccountApi, SendApi } from "hostinger-mail-api-sdk";
import { isRateLimited, RATE_LIMITS } from "../../lib/rateLimit";

// Escape HTML para prevenir XSS em templates de e-mail
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

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

// Allowlist de domínios para URLs de imagem (previne SSRF/XSS)
const ALLOWED_IMAGE_DOMAINS = [
  'images.igdb.com',
  'images.unsplash.com',
  'api.dicebear.com',
  'i.imgur.com',
];

function isValidImageUrl(url: string): boolean {
  if (!url || url.trim() === '') return true; // Permite limpar a URL
  if (url.startsWith('/avatars/')) return true; // Preset avatars locais
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false; // Somente HTTPS
    return ALLOWED_IMAGE_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

// Helper para envio de email via Hostinger API
async function sendHostingerEmail(to: string, subject: string, htmlContent: string) {
  try {
    const config = new Configuration({
      accessToken: process.env.HOSTINGER_API_KEY
    });
    
    // Pega o ID da caixa de e-mail autorizada (suporte@zerey.com.br)
    const accountApi = new AccountApi(config);
    const accountRes = await accountApi.getCurrentAccount();
    const mailboxes = accountRes.data?.data?.mailboxes || [];
    
    if (mailboxes.length === 0) {
      throw new Error("Nenhuma caixa de e-mail encontrada para este token na Hostinger.");
    }
    
    // Procura pela caixa específica ou usa a primeira disponível
    const fromEmail = process.env.EMAIL_FROM || "suporte@zerey.com.br";
    const mailbox = mailboxes.find((m: any) => m.address === fromEmail) || mailboxes[0];
    
    const sendApi = new SendApi(config);
    await sendApi.sendEmail(mailbox.resourceId, {
      to: [to],
      displayName: "Zerey Suporte",
      subject: subject,
      html: htmlContent
    } as any);
    
    console.log(`Email enviado com sucesso via Hostinger para: ${to}`);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email pela API da Hostinger:", error);
    throw error;
  }
}

export async function register(username: string, email: string, password: string) {
  // Rate Limiting: 3 registros por hora por IP
  const ip = await getClientIP();
  if (isRateLimited(`register:${ip}`, RATE_LIMITS.REGISTER.limit, RATE_LIMITS.REGISTER.windowMs)) {
    return { error: "Muitas tentativas. Tente novamente mais tarde." };
  }

  if (!username || !email || !password || username.length < 3 || username.length > 30 || password.length < 8) {
    return { error: "Preencha todos os campos corretamente (senha mín. 8 caracteres, username 3-30 caracteres)." };
  }

  // Validar formato do e-mail no servidor
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Formato de e-mail inválido." };
  }

  // Sanitizar username: apenas alfanumérico, _, -
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { error: "Username deve conter apenas letras, números, _ ou -." };
  }

  // Validação de força de senha
  if (!/[A-Z]/.test(password)) return { error: "A senha deve conter ao menos uma letra maiúscula." };
  if (!/[a-z]/.test(password)) return { error: "A senha deve conter ao menos uma letra minúscula." };
  if (!/[0-9]/.test(password)) return { error: "A senha deve conter ao menos um número." };

  // Anti-enumeration: verificar username e email separadamente para dar feedback
  // mas usando mensagem genérica para não expor quais existem
  const existingUser = await db.get('SELECT id FROM "User" WHERE username = $1', [username]);
  const existingEmail = await db.get('SELECT id FROM "User" WHERE email = $1', [email]);
  if (existingUser || existingEmail) {
    // Mensagem genérica para prevenir enumeração de usuários
    return { error: "Não foi possível criar a conta. Verifique os dados informados ou tente outro username/e-mail." };
  }

  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  
  try {
    await db.run('INSERT INTO "User" (id, username, email, "passwordHash") VALUES ($1, $2, $3, $4)', [userId, username, email, passwordHash]);
  } catch (err) {
    console.error(err);
    return { error: "Erro ao criar usuário." };
  }

  // Instead of creating session immediately, generate verification token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  await db.run('INSERT INTO "AccountVerification" (id, "userId", "expiresAt") VALUES ($1, $2, $3)', [token, userId, expiresAt]);

  // Send verification email asynchronously
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const verifyUrl = `${siteUrl}/verify?token=${token}`;
    
    const htmlContent = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d12; color: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #222;">
  <div style="text-align: center; margin-bottom: 35px;">
    <h1 style="color: #00f0ff; margin: 0; font-size: 36px; letter-spacing: -1.5px; font-weight: 900;">ZEREY</h1>
    <p style="color: #888; font-size: 13px; margin-top: 5px; text-transform: uppercase; letter-spacing: 3px;">Gaming Library Platform</p>
  </div>
  
  <div style="background-color: #16161f; padding: 35px; border-radius: 16px; border: 1px solid rgba(0, 240, 255, 0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <h2 style="margin-top: 0; color: #fff; font-size: 22px;">Olá, ${escapeHtml(username)}!</h2>
    <p style="color: #d0d0d0; line-height: 1.7; font-size: 16px;">
      Bem-vindo(a) à plataforma <strong>Zerey</strong>. Para garantir a segurança da sua conta e concluir seu cadastro, precisamos que você verifique seu e-mail.
    </p>
    
    <div style="text-align: center; margin-top: 45px; margin-bottom: 25px;">
      <a href="${verifyUrl}" style="background-color: #00f0ff; color: #000; padding: 16px 36px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 16px; display: inline-block;">Verificar meu E-mail</a>
    </div>
    <p style="color: #888; font-size: 13px; text-align: center; margin-top: 20px;">
      Este link expirará em 24 horas.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 40px; border-top: 1px solid #222; padding-top: 25px;">
    <p style="color: #666; font-size: 13px; margin: 4px 0;">© ${new Date().getFullYear()} Zerey Platform. Todos os direitos reservados.</p>
  </div>
</div>
    `;

    await sendHostingerEmail(email, "Ative sua conta no Zerey", htmlContent);
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

  const user = await db.get('SELECT * FROM "User" WHERE username = $1 OR email = $2', [usernameOrEmail, usernameOrEmail]);
  
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
  const record = await db.get('DELETE FROM "AccountVerification" WHERE id = $1 RETURNING *', [token]);
  if (!record) {
    return { error: "Link de verificação inválido ou já utilizado." };
  }

  if (new Date(record.expiresAt) < new Date()) {
    return { error: "Este link expirou. Por favor, solicite um novo." };
  }

  try {
    await db.run('UPDATE "User" SET "isVerified" = 1 WHERE id = $1', [record.userId]);
    
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
    await db.run('DELETE FROM "Session" WHERE id = $1', [sessionId]);
  }
  cookieStore.delete(SESSION_COOKIE);
}

async function createSession(userId: string) {
  const sessionId = crypto.randomBytes(32).toString("hex");
  // Expira em 7 dias (reduzido de 30 para mitigar session hijacking)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  await db.run('INSERT INTO "Session" (id, "userId", "expiresAt") VALUES ($1, $2, $3)', [sessionId, userId, expiresAt]);
  
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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
    await db.run("DELETE FROM \"Session\" WHERE \"expiresAt\" < NOW()");
    await db.run("DELETE FROM \"PasswordReset\" WHERE \"expiresAt\" < NOW()");
    await db.run("DELETE FROM \"AccountVerification\" WHERE \"expiresAt\" < NOW()");
  }

  const session = await db.get('SELECT * FROM "Session" WHERE id = $1', [sessionId]);
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    await db.run('DELETE FROM "Session" WHERE id = $1', [sessionId]);
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  const user = await db.get('SELECT id, username, "avatarUrl", "coverUrl" FROM "User" WHERE id = $1', [session.userId]);
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
    await db.run('UPDATE "User" SET "avatarUrl" = $1 WHERE id = $2', [data.avatarUrl, user.id]);
  }
  if (data.coverUrl !== undefined) {
    if (!isValidImageUrl(data.coverUrl)) {
      return { error: "URL de capa inválida. Use apenas URLs HTTPS de imagens." };
    }
    await db.run('UPDATE "User" SET "coverUrl" = $1 WHERE id = $2', [data.coverUrl, user.id]);
  }
  return { success: true };
}

export async function requestPasswordReset(email: string) {
  if (!email) return { error: "E-mail obrigatório." };

  // Rate Limiting: 3 pedidos por hora por email
  if (isRateLimited(`forgot:${email}`, RATE_LIMITS.FORGOT_PASSWORD.limit, RATE_LIMITS.FORGOT_PASSWORD.windowMs)) {
    return { error: "Muitas solicitações. Tente novamente mais tarde." };
  }
  
  const user = await db.get('SELECT * FROM "User" WHERE email = $1', [email]);
  if (!user) {
    // Para evitar User Enumeration, retornamos sucesso mesmo se o e-mail não existir.
    return { success: true };
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos
  
  await db.run('INSERT INTO "PasswordReset" (id, "userId", "expiresAt") VALUES ($1, $2, $3)', [token, user.id, expiresAt]);

  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const htmlContent = `
    <h2>Recuperação de Senha</h2>
    <p>Você solicitou a redefinição da sua senha no Zerey.</p>
    <p>Clique no link abaixo para criar uma nova senha. Este link expira em 15 minutos.</p>
    <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#00f0ff;color:black;text-decoration:none;border-radius:8px;font-weight:bold;">Redefinir Senha</a>
    <p>Se você não solicitou, ignore este e-mail.</p>
  `;

  try {
    await sendHostingerEmail(email, "Redefinição de Senha - Zerey", htmlContent);
    return { success: true };
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    return { error: "Falha ao enviar e-mail. Configure HOSTINGER_API_KEY no arquivo .env" };
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
  const resetRecord = await db.get('DELETE FROM "PasswordReset" WHERE id = $1 RETURNING *', [token]);
  if (!resetRecord) {
    return { error: "Link inválido ou já utilizado." };
  }

  if (new Date(resetRecord.expiresAt) < new Date()) {
    return { error: "Este link expirou. Solicite um novo." };
  }

  const passwordHash = hashPassword(newPassword);
  
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query('UPDATE "User" SET "passwordHash" = $1 WHERE id = $2', [passwordHash, resetRecord.userId]);
    // VULN-07: Invalidar TODAS as sessões do usuário ao trocar a senha
    await client.query('DELETE FROM "Session" WHERE "userId" = $1', [resetRecord.userId]);
    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return { error: "Erro ao atualizar a senha." };
  } finally {
    client.release();
  }
}

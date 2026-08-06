import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '../../../lib/db';
import { getUser } from '../../actions/auth';
import { isRateLimited, RATE_LIMITS } from '../../../lib/rateLimit';

const getUserId = async (): Promise<string> => {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  return user.id;
};

// Validação de input com Zod
const SessionSchema = z.object({
  gameId: z.number().int().positive(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)"),
  durationMinutes: z.number().int().min(1).max(1440), // Máximo 24h
  isCompletionDay: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const userId = await getUserId();

    // Rate limiting por usuário
    if (isRateLimited(`api-session:${userId}`, RATE_LIMITS.API_SESSIONS.limit, RATE_LIMITS.API_SESSIONS.windowMs)) {
      return NextResponse.json({ error: "Muitas requisições. Aguarde." }, { status: 429 });
    }

    const body = await req.json();
    
    // Validação com Zod
    const parseResult = SessionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { gameId, sessionDate, durationMinutes, isCompletionDay } = parseResult.data;

    // Verificar se o jogo está na biblioteca do usuário
    const existing = db.prepare(
      "SELECT gameId FROM UserGame WHERE userId = ? AND gameId = ?"
    ).get(userId, gameId);
    if (!existing) {
      return NextResponse.json({ error: "Jogo não encontrado na biblioteca" }, { status: 404 });
    }

    // Registrar Sessão
    const stmt = db.prepare(`
      INSERT INTO PlaySession (userId, gameId, sessionDate, durationMinutes, isCompletionDay)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(userId, gameId, sessionDate, durationMinutes, isCompletionDay ? 1 : 0);

    // Atualizar tempo total no jogo
    const updateTime = db.prepare(`
      UPDATE UserGame SET playtime = playtime + ? WHERE userId = ? AND gameId = ?
    `);
    updateTime.run(durationMinutes, userId, gameId);

    // Se completou, define como Zerey
    if (isCompletionDay) {
      const updateStatus = db.prepare(`
        UPDATE UserGame SET status = 'Zerey', endDate = CURRENT_TIMESTAMP WHERE userId = ? AND gameId = ?
      `);
      updateStatus.run(userId, gameId);

      // Adiciona na timeline
      const insertTimeline = db.prepare(`
        INSERT INTO TimelineEvent (userId, gameId, eventType, oldValue, newValue)
        VALUES (?, ?, 'STATUS_CHANGED', 'Jogando', 'Zerey')
      `);
      insertTimeline.run(userId, gameId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error("Session API Error (POST):", err.message);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    
    // Rate limiting por usuário
    if (isRateLimited(`api-session-get:${userId}`, RATE_LIMITS.API_SESSIONS.limit, RATE_LIMITS.API_SESSIONS.windowMs)) {
      return NextResponse.json({ error: "Muitas requisições. Aguarde." }, { status: 429 });
    }

    const stmt = db.prepare(`
      SELECT * FROM PlaySession WHERE userId = ? ORDER BY sessionDate DESC
    `);
    const sessions = stmt.all(userId);
    return NextResponse.json(sessions);
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error("Session API Error (GET):", err.message);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

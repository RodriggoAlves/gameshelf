import { NextResponse } from 'next/server';
import db from '../../../lib/db';
import { getUser } from '../../actions/auth';

const getUserId = async (): Promise<string> => {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  return user.id;
};

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { gameId, sessionDate, durationMinutes, isCompletionDay } = body;

    if (!gameId || !sessionDate || durationMinutes === undefined) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
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
    console.error("Session API Error (POST):", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    const stmt = db.prepare(`
      SELECT * FROM PlaySession WHERE userId = ? ORDER BY sessionDate DESC
    `);
    const sessions = stmt.all(userId);
    return NextResponse.json(sessions);
  } catch (err: any) {
    console.error("Session API Error (GET):", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

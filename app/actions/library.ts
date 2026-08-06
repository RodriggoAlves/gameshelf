"use server";

import db from "../../lib/db";
import { revalidatePath } from "next/cache";
import { fetchGameDetails } from "../../lib/api";
import { getUser } from "./auth";

async function getUserId(): Promise<string> {
  const user = await getUser();
  if (!user) throw new Error("Não autenticado");
  return user.id;
}

export async function toggleGameInLibrary(gameId: number) {
  const userId = await getUserId();
  const existing = await db.get('SELECT "gameId" FROM "UserGame" WHERE "userId" = $1 AND "gameId" = $2', [userId, gameId]);
  if (existing) {
    await db.run('DELETE FROM "UserGame" WHERE "userId" = $1 AND "gameId" = $2', [userId, gameId]);
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/library`);
    return { added: false };
  } else {
    await db.run('INSERT INTO "UserGame" ("userId", "gameId", status) VALUES ($1, $2, $3)', [userId, gameId, "Quero Jogar"]);
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/library`);
    revalidatePath(`/profile`);
    return { added: true };
  }
}

import { z } from "zod";

const GameDataSchema = z.object({
  status: z.enum(["Zerey", "Platinado", "100%", "Jogando", "Quero Jogar", "Próximo Jogo", "Dropado"]),
  rating: z.number().min(0).max(5).optional(),
  progress: z.number().min(0).max(100).optional(),
  isFavorite: z.boolean().optional(),
  platform: z.string().max(50).optional(),
  startDate: z.string().max(20).optional().nullable(),
  endDate: z.string().max(20).optional().nullable(),
  playtime: z.number().min(0).max(99999).optional(),
  ownership: z.string().max(50).optional(),
  storefront: z.string().max(50).optional(),
  containsSpoilers: z.boolean().optional(),
  review: z.string().max(5000).optional()
});

export async function addGameToLibrary(gameId: number, rawData: { status: string, rating?: number, progress?: number, isFavorite?: boolean, platform?: string, startDate?: string, endDate?: string, playtime?: number, ownership?: string, storefront?: string, containsSpoilers?: boolean, review?: string }) {
  const parseResult = GameDataSchema.safeParse(rawData);
  if (!parseResult.success) {
    throw new Error("Dados inválidos fornecidos.");
  }
  const data = parseResult.data;
  const userId = await getUserId();
  const existing = await db.get('SELECT * FROM "UserGame" WHERE "userId" = $1 AND "gameId" = $2', [userId, gameId]);
  const isFav = data.isFavorite ? 1 : 0;
  
  const logEvent = async (eventType: string, oldV: string, newV: string) => {
    await db.run('INSERT INTO "TimelineEvent" ("userId", "gameId", "eventType", "oldValue", "newValue") VALUES ($1, $2, $3, $4, $5)', [userId, gameId, eventType, oldV, newV]);
  };

  if (!existing) {
    await db.run(`
      INSERT INTO "UserGame" ("userId", "gameId", status, rating, progress, "isFavorite", platform, "startDate", "endDate", playtime, ownership, storefront, "containsSpoilers", review) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [userId, gameId, data.status, data.rating || null, data.progress || 0, isFav, data.platform || "", data.startDate || null, data.endDate || null, data.playtime || 0, data.ownership || "", data.storefront || "", data.containsSpoilers ? 1 : 0, data.review || ""]);
    
    await logEvent("ADDED", "", data.status);
    if (data.rating) await logEvent("RATING_UPDATED", "", data.rating.toString());
    if (data.progress && data.progress > 0) await logEvent("PROGRESS_UPDATED", "0", data.progress.toString());
    if (isFav) await logEvent("FAVORITED", "", "");
  } else {
    if (existing.status !== data.status) await logEvent("STATUS_CHANGED", existing.status, data.status);
    if ((existing.rating || 0) !== (data.rating || 0)) await logEvent("RATING_UPDATED", existing.rating?.toString() || "", data.rating?.toString() || "");
    if ((existing.progress || 0) !== (data.progress || 0)) await logEvent("PROGRESS_UPDATED", existing.progress?.toString() || "0", data.progress?.toString() || "0");
    if (existing.isFavorite !== isFav) await logEvent(isFav ? "FAVORITED" : "UNFAVORITED", "", "");
    if (existing.platform !== data.platform) await logEvent("PLATFORM_CHANGED", existing.platform || "", data.platform || "");

    await db.run(`
      UPDATE "UserGame" SET status = $1, rating = $2, progress = $3, "isFavorite" = $4, platform = $5, "startDate" = $6, "endDate" = $7, playtime = $8, ownership = $9, storefront = $10, "containsSpoilers" = $11, review = $12, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "userId" = $13 AND "gameId" = $14
    `, [data.status, data.rating || null, data.progress || 0, isFav, data.platform || "", data.startDate || null, data.endDate || null, data.playtime || 0, data.ownership || "", data.storefront || "", data.containsSpoilers ? 1 : 0, data.review || "", userId, gameId]);
  }
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/library`);
  revalidatePath(`/profile`);
  return { success: true };
}

export async function removeGameFromLibrary(gameId: number) {
  const userId = await getUserId();
  await db.run('DELETE FROM "UserGame" WHERE "userId" = $1 AND "gameId" = $2', [userId, gameId]);
  await db.run('DELETE FROM "TimelineEvent" WHERE "userId" = $1 AND "gameId" = $2', [userId, gameId]);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/library`);
  revalidatePath(`/profile`);
  return { success: true };
}

export async function archiveGameFromLibrary(gameId: number) {
  const userId = await getUserId();
  await db.run('UPDATE "UserGame" SET "isArchived" = 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "userId" = $1 AND "gameId" = $2', [userId, gameId]);
  await db.run('INSERT INTO "TimelineEvent" ("userId", "gameId", "eventType", "oldValue", "newValue") VALUES ($1, $2, $3, $4, $5)', [userId, gameId, "ARCHIVED", "", ""]);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/library`);
  revalidatePath(`/profile`);
  return { success: true };
}

export async function checkGameInLibrary(gameId: number) {
  const user = await getUser();
  if (!user) return false;
  const existing = await db.get('SELECT "gameId" FROM "UserGame" WHERE "userId" = $1 AND "gameId" = $2', [user.id, gameId]);
  return !!existing;
}

export async function getLibraryGames() {
  const user = await getUser();
  if (!user) return [];
  const games = await db.all('SELECT * FROM "UserGame" WHERE "userId" = $1 ORDER BY "createdAt" DESC', [user.id]);
  return games;
}

export async function getGameLibraryData(gameId: number) {
  const user = await getUser();
  if (!user) return null;
  return await db.get('SELECT * FROM "UserGame" WHERE "userId" = $1 AND "gameId" = $2', [user.id, gameId]);
}

export async function getGameModalData(gameId: number) {
  const user = await getUser();
  if (!user) return null;
  const libraryData = await db.get('SELECT * FROM "UserGame" WHERE "userId" = $1 AND "gameId" = $2', [user.id, gameId]);
  const gameInfo = await fetchGameDetails(gameId);
  return {
    libraryData,
    platforms: gameInfo?.platforms?.map((p: any) => p.platform.name) || [],
    game: gameInfo ? {
      name: gameInfo.name,
      cover: gameInfo.background_image,
      year: gameInfo.released ? new Date(gameInfo.released).getFullYear() : 'N/A'
    } : null
  };
}

export async function getGameTimeline(gameId: number) {
  const user = await getUser();
  if (!user) return [];
  const events = await db.all('SELECT * FROM "TimelineEvent" WHERE "userId" = $1 AND "gameId" = $2 ORDER BY "createdAt" DESC', [user.id, gameId]);
  return events;
}

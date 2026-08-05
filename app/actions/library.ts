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
  const existing = db.prepare("SELECT gameId FROM UserGame WHERE userId = ? AND gameId = ?").get(userId, gameId);
  if (existing) {
    db.prepare("DELETE FROM UserGame WHERE userId = ? AND gameId = ?").run(userId, gameId);
    revalidatePath(`/game/${gameId}`);
    revalidatePath(`/library`);
    return { added: false };
  } else {
    db.prepare("INSERT INTO UserGame (userId, gameId, status) VALUES (?, ?, ?)").run(userId, gameId, "Quero Jogar");
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
  const existing = db.prepare("SELECT * FROM UserGame WHERE userId = ? AND gameId = ?").get(userId, gameId) as any;
  const isFav = data.isFavorite ? 1 : 0;
  
  const logEvent = (eventType: string, oldV: string, newV: string) => {
    db.prepare("INSERT INTO TimelineEvent (userId, gameId, eventType, oldValue, newValue) VALUES (?, ?, ?, ?, ?)").run(userId, gameId, eventType, oldV, newV);
  };

  if (!existing) {
    db.prepare(`
      INSERT INTO UserGame (userId, gameId, status, rating, progress, isFavorite, platform, startDate, endDate, playtime, ownership, storefront, containsSpoilers, review) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, gameId, data.status, data.rating || null, data.progress || 0, isFav, data.platform || "", data.startDate || null, data.endDate || null, data.playtime || 0, data.ownership || "", data.storefront || "", data.containsSpoilers ? 1 : 0, data.review || "");
    
    logEvent("ADDED", "", data.status);
    if (data.rating) logEvent("RATING_UPDATED", "", data.rating.toString());
    if (data.progress && data.progress > 0) logEvent("PROGRESS_UPDATED", "0", data.progress.toString());
    if (isFav) logEvent("FAVORITED", "", "");
  } else {
    if (existing.status !== data.status) logEvent("STATUS_CHANGED", existing.status, data.status);
    if ((existing.rating || 0) !== (data.rating || 0)) logEvent("RATING_UPDATED", existing.rating?.toString() || "", data.rating?.toString() || "");
    if ((existing.progress || 0) !== (data.progress || 0)) logEvent("PROGRESS_UPDATED", existing.progress?.toString() || "0", data.progress?.toString() || "0");
    if (existing.isFavorite !== isFav) logEvent(isFav ? "FAVORITED" : "UNFAVORITED", "", "");
    if (existing.platform !== data.platform) logEvent("PLATFORM_CHANGED", existing.platform || "", data.platform || "");

    db.prepare(`
      UPDATE UserGame SET status = ?, rating = ?, progress = ?, isFavorite = ?, platform = ?, startDate = ?, endDate = ?, playtime = ?, ownership = ?, storefront = ?, containsSpoilers = ?, review = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE userId = ? AND gameId = ?
    `).run(data.status, data.rating || null, data.progress || 0, isFav, data.platform || "", data.startDate || null, data.endDate || null, data.playtime || 0, data.ownership || "", data.storefront || "", data.containsSpoilers ? 1 : 0, data.review || "", userId, gameId);
  }
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/library`);
  revalidatePath(`/profile`);
  return { success: true };
}

export async function removeGameFromLibrary(gameId: number) {
  const userId = await getUserId();
  db.prepare("DELETE FROM UserGame WHERE userId = ? AND gameId = ?").run(userId, gameId);
  db.prepare("DELETE FROM TimelineEvent WHERE userId = ? AND gameId = ?").run(userId, gameId);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/library`);
  revalidatePath(`/profile`);
  return { success: true };
}

export async function archiveGameFromLibrary(gameId: number) {
  const userId = await getUserId();
  db.prepare("UPDATE UserGame SET isArchived = 1, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND gameId = ?").run(userId, gameId);
  db.prepare("INSERT INTO TimelineEvent (userId, gameId, eventType, oldValue, newValue) VALUES (?, ?, ?, ?, ?)").run(userId, gameId, "ARCHIVED", "", "");
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/library`);
  revalidatePath(`/profile`);
  return { success: true };
}

export async function checkGameInLibrary(gameId: number) {
  const userId = await getUserId();
  const existing = db.prepare("SELECT gameId FROM UserGame WHERE userId = ? AND gameId = ?").get(userId, gameId);
  return !!existing;
}

export async function getLibraryGames() {
  const userId = await getUserId();
  const games = db.prepare("SELECT * FROM UserGame WHERE userId = ? ORDER BY createdAt DESC").all(userId) as any[];
  return games;
}

export async function getGameLibraryData(gameId: number) {
  const userId = await getUserId();
  return db.prepare("SELECT * FROM UserGame WHERE userId = ? AND gameId = ?").get(userId, gameId);
}

export async function getGameModalData(gameId: number) {
  const userId = await getUserId();
  const libraryData = db.prepare("SELECT * FROM UserGame WHERE userId = ? AND gameId = ?").get(userId, gameId);
  const gameInfo = await fetchGameDetails(gameId);
  return {
    libraryData,
    platforms: gameInfo?.platforms?.map(p => p.platform.name) || [],
    game: gameInfo ? {
      name: gameInfo.name,
      cover: gameInfo.background_image,
      year: gameInfo.released ? new Date(gameInfo.released).getFullYear() : 'N/A'
    } : null
  };
}

export async function getGameTimeline(gameId: number) {
  const userId = await getUserId();
  const events = db.prepare("SELECT * FROM TimelineEvent WHERE userId = ? AND gameId = ? ORDER BY createdAt DESC").all(userId, gameId) as any[];
  return events;
}

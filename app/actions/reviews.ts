"use server";

import { db } from "../../lib/db";
import { getUser } from "./auth";
import { revalidatePath } from "next/cache";

export interface ReviewData {
  gameId: number;
  score: number | null;
  reviewText: string;
  platform?: string;
  playedHours?: number;
  progressStatus?: string;
  reviewStage?: string;
  containsSpoiler?: number;
  recommended?: number;
}

/**
 * Recalcula e atualiza as estatísticas de review de um jogo na tabela GameReviewStats.
 */
export async function updateGameReviewStats(gameId: number) {
  try {
    const reviews = await db.all('SELECT "score", "recommended" FROM "GameReview" WHERE "gameId" = $1 AND "deletedAt" IS NULL', [gameId]);
    
    if (reviews.length === 0) {
      await db.run('DELETE FROM "GameReviewStats" WHERE "gameId" = $1', [gameId]);
      return;
    }
    
    let totalScore = 0;
    let scoredCount = 0;
    let recommendationCount = 0;
    const distribution: Record<string, number> = { "10": 0, "9": 0, "8": 0, "7": 0, "6": 0, "5": 0, "4": 0, "3": 0, "2": 0, "1": 0, "0": 0 };
    
    for (const r of reviews) {
      if (r.score !== null) {
        totalScore += r.score;
        scoredCount++;
        const scoreKey = String(Math.floor(r.score));
        if (distribution[scoreKey] !== undefined) {
          distribution[scoreKey]++;
        }
      }
      if (r.recommended === 1) {
        recommendationCount++;
      }
    }
    
    const averageScore = scoredCount > 0 ? (totalScore / scoredCount) : 0;
    const recommendationPercentage = (recommendationCount / reviews.length) * 100;
    
    await db.run(`
      INSERT INTO "GameReviewStats" ("gameId", "averageScore", "reviewCount", "recommendationCount", "recommendationPercentage", "scoreDistribution", "lastCalculatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT ("gameId") DO UPDATE SET 
        "averageScore" = $2, 
        "reviewCount" = $3, 
        "recommendationCount" = $4, 
        "recommendationPercentage" = $5, 
        "scoreDistribution" = $6, 
        "lastCalculatedAt" = CURRENT_TIMESTAMP
    `, [
      gameId, 
      averageScore.toFixed(2), 
      reviews.length, 
      recommendationCount, 
      recommendationPercentage.toFixed(2), 
      JSON.stringify(distribution)
    ]);
    
  } catch (err) {
    console.error("Error updating review stats:", err);
  }
}

/**
 * Salva ou atualiza uma avaliação (Upsert).
 */
export async function saveReview(data: ReviewData) {
  const user = await getUser();
  if (!user) return { success: false, error: "Usuário não autenticado." };

  try {
    const existing = await db.get('SELECT "id" FROM "GameReview" WHERE "userId" = $1 AND "gameId" = $2', [user.id, data.gameId]);

    if (existing) {
      await db.run(`
        UPDATE "GameReview" SET 
          "score" = $1, 
          "reviewText" = $2, 
          "platform" = $3, 
          "playedHours" = $4, 
          "progressStatus" = $5, 
          "reviewStage" = $6, 
          "containsSpoiler" = $7, 
          "recommended" = $8,
          "deletedAt" = NULL,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "userId" = $9 AND "gameId" = $10
      `, [
        data.score ?? null, 
        data.reviewText || null, 
        data.platform || null, 
        data.playedHours ?? null, 
        data.progressStatus || null, 
        data.reviewStage || null, 
        data.containsSpoiler || 0, 
        data.recommended ?? 1,
        user.id, 
        data.gameId
      ]);
    } else {
      await db.run(`
        INSERT INTO "GameReview" ("userId", "gameId", "score", "reviewText", "platform", "playedHours", "progressStatus", "reviewStage", "containsSpoiler", "recommended")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        user.id, 
        data.gameId, 
        data.score ?? null, 
        data.reviewText || null, 
        data.platform || null, 
        data.playedHours ?? null, 
        data.progressStatus || null, 
        data.reviewStage || null, 
        data.containsSpoiler || 0, 
        data.recommended ?? 1
      ]);
    }

    await updateGameReviewStats(data.gameId);
    revalidatePath(`/game/${data.gameId}`);
    return { success: true };
  } catch (err) {
    console.error("Save review error:", err);
    return { success: false, error: "Erro ao salvar avaliação." };
  }
}

/**
 * Busca todas as avaliações de um jogo específico (com join para pegar dados do autor).
 */
export async function getGameReviews(gameId: number) {
  try {
    const reviews = await db.all(`
      SELECT r.*, u.username, u."avatarUrl", u.role,
        (SELECT COUNT(*) FROM "ReviewVote" v WHERE v."reviewId" = r.id AND v."isHelpful" = 1) as helpful_count,
        (SELECT COUNT(*) FROM "ReviewVote" v WHERE v."reviewId" = r.id AND v."isHelpful" = 0) as unhelpful_count,
        (SELECT COUNT(*) FROM "ReviewComment" c WHERE c."reviewId" = r.id AND c."deletedAt" IS NULL) as comment_count
      FROM "GameReview" r
      JOIN "User" u ON r."userId" = u.id
      WHERE r."gameId" = $1 AND r."deletedAt" IS NULL
      ORDER BY helpful_count DESC, r."createdAt" DESC
    `, [gameId]);
    return reviews;
  } catch (err) {
    console.error("Error fetching game reviews:", err);
    return [];
  }
}

/**
 * Busca a avaliação atual do usuário logado para um jogo.
 */
export async function getUserReview(gameId: number) {
  const user = await getUser();
  if (!user) return null;

  try {
    return await db.get(`SELECT * FROM "GameReview" WHERE "userId" = $1 AND "gameId" = $2 AND "deletedAt" IS NULL`, [user.id, gameId]);
  } catch (err) {
    console.error("Error fetching user review:", err);
    return null;
  }
}

/**
 * Busca as estatísticas agregadas de um jogo.
 */
export async function getReviewStats(gameId: number) {
  try {
    return await db.get(`SELECT * FROM "GameReviewStats" WHERE "gameId" = $1`, [gameId]);
  } catch (err) {
    console.error("Error fetching review stats:", err);
    return null;
  }
}

/**
 * Votação em uma avaliação (Útil/Não Útil)
 */
export async function voteReview(reviewId: number, isHelpful: number) {
  const user = await getUser();
  if (!user) return { success: false, error: "Usuário não autenticado." };

  try {
    await db.run(`
      INSERT INTO "ReviewVote" ("reviewId", "userId", "isHelpful")
      VALUES ($1, $2, $3)
      ON CONFLICT ("reviewId", "userId") DO UPDATE SET "isHelpful" = $3
    `, [reviewId, user.id, isHelpful]);
    
    return { success: true };
  } catch (err) {
    console.error("Vote review error:", err);
    return { success: false, error: "Erro ao registrar voto." };
  }
}

/**
 * Exclusão lógica (Soft Delete) de uma avaliação
 */
export async function deleteReview(gameId: number) {
  const user = await getUser();
  if (!user) return { success: false, error: "Usuário não autenticado." };

  try {
    await db.run(`UPDATE "GameReview" SET "deletedAt" = CURRENT_TIMESTAMP WHERE "userId" = $1 AND "gameId" = $2`, [user.id, gameId]);
    await updateGameReviewStats(gameId);
    revalidatePath(`/game/${gameId}`);
    return { success: true };
  } catch (err) {
    console.error("Delete review error:", err);
    return { success: false, error: "Erro ao excluir avaliação." };
  }
}

"use server";

import { db } from "../../lib/db";
import { getUser } from "./auth";
import { revalidatePath } from "next/cache";
import { fetchGameDetails } from "../../lib/api";

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
  categories?: { category: string; score: number }[];
  tags?: { name: string; type: "POSITIVE" | "NEGATIVE" }[];
}

/**
 * Recalcula e atualiza as estatísticas de review de um jogo na tabela GameReviewStats.
 */
export async function updateGameReviewStats(gameId: number) {
  try {
    const reviews = await db.all('SELECT "id", "score", "recommended" FROM "GameReview" WHERE "gameId" = $1 AND "deletedAt" IS NULL', [gameId]);
    
    if (reviews.length === 0) {
      await db.run('DELETE FROM "GameReviewStats" WHERE "gameId" = $1', [gameId]);
      return;
    }
    
    let totalScore = 0;
    let scoredCount = 0;
    let recommendationCount = 0;
    const distribution: Record<string, number> = { "10": 0, "9": 0, "8": 0, "7": 0, "6": 0, "5": 0, "4": 0, "3": 0, "2": 0, "1": 0, "0": 0 };
    
    // Aggregation maps for categories and tags
    const categoryTotals: Record<string, { sum: number, count: number }> = {};
    const tagCounts: Record<string, Record<string, number>> = { POSITIVE: {}, NEGATIVE: {} };

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

      // Fetch Categories for this review
      const scores = await db.all('SELECT "category", "score" FROM "ReviewScore" WHERE "reviewId" = $1', [r.id]);
      for (const s of scores) {
        if (!categoryTotals[s.category]) categoryTotals[s.category] = { sum: 0, count: 0 };
        categoryTotals[s.category].sum += s.score;
        categoryTotals[s.category].count++;
      }

      // Fetch Tags for this review
      const tags = await db.all('SELECT "name", "type" FROM "ReviewTag" WHERE "reviewId" = $1', [r.id]);
      for (const t of tags) {
        if (!tagCounts[t.type][t.name]) tagCounts[t.type][t.name] = 0;
        tagCounts[t.type][t.name]++;
      }
    }
    
    const averageScore = scoredCount > 0 ? (totalScore / scoredCount) : 0;
    const recommendationPercentage = (recommendationCount / reviews.length) * 100;
    
    // Calculate Category Averages
    const categoryAverages: Record<string, number> = {};
    for (const [cat, data] of Object.entries(categoryTotals)) {
      categoryAverages[cat] = Number((data.sum / data.count).toFixed(1));
    }

    // Sort Top Tags
    const topTags = {
      POSITIVE: Object.entries(tagCounts.POSITIVE).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      NEGATIVE: Object.entries(tagCounts.NEGATIVE).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    };

    await db.run(`
      INSERT INTO "GameReviewStats" ("gameId", "averageScore", "reviewCount", "recommendationCount", "recommendationPercentage", "scoreDistribution", "categoryAverages", "topTags", "lastCalculatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      ON CONFLICT ("gameId") DO UPDATE SET 
        "averageScore" = $2, 
        "reviewCount" = $3, 
        "recommendationCount" = $4, 
        "recommendationPercentage" = $5, 
        "scoreDistribution" = $6, 
        "categoryAverages" = $7,
        "topTags" = $8,
        "lastCalculatedAt" = CURRENT_TIMESTAMP
    `, [
      gameId, 
      averageScore.toFixed(2), 
      reviews.length, 
      recommendationCount, 
      recommendationPercentage.toFixed(2), 
      JSON.stringify(distribution),
      JSON.stringify(categoryAverages),
      JSON.stringify(topTags)
    ]);
    
  } catch (err) {
    console.error("Error updating review stats:", err);
  }
}

/**
 * Salva ou atualiza uma avaliação (Upsert) com Categorias e Tags (V2).
 */
export async function saveReview(data: ReviewData) {
  const user = await getUser();
  if (!user) return { success: false, error: "Usuário não autenticado." };

  if (!data.progressStatus || ["Quero Jogar", "Próximo Jogo"].includes(data.progressStatus)) {
    return { success: false, error: "Você precisa ter jogado o jogo para avaliá-lo." };
  }

  try {
    // Validar lançamento do jogo
    const gameInfo = await fetchGameDetails(data.gameId);
    if (gameInfo && gameInfo.released) {
      const releaseDate = new Date(gameInfo.released);
      if (releaseDate > new Date() && user.role !== 'ADMIN') {
        return { success: false, error: "Este jogo ainda não foi lançado. Avaliações bloqueadas." };
      }
    }

    const existing = await db.get('SELECT "id" FROM "GameReview" WHERE "userId" = $1 AND "gameId" = $2', [user.id, data.gameId]);
    let reviewId = existing?.id;

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
        WHERE "id" = $9
      `, [
        data.score ?? null, 
        data.reviewText || null, 
        data.platform || null, 
        data.playedHours ?? null, 
        data.progressStatus || null, 
        data.reviewStage || null, 
        data.containsSpoiler || 0, 
        data.recommended ?? 1,
        reviewId
      ]);
    } else {
      const result = await db.run(`
        INSERT INTO "GameReview" ("userId", "gameId", "score", "reviewText", "platform", "playedHours", "progressStatus", "reviewStage", "containsSpoiler", "recommended")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING "id"
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
      reviewId = result.rows[0].id;
    }

    // Atualiza Categorias e Tags
    if (reviewId) {
      await db.run('DELETE FROM "ReviewScore" WHERE "reviewId" = $1', [reviewId]);
      if (data.categories && data.categories.length > 0) {
        for (const cat of data.categories) {
          await db.run('INSERT INTO "ReviewScore" ("reviewId", "category", "score") VALUES ($1, $2, $3)', [reviewId, cat.category, cat.score]);
        }
      }

      await db.run('DELETE FROM "ReviewTag" WHERE "reviewId" = $1', [reviewId]);
      if (data.tags && data.tags.length > 0) {
        for (const tag of data.tags) {
          await db.run('INSERT INTO "ReviewTag" ("reviewId", "name", "type") VALUES ($1, $2, $3)', [reviewId, tag.name, tag.type]);
        }
      }
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
 * Busca todas as avaliações de um jogo com categorias e tags aninhadas.
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

    // Aninhar categorias e tags
    for (let r of reviews) {
      r.categories = await db.all('SELECT "category", "score" FROM "ReviewScore" WHERE "reviewId" = $1', [r.id]);
      r.tags = await db.all('SELECT "name", "type" FROM "ReviewTag" WHERE "reviewId" = $1', [r.id]);
    }

    return reviews;
  } catch (err) {
    console.error("Error fetching game reviews:", err);
    return [];
  }
}

export async function getReviewStats(gameId: number) {
  try {
    return await db.get(`SELECT * FROM "GameReviewStats" WHERE "gameId" = $1`, [gameId]);
  } catch (err) {
    console.error("Error fetching review stats:", err);
    return null;
  }
}

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

/**
 * Adiciona comentário a uma avaliação
 */
export async function addComment(reviewId: number, content: string, parentId?: number) {
  const user = await getUser();
  if (!user) return { success: false, error: "Usuário não autenticado." };
  if (!content.trim()) return { success: false, error: "Comentário vazio." };

  try {
    await db.run(`
      INSERT INTO "ReviewComment" ("reviewId", "userId", "content", "parentId") 
      VALUES ($1, $2, $3, $4)
    `, [reviewId, user.id, content, parentId || null]);
    return { success: true };
  } catch (e) {
    console.error("Error adding comment", e);
    return { success: false, error: "Erro ao adicionar comentário." };
  }
}

/**
 * Busca comentários de uma avaliação
 */
export async function getComments(reviewId: number) {
  try {
    return await db.all(`
      SELECT c.*, u.username, u."avatarUrl", u.role 
      FROM "ReviewComment" c 
      JOIN "User" u ON c."userId" = u.id 
      WHERE c."reviewId" = $1 AND c."deletedAt" IS NULL 
      ORDER BY c."createdAt" ASC
    `, [reviewId]);
  } catch (e) {
    console.error("Error fetching comments", e);
    return [];
  }
}

/**
 * Reporta uma avaliação por infração
 */
export async function reportReview(reviewId: number, reason: string) {
  const user = await getUser();
  if (!user) return { success: false, error: "Usuário não autenticado." };
  
  try {
    await db.run(`
      INSERT INTO "ReviewReport" ("reviewId", "userId", "reason") 
      VALUES ($1, $2, $3)
    `, [reviewId, user.id, reason]);
    return { success: true };
  } catch (e) {
    console.error("Error reporting review", e);
    return { success: false, error: "Erro ao denunciar avaliação." };
  }
}

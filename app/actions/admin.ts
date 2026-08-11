"use server";

import db from "../../lib/db";
import { requireAdmin } from "./auth";
import { revalidatePath } from "next/cache";
import { igdbRequest, fetchPopularGames } from "../../lib/api";

export async function seedDefaultContent(section: string) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Unauthorized");

  if (section === 'HOME_RECOMMENDED') {
    const popular = await fetchPopularGames();
    
    // Inicia transação
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM "FeaturedContent" WHERE section = $1', ['HOME_RECOMMENDED']);
      
      let index = 1;
      for (const game of popular) {
        const image = game.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` : '';
        await client.query(
          'INSERT INTO "FeaturedContent" (section, "entityId", "entityName", "entityImage", "orderIndex", "isActive") VALUES ($1, $2, $3, $4, $5, 1)',
          ['HOME_RECOMMENDED', game.id.toString(), game.name, image, index++]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
    await logAdminAction(admin.id, 'SEED_DEFAULT', section, 'BATCH', 'null', 'Seeded with default IGDB data');
    revalidatePath('/');
    return { success: true };
  }

  throw new Error("Section not supported for seeding yet");
}

async function logAdminAction(adminId: string, action: string, entityType: string, entityId: string, oldValue: string, newValue: string) {
  await db.run(
    'INSERT INTO "AdminAuditLog" ("adminId", action, "entityType", "entityId", "oldValue", "newValue") VALUES ($1, $2, $3, $4, $5, $6)',
    [adminId, action, entityType, entityId, oldValue, newValue]
  );
}

export async function getFeaturedContent(section: string) {
  const rows = await db.all('SELECT * FROM "FeaturedContent" WHERE section = $1 ORDER BY "orderIndex" ASC, "createdAt" DESC', [section]);
  // Retornar APENAS os campos necessários para o Client Component para evitar QUALQUER erro de serialização
  return rows.map((row: any) => ({
    id: row.id,
    section: row.section,
    entityId: row.entityId,
    entityName: row.entityName,
    entityImage: row.entityImage,
    orderIndex: row.orderIndex,
    isActive: row.isActive
  }));
}

export async function upsertFeaturedContent(data: {
  id?: number;
  section: string;
  entityId: string;
  entityName: string;
  entityImage: string;
  orderIndex: number;
  isActive: number;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Unauthorized");

  const oldValue = data.id 
    ? JSON.stringify(await db.get('SELECT * FROM "FeaturedContent" WHERE id = $1', [data.id])) 
    : "null";

  let resultId = data.id;

  if (data.id) {
    await db.run(`
      UPDATE "FeaturedContent" SET 
        "entityId" = $1, "entityName" = $2, "entityImage" = $3, "orderIndex" = $4, "isActive" = $5, "startDate" = $6, "endDate" = $7, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $8
    `, [data.entityId, data.entityName, data.entityImage, data.orderIndex, data.isActive, data.startDate || null, data.endDate || null, data.id]);
  } else {
    // Para INSERT RETURNING funcionar no SQLite/PG
    const result = await db.pool.query(`
      INSERT INTO "FeaturedContent" (section, "entityId", "entityName", "entityImage", "orderIndex", "isActive", "startDate", "endDate")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [data.section, data.entityId, data.entityName, data.entityImage, data.orderIndex, data.isActive, data.startDate || null, data.endDate || null]);
    
    resultId = result.rows[0].id;
  }

  const newValue = JSON.stringify({ ...data, id: resultId });
  
  await logAdminAction(
    admin.id, 
    data.id ? 'UPDATE_FEATURED' : 'CREATE_FEATURED', 
    data.section, 
    data.entityId, 
    oldValue, 
    newValue
  );

  revalidatePath('/');
  revalidatePath('/search');
  revalidatePath('/franquias');
  
  return { success: true, id: resultId };
}

export async function deleteFeaturedContent(id: number) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Unauthorized");

  const oldRecord = await db.get('SELECT * FROM "FeaturedContent" WHERE id = $1', [id]);
  if (oldRecord) {
    await db.run('DELETE FROM "FeaturedContent" WHERE id = $1', [id]);
    await logAdminAction(admin.id, 'DELETE_FEATURED', oldRecord.section, oldRecord.entityId, JSON.stringify(oldRecord), "null");
    
    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath('/franquias');
  }
  
  return { success: true };
}

export async function getAuditLogs(page = 1, limit = 50) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Unauthorized");
  
  const offset = (page - 1) * limit;
  
  const logs = await db.pool.query(`
    SELECT a.*, u.username as "adminName" 
    FROM "AdminAuditLog" a 
    LEFT JOIN "User" u ON a."adminId" = u.id 
    ORDER BY a."createdAt" DESC 
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
  
  return logs.rows;
}

export async function searchIGDBForAdmin(query: string, type: 'game' | 'franchise' = 'game') {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Unauthorized");

  const safeQuery = (query || "").replace(/[\\";{}()\n\r]/g, '').substring(0, 100);

  if (type === 'game') {
    const igdbQuery = `
      search "${safeQuery}";
      fields name, cover.image_id, first_release_date;
      where category = (0,8,9);
      limit 10;
    `;
    const results = await igdbRequest("games", igdbQuery);
    return results.map((g: any) => ({
      id: g.id.toString(),
      name: g.name,
      image: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "",
      info: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear().toString() : ""
    }));
  } else {
    const igdbQuery = `
      search "${safeQuery}";
      fields name;
      limit 10;
    `;
    const results = await igdbRequest("franchises", igdbQuery);
    return results.map((f: any) => ({
      id: f.id.toString(),
      name: f.name,
      image: "", // Franquias na IGDB geralmente não têm cover direto, usamos o nome
      info: ""
    }));
  }
}

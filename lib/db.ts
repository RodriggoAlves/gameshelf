import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ WARNING: DATABASE_URL environment variable is missing. Database connection will fail if queried.');
}

// Em ambiente Serverless/Next.js, é importante não criar múltiplos pools
const globalForPg = global as unknown as { pgPool: Pool };

const pool = globalForPg.pgPool || new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

// Vamos executar a criação das tabelas para manter o funcionamento original
const initDb = async () => {
  const client = await pool.connect();
  try {
    // É CRUCIAL colocar nomes de colunas camelCase entre aspas duplas no PostgreSQL
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "username" TEXT UNIQUE,
        "email" TEXT,
        "passwordHash" TEXT,
        "avatarUrl" TEXT,
        "coverUrl" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "isVerified" INTEGER DEFAULT 0,
        "role" TEXT DEFAULT 'USER'
      );

      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT,
        "expiresAt" TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "UserGame" (
        "userId" TEXT,
        "gameId" INTEGER,
        "status" TEXT DEFAULT 'Quero Jogar',
        "priority" TEXT DEFAULT 'Sem prioridade',
        "rating" INTEGER,
        "review" TEXT,
        "progress" INTEGER DEFAULT 0,
        "playtime" INTEGER DEFAULT 0,
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        "isArchived" INTEGER DEFAULT 0,
        "isFavorite" INTEGER DEFAULT 0,
        "platform" TEXT DEFAULT '',
        "ownership" TEXT DEFAULT '',
        "storefront" TEXT DEFAULT '',
        "containsSpoilers" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("userId", "gameId"),
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "Tag" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT,
        "name" TEXT,
        "color" TEXT,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "GameTag" (
        "userId" TEXT,
        "gameId" INTEGER,
        "tagId" INTEGER,
        PRIMARY KEY ("userId", "gameId", "tagId"),
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "TimelineEvent" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT,
        "gameId" INTEGER,
        "eventType" TEXT,
        "oldValue" TEXT,
        "newValue" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "PlaySession" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT,
        "gameId" INTEGER,
        "sessionDate" TEXT,
        "durationMinutes" INTEGER,
        "isCompletionDay" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "PasswordReset" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT,
        "expiresAt" TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "AccountVerification" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT,
        "expiresAt" TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "FeaturedContent" (
        "id" SERIAL PRIMARY KEY,
        "section" TEXT,
        "entityId" TEXT,
        "entityName" TEXT,
        "entityImage" TEXT,
        "orderIndex" INTEGER DEFAULT 0,
        "isActive" INTEGER DEFAULT 1,
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
        "id" SERIAL PRIMARY KEY,
        "adminId" TEXT,
        "action" TEXT,
        "entityType" TEXT,
        "entityId" TEXT,
        "oldValue" TEXT,
        "newValue" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL
      );

      -- ═══════════════════════════════════════════════════════
      -- FASE 1: Índices B-Tree (Performance)
      -- ═══════════════════════════════════════════════════════
      CREATE INDEX IF NOT EXISTS idx_usergame_userid ON "UserGame"("userId");
      CREATE INDEX IF NOT EXISTS idx_usergame_gameid ON "UserGame"("gameId");
      CREATE INDEX IF NOT EXISTS idx_tag_userid ON "Tag"("userId");
      CREATE INDEX IF NOT EXISTS idx_gametag_userid ON "GameTag"("userId");
      CREATE INDEX IF NOT EXISTS idx_gametag_gameid ON "GameTag"("gameId");
      CREATE INDEX IF NOT EXISTS idx_gametag_tagid ON "GameTag"("tagId");
      CREATE INDEX IF NOT EXISTS idx_timelineevent_userid ON "TimelineEvent"("userId");
      CREATE INDEX IF NOT EXISTS idx_playsession_userid ON "PlaySession"("userId");

      -- ═══════════════════════════════════════════════════════
      -- FASE 2: Índices adicionais para Login e Buscas
      -- ═══════════════════════════════════════════════════════
      CREATE INDEX IF NOT EXISTS idx_user_email ON "User"("email");
      CREATE INDEX IF NOT EXISTS idx_session_userid ON "Session"("userId");
      CREATE INDEX IF NOT EXISTS idx_session_expiresat ON "Session"("expiresAt");
      CREATE INDEX IF NOT EXISTS idx_playsession_gameid ON "PlaySession"("gameId");
      CREATE INDEX IF NOT EXISTS idx_timelineevent_gameid ON "TimelineEvent"("gameId");

      -- ═══════════════════════════════════════════════════════
      -- FASE 3: Soft Delete e Colunas de Auditoria
      -- Permite "desfazer" exclusões e manter histórico
      -- ═══════════════════════════════════════════════════════
      DO $$ BEGIN
        -- Soft Delete: User
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='deletedAt') THEN
          ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP DEFAULT NULL;
        END IF;
        -- Soft Delete: UserGame
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='UserGame' AND column_name='deletedAt') THEN
          ALTER TABLE "UserGame" ADD COLUMN "deletedAt" TIMESTAMP DEFAULT NULL;
        END IF;
        -- updatedAt em Tag (ausente na versão original)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Tag' AND column_name='updatedAt') THEN
          ALTER TABLE "Tag" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
        -- updatedAt em User (para rastrear atualizações de perfil)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='updatedAt') THEN
          ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;

      -- ═══════════════════════════════════════════════════════
      -- FASE 4: Índice temporal em TimelineEvent e PlaySession
      -- Prepara o terreno para particionamento futuro por data
      -- ═══════════════════════════════════════════════════════
      CREATE INDEX IF NOT EXISTS idx_timelineevent_createdat ON "TimelineEvent"("createdAt");
      CREATE INDEX IF NOT EXISTS idx_playsession_createdat ON "PlaySession"("createdAt");
    `);

    // ═══════════════════════════════════════════════════════
    // Limpeza automática de tokens expirados (Segurança)
    // Remove sessões, tokens de reset e verificações vencidas
    // ═══════════════════════════════════════════════════════
    await client.query(`
      DELETE FROM "Session" WHERE "expiresAt" < NOW();
      DELETE FROM "PasswordReset" WHERE "expiresAt" < NOW();
      DELETE FROM "AccountVerification" WHERE "expiresAt" < NOW();
    `);
    console.log('🧹 Limpeza de tokens expirados concluída.');

  } catch (err) {
    console.error('Error initializing PostgreSQL schema:', err);
  } finally {
    client.release();
  }
};

// Executa a inicialização apenas se tivermos a URL real
if (process.env.DATABASE_URL) {
  initDb().catch(console.error);
}

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  
  get: async <T = any>(text: string, params?: any[]): Promise<T | undefined> => {
    const res = await pool.query(text, params);
    return res.rows[0];
  },
  
  all: async <T = any>(text: string, params?: any[]): Promise<T[]> => {
    const res = await pool.query(text, params);
    return res.rows;
  },
  
  run: async (text: string, params?: any[]) => {
    return pool.query(text, params);
  },
  
  pool
};

export default db;

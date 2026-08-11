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

      CREATE TABLE IF NOT EXISTS "CachedGame" (
        "id" INTEGER PRIMARY KEY,
        "name" TEXT,
        "coverUrl" TEXT,
        "data" JSONB,
        "lastSyncedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "CachedFranchise" (
        "id" INTEGER PRIMARY KEY,
        "name" TEXT,
        "gamesCount" INTEGER,
        "coverUrl" TEXT,
        "lastSyncedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "SearchCache" (
        "query" TEXT PRIMARY KEY,
        "type" TEXT,
        "resultData" JSONB,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP
      );

      -- ═══════════════════════════════════════════════════════
      -- NOVO SISTEMA DE REVIEWS (V1)
      -- ═══════════════════════════════════════════════════════

      CREATE TABLE IF NOT EXISTS "GameReview" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "gameId" INTEGER NOT NULL,
        "score" INTEGER CHECK ("score" >= 0 AND "score" <= 10),
        "reviewText" TEXT,
        "platform" TEXT,
        "playedHours" INTEGER,
        "progressStatus" TEXT,
        "reviewStage" TEXT,
        "containsSpoiler" INTEGER DEFAULT 0,
        "recommended" INTEGER DEFAULT 1,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP,
        UNIQUE("userId", "gameId"),
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "ReviewVote" (
        "id" SERIAL PRIMARY KEY,
        "reviewId" INTEGER NOT NULL,
        "userId" TEXT NOT NULL,
        "isHelpful" INTEGER NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("reviewId", "userId"),
        FOREIGN KEY ("reviewId") REFERENCES "GameReview"("id") ON DELETE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "ReviewComment" (
        "id" SERIAL PRIMARY KEY,
        "reviewId" INTEGER NOT NULL,
        "userId" TEXT NOT NULL,
        "parentId" INTEGER,
        "content" TEXT NOT NULL,
        "containsSpoiler" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP,
        FOREIGN KEY ("reviewId") REFERENCES "GameReview"("id") ON DELETE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        FOREIGN KEY ("parentId") REFERENCES "ReviewComment"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "ReviewScore" (
        "id" SERIAL PRIMARY KEY,
        "reviewId" INTEGER NOT NULL,
        "category" TEXT NOT NULL,
        "score" INTEGER CHECK ("score" >= 0 AND "score" <= 10),
        FOREIGN KEY ("reviewId") REFERENCES "GameReview"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "ReviewTag" (
        "id" SERIAL PRIMARY KEY,
        "reviewId" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        FOREIGN KEY ("reviewId") REFERENCES "GameReview"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "GameReviewStats" (
        "gameId" INTEGER PRIMARY KEY,
        "averageScore" DECIMAL(4,2) DEFAULT 0,
        "reviewCount" INTEGER DEFAULT 0,
        "recommendationCount" INTEGER DEFAULT 0,
        "recommendationPercentage" DECIMAL(5,2) DEFAULT 0,
        "scoreDistribution" JSONB,
        "categoryAverages" JSONB,
        "topTags" JSONB,
        "lastCalculatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "ReviewReport" (
        "id" SERIAL PRIMARY KEY,
        "reviewId" INTEGER NOT NULL,
        "userId" TEXT NOT NULL,
        "reason" TEXT NOT NULL,
        "status" TEXT DEFAULT 'PENDING',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "resolvedAt" TIMESTAMP,
        FOREIGN KEY ("reviewId") REFERENCES "GameReview"("id") ON DELETE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
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
      -- FASE 3: Índices para Sistema de Reviews (V1 e V2)
      -- ═══════════════════════════════════════════════════════
      CREATE INDEX IF NOT EXISTS idx_gamereview_gameid ON "GameReview"("gameId");
      CREATE INDEX IF NOT EXISTS idx_gamereview_userid ON "GameReview"("userId");
      CREATE INDEX IF NOT EXISTS idx_reviewcomment_reviewid ON "ReviewComment"("reviewId");
      CREATE INDEX IF NOT EXISTS idx_reviewscore_reviewid ON "ReviewScore"("reviewId");
      CREATE INDEX IF NOT EXISTS idx_reviewtag_reviewid ON "ReviewTag"("reviewId");
      
      -- ═══════════════════════════════════════════════════════
      -- FASE 4: Soft Delete, Colunas de Auditoria e Ajustes V2
      -- Permite "desfazer" exclusões e manter histórico
      -- ═══════════════════════════════════════════════════════
      DO $$ BEGIN
        -- Alterações da V2
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='GameReviewStats' AND column_name='categoryAverages') THEN
          ALTER TABLE "GameReviewStats" ADD COLUMN "categoryAverages" JSONB;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='GameReviewStats' AND column_name='topTags') THEN
          ALTER TABLE "GameReviewStats" ADD COLUMN "topTags" JSONB;
        END IF;
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
        -- role em User
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='role') THEN
          ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'USER';
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

// Executa a inicialização apenas manualmente ou num script de build, nunca no runtime serverless
// para evitar estourar o limite de conexões (EMAXCONNSESSION) em plataformas como Vercel/Neon.
// if (process.env.DATABASE_URL) {
//   initDb().catch(console.error);
// }

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

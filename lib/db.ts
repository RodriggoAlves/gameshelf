// lib/db.ts
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ WARNING: DATABASE_URL environment variable is missing. Database connection will fail if queried.');
}

// Global pool for serverless environments
const globalForPg = global as unknown as { pgPool: Pool };
const pool = globalForPg.pgPool || new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});
if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

const initDb = async () => {
  const client = await pool.connect();
  try {
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
        "deletedAt" TIMESTAMP DEFAULT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        "deletedAt" TIMESTAMP DEFAULT NULL,
        PRIMARY KEY ("userId", "gameId"),
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "Tag" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT,
        "name" TEXT,
        "color" TEXT,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

      -- NEW TABLES: wishlist, badges, watch_parties
      CREATE TABLE IF NOT EXISTS "wishlist" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "gameId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        FOREIGN KEY ("gameId") REFERENCES "UserGame"("gameId") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "badges" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "earnedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "watch_parties" (
        "id" SERIAL PRIMARY KEY,
        "hostUserId" TEXT NOT NULL,
        "gameId" INTEGER NOT NULL,
        "token" TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE,
        FOREIGN KEY ("gameId") REFERENCES "UserGame"("gameId") ON DELETE CASCADE
      );

      -- Indexes for performance and new tables
      CREATE INDEX IF NOT EXISTS idx_usergame_userid ON "UserGame"("userId");
      CREATE INDEX IF NOT EXISTS idx_usergame_gameid ON "UserGame"("gameId");
      CREATE INDEX IF NOT EXISTS idx_tag_userid ON "Tag"("userId");
      CREATE INDEX IF NOT EXISTS idx_gametag_userid ON "GameTag"("userId");
      CREATE INDEX IF NOT EXISTS idx_gametag_gameid ON "GameTag"("gameId");
      CREATE INDEX IF NOT EXISTS idx_gametag_tagid ON "GameTag"("tagId");
      CREATE INDEX IF NOT EXISTS idx_timelineevent_userid ON "TimelineEvent"("userId");
      CREATE INDEX IF NOT EXISTS idx_playsession_userid ON "PlaySession"("userId");
      CREATE INDEX IF NOT EXISTS idx_user_email ON "User"("email");
      CREATE INDEX IF NOT EXISTS idx_session_userid ON "Session"("userId");
      CREATE INDEX IF NOT EXISTS idx_session_expiresat ON "Session"("expiresAt");
      CREATE INDEX IF NOT EXISTS idx_playsession_gameid ON "PlaySession"("gameId");
      CREATE INDEX IF NOT EXISTS idx_timelineevent_gameid ON "TimelineEvent"("gameId");
      CREATE INDEX IF NOT EXISTS idx_wishlist_userid ON "wishlist"("userId");
      CREATE INDEX IF NOT EXISTS idx_wishlist_gameid ON "wishlist"("gameId");
      CREATE INDEX IF NOT EXISTS idx_badges_userid ON "badges"("userId");
      CREATE INDEX IF NOT EXISTS idx_watch_parties_host ON "watch_parties"("hostUserId");

      -- Clean up expired tokens
      DELETE FROM "Session" WHERE "expiresAt" < NOW();
      DELETE FROM "PasswordReset" WHERE "expiresAt" < NOW();
      DELETE FROM "AccountVerification" WHERE "expiresAt" < NOW();
    `);
    console.log('✅ Database schema initialized');
  } catch (err) {
    console.error('Error initializing PostgreSQL schema:', err);
  } finally {
    client.release();
  }
};

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
  run: async (text: string, params?: any[]) => pool.query(text, params),
  pool,
};

export default db;

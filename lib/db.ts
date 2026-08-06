import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

// Em ambiente Serverless/Next.js, é importante não criar múltiplos pools
const globalForPg = global as unknown as { pgPool: Pool };

const pool = globalForPg.pgPool || new Pool({
  connectionString: process.env.DATABASE_URL,
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
        "isVerified" INTEGER DEFAULT 0
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
        PRIMARY KEY ("userId", "gameId")
      );

      CREATE TABLE IF NOT EXISTS "Tag" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT,
        "name" TEXT,
        "color" TEXT
      );

      CREATE TABLE IF NOT EXISTS "GameTag" (
        "userId" TEXT,
        "gameId" INTEGER,
        "tagId" INTEGER,
        PRIMARY KEY ("userId", "gameId", "tagId"),
        FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "TimelineEvent" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT,
        "gameId" INTEGER,
        "eventType" TEXT,
        "oldValue" TEXT,
        "newValue" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "PlaySession" (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT,
        "gameId" INTEGER,
        "sessionDate" TEXT,
        "durationMinutes" INTEGER,
        "isCompletionDay" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    `);
  } catch (err) {
    console.error('Error initializing PostgreSQL schema:', err);
  } finally {
    client.release();
  }
};

// Executa a inicialização
initDb().catch(console.error);

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

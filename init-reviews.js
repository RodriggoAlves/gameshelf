require('dotenv').config({path: '.env.local'});
process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log("Inicializando novas tabelas do Sistema de Reviews...");
  const client = await pool.connect();
  
  try {
    await client.query(`
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

      CREATE INDEX IF NOT EXISTS idx_gamereview_gameid ON "GameReview"("gameId");
      CREATE INDEX IF NOT EXISTS idx_gamereview_userid ON "GameReview"("userId");
      CREATE INDEX IF NOT EXISTS idx_reviewcomment_reviewid ON "ReviewComment"("reviewId");
      CREATE INDEX IF NOT EXISTS idx_reviewscore_reviewid ON "ReviewScore"("reviewId");
      CREATE INDEX IF NOT EXISTS idx_reviewtag_reviewid ON "ReviewTag"("reviewId");
      
      DO $$ BEGIN
        -- Alterações da V2
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='GameReviewStats' AND column_name='categoryAverages') THEN
          ALTER TABLE "GameReviewStats" ADD COLUMN "categoryAverages" JSONB;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='GameReviewStats' AND column_name='topTags') THEN
          ALTER TABLE "GameReviewStats" ADD COLUMN "topTags" JSONB;
        END IF;
      END $$;
    `);
    console.log("✅ Tabelas criadas com sucesso!");
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();

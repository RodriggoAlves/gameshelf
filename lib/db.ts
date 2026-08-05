import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'zerey.db'));

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT,
    passwordHash TEXT,
    avatarUrl TEXT,
    coverUrl TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Session (
    id TEXT PRIMARY KEY,
    userId TEXT,
    expiresAt DATETIME,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS UserGame (
    userId TEXT,
    gameId INTEGER,
    status TEXT DEFAULT 'Quero Jogar',
    priority TEXT DEFAULT 'Sem prioridade',
    rating INTEGER,
    review TEXT,
    progress INTEGER DEFAULT 0,
    playtime INTEGER DEFAULT 0,
    startDate DATETIME,
    endDate DATETIME,
    isArchived INTEGER DEFAULT 0,
    isFavorite INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userId, gameId)
  );

  CREATE TABLE IF NOT EXISTS Tag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    name TEXT,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS GameTag (
    userId TEXT,
    gameId INTEGER,
    tagId INTEGER,
    PRIMARY KEY (userId, gameId, tagId),
    FOREIGN KEY (tagId) REFERENCES Tag(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS TimelineEvent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    gameId INTEGER,
    eventType TEXT,
    oldValue TEXT,
    newValue TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS PlaySession (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    gameId INTEGER,
    sessionDate TEXT,
    durationMinutes INTEGER,
    isCompletionDay INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS PasswordReset (
    id TEXT PRIMARY KEY,
    userId TEXT,
    expiresAt DATETIME,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS AccountVerification (
    id TEXT PRIMARY KEY,
    userId TEXT,
    expiresAt DATETIME,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  );
`);

try {
  db.exec('ALTER TABLE User ADD COLUMN isVerified INTEGER DEFAULT 0');
} catch (e) {}

try {
  db.exec('ALTER TABLE UserGame ADD COLUMN isFavorite INTEGER DEFAULT 0');
} catch (e) {}

try {
  db.exec('ALTER TABLE UserGame ADD COLUMN platform TEXT DEFAULT ""');
} catch (e) {}

try {
  db.exec('ALTER TABLE UserGame ADD COLUMN ownership TEXT DEFAULT ""');
} catch (e) {}

try {
  db.exec('ALTER TABLE UserGame ADD COLUMN storefront TEXT DEFAULT ""');
} catch (e) {}

try {
  db.exec('ALTER TABLE UserGame ADD COLUMN containsSpoilers INTEGER DEFAULT 0');
} catch (e) {}

try {
  db.exec('ALTER TABLE User ADD COLUMN email TEXT');
} catch (e) {}

export default db;

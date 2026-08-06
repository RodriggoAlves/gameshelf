const Database = require('better-sqlite3');
const path = require('path');

// PROTEÇÃO: Só permite execução em ambiente de desenvolvimento explícito
if (process.env.NODE_ENV !== 'development') {
  console.error("ABORT: NODE_ENV deve ser explicitamente definido como 'development'.");
  console.error("Execute com: NODE_ENV=development node scripts/reset-users.js");
  process.exit(1);
}

const dbPath = path.join(process.cwd(), 'data', 'zerey.db');
const db = new Database(dbPath);

console.log("⚠️  Iniciando limpeza do Banco de Dados...");
console.log(`   Alvo: ${dbPath}`);

try {
  db.exec("BEGIN TRANSACTION");
  
  db.prepare("DELETE FROM Session").run();
  db.prepare("DELETE FROM PasswordReset").run();
  db.prepare("DELETE FROM AccountVerification").run();
  db.prepare("DELETE FROM UserGame").run();
  db.prepare("DELETE FROM GameTag").run();
  db.prepare("DELETE FROM Tag").run();
  db.prepare("DELETE FROM TimelineEvent").run();
  db.prepare("DELETE FROM PlaySession").run();
  db.prepare("DELETE FROM User").run();
  
  db.exec("COMMIT");
  console.log("✅ Banco de dados resetado com sucesso! Todos os dados foram apagados.");
} catch (err) {
  db.exec("ROLLBACK");
  console.error("❌ Erro ao limpar banco de dados:", err);
}

db.close();

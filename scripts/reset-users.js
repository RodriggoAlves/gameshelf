const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'zerey.db');
const db = new Database(dbPath);

console.log("Iniciando limpeza do Banco de Dados...");

if (process.env.NODE_ENV === 'production') {
  console.error("ABORT: Este script não pode rodar em produção.");
  process.exit(1);
}

try {
  db.exec("BEGIN TRANSACTION");
  
  db.prepare("DELETE FROM Session").run();
  db.prepare("DELETE FROM UserGame").run();
  db.prepare("DELETE FROM GameTag").run();
  db.prepare("DELETE FROM Tag").run();
  db.prepare("DELETE FROM TimelineEvent").run();
  db.prepare("DELETE FROM PlaySession").run();
  db.prepare("DELETE FROM User").run();
  
  db.exec("COMMIT");
  console.log("Banco de dados resetado com sucesso! Todos os usuários foram apagados.");
} catch (err) {
  db.exec("ROLLBACK");
  console.error("Erro ao limpar banco de dados:", err);
}

db.close();

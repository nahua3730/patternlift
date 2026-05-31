import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const dataDir = path.join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

const databasePath = path.join(dataDir, "patternlift.db");

const globalForDb = globalThis as unknown as {
  patternliftDb?: DatabaseSync;
};

export const db =
  globalForDb.patternliftDb ?? new DatabaseSync(databasePath);

if (!globalForDb.patternliftDb) {
  globalForDb.patternliftDb = db;
}

runMigrations();

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      problem_id TEXT NOT NULL,
      problem_title TEXT NOT NULL,
      selected_pattern_label TEXT NOT NULL,
      correct_pattern_label TEXT NOT NULL,
      outcome TEXT NOT NULL,
      score INTEGER NOT NULL,
      insight TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS review_items (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      problem_title TEXT NOT NULL,
      target_pattern_label TEXT NOT NULL,
      contrast_pattern_label TEXT NOT NULL,
      review_question TEXT NOT NULL,
      urgency TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  ensureColumn("attempts", "user_id", "TEXT");
  ensureColumn("review_items", "user_id", "TEXT");
}

function ensureColumn(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;

  if (!columns.some((entry) => entry.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

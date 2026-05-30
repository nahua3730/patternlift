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
  db.exec(`
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
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
      problem_title TEXT NOT NULL,
      target_pattern_label TEXT NOT NULL,
      contrast_pattern_label TEXT NOT NULL,
      review_question TEXT NOT NULL,
      urgency TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  globalForDb.patternliftDb = db;
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

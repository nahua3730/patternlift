import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type SqlValue = string | number | null;
type NeonClient = NeonQueryFunction<false, false>;

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const usesPostgres = databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://");
const globalForDb = globalThis as unknown as {
  patternliftDb?: DatabaseSync;
  patternliftPostgres?: NeonClient;
  patternliftMigration?: Promise<void>;
};

let sqliteDb: DatabaseSync | null = null;
let postgresSql: NeonClient | null = null;

if (usesPostgres) {
  postgresSql = globalForDb.patternliftPostgres ?? neon(databaseUrl);
  globalForDb.patternliftPostgres = postgresSql;
} else {
  const dataDir = process.env.VERCEL
    ? path.join(os.tmpdir(), "patternlift")
    : path.join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });
  const databasePath = path.join(dataDir, "patternlift.db");
  sqliteDb = globalForDb.patternliftDb ?? new DatabaseSync(databasePath);
  sqliteDb.exec("PRAGMA busy_timeout = 10000");
  globalForDb.patternliftDb = sqliteDb;
  runSqliteMigrations(sqliteDb);
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function dbExecute(query: string, params: SqlValue[] = []) {
  await ensureDatabase();
  if (postgresSql) {
    await postgresSql.query(toPostgresQuery(query), params);
    return;
  }
  sqliteDb!.prepare(query).run(...params);
}

export async function dbOne<T>(query: string, params: SqlValue[] = []) {
  await ensureDatabase();
  if (postgresSql) {
    const rows = await postgresSql.query(toPostgresQuery(query), params);
    return (rows[0] as T | undefined) ?? undefined;
  }
  return sqliteDb!.prepare(query).get(...params) as T | undefined;
}

export async function dbAll<T>(query: string, params: SqlValue[] = []) {
  await ensureDatabase();
  if (postgresSql) {
    const rows = await postgresSql.query(toPostgresQuery(query), params);
    return rows as T[];
  }
  return sqliteDb!.prepare(query).all(...params) as T[];
}

export async function ensureDatabase() {
  if (!postgresSql) return;
  globalForDb.patternliftMigration ??= runPostgresMigrations(postgresSql).catch((error) => {
    globalForDb.patternliftMigration = undefined;
    throw error;
  });
  await globalForDb.patternliftMigration;
}

function toPostgresQuery(query: string) {
  let parameter = 0;
  return query.replace(/\?/g, () => `$${++parameter}`);
}

async function runPostgresMigrations(sql: NeonClient) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      problem_id TEXT NOT NULL,
      problem_title TEXT NOT NULL,
      selected_pattern_label TEXT NOT NULL,
      correct_pattern_label TEXT NOT NULL,
      outcome TEXT NOT NULL,
      score INTEGER NOT NULL,
      insight TEXT NOT NULL,
      hints_used INTEGER NOT NULL DEFAULT 0,
      code_passed INTEGER,
      confidence INTEGER NOT NULL DEFAULT 2,
      explanation_score INTEGER NOT NULL DEFAULT 0,
      confused_with TEXT,
      input_method TEXT NOT NULL DEFAULT 'text',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS review_items (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      problem_id TEXT,
      problem_title TEXT NOT NULL,
      target_pattern_label TEXT NOT NULL,
      contrast_pattern_label TEXT NOT NULL,
      review_question TEXT NOT NULL,
      urgency TEXT NOT NULL,
      due_at TIMESTAMPTZ,
      interval_days INTEGER NOT NULL DEFAULT 1,
      repetitions INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS mastery_agent_runs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'proposed',
      model TEXT NOT NULL,
      source TEXT NOT NULL,
      output_json TEXT NOT NULL,
      tool_trace_json TEXT NOT NULL,
      accepted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS study_plan_runs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'proposed',
      model TEXT NOT NULL,
      source TEXT NOT NULL,
      input_json TEXT NOT NULL,
      output_json TEXT NOT NULL,
      tool_trace_json TEXT NOT NULL,
      accepted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS daily_checkins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      checkin_date TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, checkin_date)
    )`,
    `CREATE TABLE IF NOT EXISTS problem_marks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      problem_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS problem_approaches (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL UNIQUE,
      model TEXT NOT NULL,
      approaches_json TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS problem_statements (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL UNIQUE,
      model TEXT NOT NULL,
      statement_json TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    "CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)",
    "CREATE INDEX IF NOT EXISTS attempts_user_created_idx ON attempts(user_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS review_items_user_due_idx ON review_items(user_id, due_at)",
    "CREATE INDEX IF NOT EXISTS mastery_agent_runs_user_created_idx ON mastery_agent_runs(user_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS study_plan_runs_user_created_idx ON study_plan_runs(user_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS daily_checkins_user_date_idx ON daily_checkins(user_id, checkin_date DESC)",
    "CREATE INDEX IF NOT EXISTS problem_marks_user_problem_idx ON problem_marks(user_id, problem_id)",
    // review_items predates the problem_id column - CREATE TABLE IF NOT EXISTS
    // above is a no-op against an already-existing table, so the column needs
    // its own idempotent ADD for deployments where the table already exists.
    "ALTER TABLE review_items ADD COLUMN IF NOT EXISTS problem_id TEXT",
    // V2.2 failure-diagnosis columns, same idempotent-ADD pattern.
    "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS primary_failure_type TEXT",
    "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS secondary_failure_type TEXT",
    "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS diagnosis_confidence REAL",
    "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS diagnosis_payload TEXT",
    // V2.3 remediation/hint-ladder/code-fading columns. hints_used stays
    // the legacy total-hint-messages count; highest_hint_level is the new,
    // more meaningful signal (depth, not just count).
    "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS highest_hint_level INTEGER",
    "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS scaffold_level INTEGER",
    "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS remediation_used TEXT",
    "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS retry_succeeded INTEGER",
  ];

  for (const statement of statements) {
    await sql.query(statement);
  }
}

function runSqliteMigrations(db: DatabaseSync) {
  db.exec("BEGIN IMMEDIATE");
  try {
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
      CREATE TABLE IF NOT EXISTS mastery_agent_runs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'proposed',
        model TEXT NOT NULL,
        source TEXT NOT NULL,
        output_json TEXT NOT NULL,
        tool_trace_json TEXT NOT NULL,
        accepted_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS study_plan_runs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'proposed',
        model TEXT NOT NULL,
        source TEXT NOT NULL,
        input_json TEXT NOT NULL,
        output_json TEXT NOT NULL,
        tool_trace_json TEXT NOT NULL,
        accepted_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS daily_checkins (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        checkin_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, checkin_date)
      );
      CREATE TABLE IF NOT EXISTS problem_marks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        problem_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS problem_approaches (
        id TEXT PRIMARY KEY,
        problem_id TEXT NOT NULL UNIQUE,
        model TEXT NOT NULL,
        approaches_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS problem_statements (
        id TEXT PRIMARY KEY,
        problem_id TEXT NOT NULL UNIQUE,
        model TEXT NOT NULL,
        statement_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    ensureSqliteColumn(db, "attempts", "user_id", "TEXT");
    ensureSqliteColumn(db, "attempts", "hints_used", "INTEGER NOT NULL DEFAULT 0");
    ensureSqliteColumn(db, "attempts", "code_passed", "INTEGER");
    ensureSqliteColumn(db, "attempts", "confidence", "INTEGER NOT NULL DEFAULT 2");
    ensureSqliteColumn(db, "attempts", "explanation_score", "INTEGER NOT NULL DEFAULT 0");
    ensureSqliteColumn(db, "attempts", "confused_with", "TEXT");
    ensureSqliteColumn(db, "attempts", "input_method", "TEXT NOT NULL DEFAULT 'text'");
    ensureSqliteColumn(db, "attempts", "primary_failure_type", "TEXT");
    ensureSqliteColumn(db, "attempts", "secondary_failure_type", "TEXT");
    ensureSqliteColumn(db, "attempts", "diagnosis_confidence", "REAL");
    ensureSqliteColumn(db, "attempts", "diagnosis_payload", "TEXT");
    ensureSqliteColumn(db, "attempts", "highest_hint_level", "INTEGER");
    ensureSqliteColumn(db, "attempts", "scaffold_level", "INTEGER");
    ensureSqliteColumn(db, "attempts", "remediation_used", "TEXT");
    ensureSqliteColumn(db, "attempts", "retry_succeeded", "INTEGER");
    ensureSqliteColumn(db, "review_items", "user_id", "TEXT");
    ensureSqliteColumn(db, "review_items", "problem_id", "TEXT");
    ensureSqliteColumn(db, "review_items", "due_at", "TEXT");
    ensureSqliteColumn(db, "review_items", "interval_days", "INTEGER NOT NULL DEFAULT 1");
    ensureSqliteColumn(db, "review_items", "repetitions", "INTEGER NOT NULL DEFAULT 0");
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function ensureSqliteColumn(db: DatabaseSync, table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((entry) => entry.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

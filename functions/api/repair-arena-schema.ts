/// <reference types="@cloudflare/workers-types" />

import { json, methodNotAllowed, missingDatabase } from "../_shared/http";

type Env = {
  DB: D1Database;
};

const arenaMigrationSql = `
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id TEXT PRIMARY KEY NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  entry_cost INTEGER NOT NULL CHECK (entry_cost >= 0),
  initial_lives INTEGER NOT NULL CHECK (initial_lives >= 1),
  extra_life_cost INTEGER NOT NULL CHECK (extra_life_cost >= 0),
  max_lives_per_user INTEGER CHECK (max_lives_per_user IS NULL OR max_lives_per_user >= 1),
  max_participants INTEGER CHECK (max_participants IS NULL OR max_participants >= 1),
  unlimited_participants INTEGER NOT NULL DEFAULT 0 CHECK (unlimited_participants IN (0, 1)),
  unlimited_lives INTEGER NOT NULL DEFAULT 0 CHECK (unlimited_lives IN (0, 1)),
  prize_pool_percentage INTEGER NOT NULL CHECK (prize_pool_percentage BETWEEN 0 AND 100),
  site_percentage INTEGER NOT NULL CHECK (site_percentage BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'LOCKED', 'COMPLETED', 'CANCELLED')),
  current_round_number INTEGER NOT NULL DEFAULT 1 CHECK (current_round_number >= 1),
  prize_pool INTEGER NOT NULL DEFAULT 0 CHECK (prize_pool >= 0),
  site_pool INTEGER NOT NULL DEFAULT 0 CHECK (site_pool >= 0),
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments (status);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_at ON tournaments (created_at);

CREATE TABLE IF NOT EXISTS tournament_rounds (
  id TEXT PRIMARY KEY NOT NULL,
  tournament_id TEXT NOT NULL,
  round_number INTEGER NOT NULL CHECK (round_number >= 1),
  deadline_at TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'OPEN', 'LOCKED', 'CALCULATED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  calculated_at TEXT,
  UNIQUE (tournament_id, round_number),
  FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tournament_rounds_tournament ON tournament_rounds (tournament_id, round_number);
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_status ON tournament_rounds (status);

CREATE TABLE IF NOT EXISTS tournament_matches (
  id TEXT PRIMARY KEY NOT NULL,
  tournament_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  is_selectable INTEGER NOT NULL DEFAULT 1 CHECK (is_selectable IN (0, 1)),
  is_locked INTEGER NOT NULL DEFAULT 0 CHECK (is_locked IN (0, 1)),
  result TEXT NOT NULL DEFAULT 'PENDING' CHECK (result IN ('PENDING', 'HOME_WIN', 'DRAW', 'AWAY_WIN', 'POSTPONED', 'CANCELLED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
  FOREIGN KEY (round_id) REFERENCES tournament_rounds (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches (round_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches (tournament_id);

CREATE TABLE IF NOT EXISTS tournament_registrations (
  id TEXT PRIMARY KEY NOT NULL,
  tournament_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LEFT', 'ELIMINATED', 'WINNER')),
  initial_lives INTEGER NOT NULL,
  purchased_lives INTEGER NOT NULL DEFAULT 0,
  entry_cost INTEGER NOT NULL,
  joined_at TEXT NOT NULL,
  left_at TEXT,
  UNIQUE (tournament_id, user_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament ON tournament_registrations (tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user ON tournament_registrations (user_id, status);

CREATE TABLE IF NOT EXISTS tournament_lives (
  id TEXT PRIMARY KEY NOT NULL,
  registration_id TEXT NOT NULL,
  tournament_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  life_number INTEGER NOT NULL CHECK (life_number >= 1),
  status TEXT NOT NULL DEFAULT 'ALIVE' CHECK (status IN ('ALIVE', 'ELIMINATED', 'WINNER')),
  current_cycle INTEGER NOT NULL DEFAULT 1 CHECK (current_cycle >= 1),
  created_at TEXT NOT NULL,
  eliminated_at TEXT,
  UNIQUE (registration_id, life_number),
  FOREIGN KEY (registration_id) REFERENCES tournament_registrations (id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tournament_lives_registration ON tournament_lives (registration_id, status);
CREATE INDEX IF NOT EXISTS idx_tournament_lives_tournament ON tournament_lives (tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_tournament_lives_user ON tournament_lives (user_id, status);

CREATE TABLE IF NOT EXISTS life_selections (
  id TEXT PRIMARY KEY NOT NULL,
  life_id TEXT NOT NULL,
  tournament_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  selected_team TEXT NOT NULL,
  selected_side TEXT NOT NULL CHECK (selected_side IN ('HOME', 'AWAY')),
  cycle_number INTEGER NOT NULL CHECK (cycle_number >= 1),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SURVIVED', 'ELIMINATED', 'VOID')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (life_id, round_id),
  FOREIGN KEY (life_id) REFERENCES tournament_lives (id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
  FOREIGN KEY (round_id) REFERENCES tournament_rounds (id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES tournament_matches (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_life_selections_life ON life_selections (life_id, cycle_number);
CREATE INDEX IF NOT EXISTS idx_life_selections_round ON life_selections (round_id);
CREATE INDEX IF NOT EXISTS idx_life_selections_tournament ON life_selections (tournament_id);

CREATE TABLE IF NOT EXISTS wallet_movements (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  tournament_id TEXT,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('ENTRY_FEE', 'LIFE_PURCHASE', 'REFUND', 'PRIZE', 'ADMIN_ADJUSTMENT')),
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wallet_movements_user ON wallet_movements (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_movements_tournament ON wallet_movements (tournament_id);

CREATE TABLE IF NOT EXISTS arena_events (
  id TEXT PRIMARY KEY NOT NULL,
  tournament_id TEXT,
  user_id TEXT,
  registration_id TEXT,
  life_id TEXT,
  round_id TEXT,
  match_id TEXT,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (registration_id) REFERENCES tournament_registrations (id) ON DELETE SET NULL,
  FOREIGN KEY (life_id) REFERENCES tournament_lives (id) ON DELETE SET NULL,
  FOREIGN KEY (round_id) REFERENCES tournament_rounds (id) ON DELETE SET NULL,
  FOREIGN KEY (match_id) REFERENCES tournament_matches (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_arena_events_tournament ON arena_events (tournament_id, created_at);
CREATE INDEX IF NOT EXISTS idx_arena_events_user ON arena_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_arena_events_type ON arena_events (event_type, created_at);

CREATE TABLE IF NOT EXISTS d1_migrations(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT OR IGNORE INTO d1_migrations (name) VALUES ('0002_create_arena_tables.sql');
`;

function getStatements() {
  return arenaMigrationSql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function cleanupSmokeTestUsers(db: D1Database) {
  const testUsersWhere = "SELECT id FROM users WHERE email LIKE 'fix-test-%@example.com'";

  await db.prepare(`DELETE FROM life_selections WHERE life_id IN (SELECT id FROM tournament_lives WHERE user_id IN (${testUsersWhere}))`).run();
  await db.prepare(`DELETE FROM tournament_lives WHERE user_id IN (${testUsersWhere})`).run();
  await db.prepare(`DELETE FROM tournament_registrations WHERE user_id IN (${testUsersWhere})`).run();
  await db.prepare(`DELETE FROM wallet_movements WHERE user_id IN (${testUsersWhere})`).run();
  await db.prepare(`DELETE FROM user_wallets WHERE user_id IN (${testUsersWhere})`).run();
  await db.prepare(`DELETE FROM user_sessions WHERE user_id IN (${testUsersWhere})`).run();
  await db.prepare(`DELETE FROM arena_events WHERE user_id IN (${testUsersWhere})`).run();

  const result = await db.prepare("DELETE FROM users WHERE email LIKE 'fix-test-%@example.com'").run();

  return result.meta.changes ?? 0;
}

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) {
    return missingDatabase();
  }

  const statements = getStatements();

  for (const statement of statements) {
    await env.DB.prepare(statement).run();
  }

  const cleanedTestUsers = await cleanupSmokeTestUsers(env.DB);

  const tables = await env.DB
    .prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table'
         AND name IN (
           'user_wallets',
           'tournaments',
           'tournament_rounds',
           'tournament_matches',
           'tournament_registrations',
           'tournament_lives',
           'life_selections',
           'wallet_movements',
           'arena_events'
         )
       ORDER BY name`,
    )
    .all<{ name: string }>();

  return json({
    applied: statements.length,
    cleanedTestUsers,
    ok: true,
    tables: tables.results?.map((table) => table.name) ?? [],
  });
};

export const onRequestGet = methodNotAllowed;

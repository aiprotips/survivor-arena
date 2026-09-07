/// <reference types="@cloudflare/workers-types" />

import {
  getArenaError,
  getTeam,
  isDeadlinePassed,
  listTeams,
  normalizeTeamName,
  type ArenaError,
  type MatchResult,
  type SelectionSide,
} from "./arena";
import {
  getAutomaticFixtureMatchday,
  getNextAutomaticFixtureMatchday,
  listAutomaticFixtureCompetitions,
} from "./automatic-fixtures";
import { createUserInboxMessage } from "./messages";
import { findUserByIdentifier } from "./users";

export type FriendsCompetitionStatus = "PENDING" | "ACTIVE" | "LOCKED" | "COMPLETED" | "CANCELLED";
export type FriendsRoundStatus = "PENDING" | "OPEN" | "LOCKED" | "CALCULATED";

export type FriendsCompetitionRow = {
  completed_at: string | null;
  created_at: string;
  current_round_number: number;
  description: string | null;
  id: string;
  invite_code: string;
  fixture_competition_id: string | null;
  name: string;
  owner_user_id: string;
  owner_username?: string;
  published_at: string | null;
  rules: string | null;
  show_popular_picks_before_deadline: number;
  status: FriendsCompetitionStatus;
  updated_at: string;
};

export type FriendsRoundRow = {
  calculated_at: string | null;
  competition_id: string;
  created_at: string;
  deadline_at: string | null;
  fixture_competition_id: string | null;
  fixture_matchday: number | null;
  id: string;
  round_number: number;
  status: FriendsRoundStatus;
  updated_at: string;
};

export type FriendsMatchRow = {
  away_team: string;
  away_team_id: string;
  away_team_logo_url: string | null;
  competition_id: string;
  created_at: string;
  home_team: string;
  home_team_id: string;
  home_team_logo_url: string | null;
  id: string;
  is_active: number;
  result: MatchResult;
  round_id: string;
  updated_at: string;
};

export type FriendsParticipantRow = {
  alive_lives: number;
  eliminated_lives: number;
  email: string;
  id: string;
  joined_at: string;
  removed_at: string | null;
  status: "ACTIVE" | "PENDING" | "REMOVED" | "ELIMINATED" | "WINNER";
  total_lives: number;
  user_code: string;
  user_id: string;
  username: string;
};

export type FriendsLifeRow = {
  competition_id: string;
  created_at: string;
  current_cycle: number;
  eliminated_at: string | null;
  id: string;
  life_number: number;
  participant_id: string;
  status: "ALIVE" | "ELIMINATED" | "WINNER";
  user_id: string;
};

export type FriendsSelectionRow = {
  competition_id: string;
  created_at: string;
  cycle_number: number;
  id: string;
  life_id: string;
  match_id: string;
  round_id: string;
  selected_side: SelectionSide;
  selected_team: string;
  selected_team_id: string;
  status: "PENDING" | "SURVIVED" | "ELIMINATED" | "VOID";
  updated_at: string;
};

export type FriendsUserStatus = "NOT_JOINED" | "PENDING" | "ACTIVE" | "ELIMINATED" | "WINNER" | "SHARED_WINNER";

export type FriendsLifeRoundOutcome = "SURVIVED" | "ELIMINATED" | "VOID" | "NO_CHOICE";

export type FriendsLifeRoundResultRow = {
  competition_id: string;
  created_at: string;
  id: string;
  life_id: string;
  life_number: number;
  match_id: string | null;
  match_label: string | null;
  match_result: MatchResult | null;
  outcome: FriendsLifeRoundOutcome;
  participant_id: string;
  remaining_lives_after_round: number;
  round_id: string;
  selected_side: SelectionSide | null;
  selected_team: string | null;
  selected_team_id: string | null;
  user_id: string;
};

export type FriendsUserUpdateRow = {
  competition_id: string;
  created_at: string;
  detail_json: string | null;
  event_type: string;
  id: string;
  participant_id: string | null;
  round_id: string | null;
  summary: string;
  title: string;
  user_id: string;
  viewed_at: string | null;
};

export type FriendsHistoryLifeReport = {
  life_id: string;
  life_number: number;
  match_label: string | null;
  match_result: MatchResult | null;
  outcome: FriendsLifeRoundOutcome | "NOT_PLAYING" | "PENDING";
  selected_team: string | null;
  selected_team_id: string | null;
  used_teams_after: string[];
};

export type FriendsHistoryParticipantReport = {
  lives: FriendsHistoryLifeReport[];
  participant_id: string;
  remaining_lives_after_round: number;
  status: FriendsParticipantRow["status"];
  user_id: string;
  username: string;
};

export type FriendsHistoryRoundReport = {
  calculated_at: string | null;
  fixture_competition_id: string | null;
  fixture_matchday: number | null;
  participants: FriendsHistoryParticipantReport[];
  round_id: string;
  round_number: number;
  status: FriendsRoundStatus;
};

export type FriendsCompetitionBundle = FriendsCompetitionRow & {
  can_join: boolean;
  current_round: (FriendsRoundRow & { matches: FriendsMatchRow[] }) | null;
  events: Array<{
    created_at: string;
    event_type: string;
    id: string;
    message: string;
    username: string | null;
  }>;
  history_report: FriendsHistoryRoundReport[];
  invitation_count: number;
  is_owner: boolean;
  is_participant: boolean;
  participant: (FriendsParticipantRow & { lives: Array<FriendsLifeRow & { selections: FriendsSelectionRow[] }> }) | null;
  participants: Array<FriendsParticipantRow & { lives: Array<FriendsLifeRow & { selections: FriendsSelectionRow[] }> }>;
  public_choices: Array<{
    life_number: number;
    selected_team: string;
    status: string;
    username: string;
  }>;
  rounds: Array<FriendsRoundRow & { matches: FriendsMatchRow[] }>;
  unviewed_updates: FriendsUserUpdateRow[];
  user_status: FriendsUserStatus;
};

type FriendsMatchInput = {
  awayTeamId: string;
  homeTeamId: string;
  isActive: boolean;
};

type FriendsMatchMode = "automatic" | "manual";

export type FriendsCompetitionInput = {
  deadlineAt: string | null;
  description: string | null;
  fixtureCompetitionId: string | null;
  fixtureMatchday: number | null;
  matchMode: FriendsMatchMode;
  matches: FriendsMatchInput[];
  name: string;
  rules: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function assertFriends(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) {
    throw {
      message,
      status,
    } satisfies ArenaError;
  }
}

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toOptionalText(value: unknown) {
  const text = toText(value);

  return text ? text : null;
}

function toPositiveInteger(value: unknown) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function teamUsageKey(teamId: string, teamName: string) {
  return teamId ? `id:${teamId}` : `name:${teamName.trim().toLowerCase()}`;
}

function isMissingSchema(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return message.includes("no such table") || message.includes("no such column") || message.includes("duplicate column name");
}

function createInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");

  return `FR-${suffix}`;
}

let friendsSchemaReady = false;

async function runSchema(db: D1Database, statement: string) {
  try {
    await db.prepare(statement).run();
  } catch (error) {
    if (!isMissingSchema(error)) {
      throw error;
    }
  }
}

async function ensureFriendsParticipantsPendingStatus(db: D1Database) {
  const row = await db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'friends_participants' LIMIT 1")
    .first<{ sql: string }>();
  const sql = row?.sql ?? "";

  if (!sql.includes("CHECK") || sql.includes("'PENDING'")) {
    return;
  }

  await runSchema(db, "PRAGMA foreign_keys=off");
  await runSchema(db, "DROP TABLE IF EXISTS friends_participants_pending_migration");
  await runSchema(
    db,
    `CREATE TABLE friends_participants_pending_migration (
      id TEXT PRIMARY KEY NOT NULL,
      competition_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'REMOVED', 'ELIMINATED', 'WINNER')),
      joined_at TEXT NOT NULL,
      removed_at TEXT,
      UNIQUE (competition_id, user_id),
      FOREIGN KEY (competition_id) REFERENCES friends_competitions (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`,
  );
  await runSchema(
    db,
    `INSERT INTO friends_participants_pending_migration (
      id, competition_id, user_id, status, joined_at, removed_at
    )
    SELECT id, competition_id, user_id, status, joined_at, removed_at
    FROM friends_participants`,
  );
  await runSchema(db, "DROP TABLE friends_participants");
  await runSchema(db, "ALTER TABLE friends_participants_pending_migration RENAME TO friends_participants");
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_participants_competition ON friends_participants (competition_id, status)");
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_participants_user ON friends_participants (user_id, status)");
  await runSchema(db, "PRAGMA foreign_keys=on");
}

export async function ensureFriendsSchema(db: D1Database) {
  if (friendsSchemaReady) {
    return;
  }

  await listTeams(db);
  await runSchema(
    db,
    `CREATE TABLE IF NOT EXISTS friends_competitions (
      id TEXT PRIMARY KEY NOT NULL,
      owner_user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      rules TEXT,
      invite_code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'PENDING',
      current_round_number INTEGER NOT NULL DEFAULT 1,
      show_popular_picks_before_deadline INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      published_at TEXT,
      completed_at TEXT
    )`,
  );
  await runSchema(db, "ALTER TABLE friends_competitions ADD COLUMN show_popular_picks_before_deadline INTEGER NOT NULL DEFAULT 0");
  await runSchema(db, "ALTER TABLE friends_competitions ADD COLUMN fixture_competition_id TEXT");
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_competitions_owner ON friends_competitions (owner_user_id, status)");
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_competitions_invite_code ON friends_competitions (invite_code)");
  await runSchema(
    db,
    `CREATE TABLE IF NOT EXISTS friends_rounds (
      id TEXT PRIMARY KEY NOT NULL,
      competition_id TEXT NOT NULL,
      round_number INTEGER NOT NULL,
      deadline_at TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      calculated_at TEXT,
      UNIQUE (competition_id, round_number)
    )`,
  );
  await runSchema(db, "ALTER TABLE friends_rounds ADD COLUMN fixture_competition_id TEXT");
  await runSchema(db, "ALTER TABLE friends_rounds ADD COLUMN fixture_matchday INTEGER");
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_rounds_competition ON friends_rounds (competition_id, round_number)");
  await runSchema(
    db,
    `CREATE TABLE IF NOT EXISTS friends_matches (
      id TEXT PRIMARY KEY NOT NULL,
      competition_id TEXT NOT NULL,
      round_id TEXT NOT NULL,
      home_team_id TEXT NOT NULL,
      away_team_id TEXT NOT NULL,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      result TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  );
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_matches_round ON friends_matches (round_id)");
  await runSchema(
    db,
    `CREATE TABLE IF NOT EXISTS friends_invitations (
      id TEXT PRIMARY KEY NOT NULL,
      competition_id TEXT NOT NULL,
      invited_user_id TEXT,
      invited_username TEXT,
      invited_email TEXT,
      created_at TEXT NOT NULL,
      accepted_at TEXT
    )`,
  );
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_invitations_competition ON friends_invitations (competition_id)");
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_invitations_user ON friends_invitations (invited_user_id)");
  await runSchema(
    db,
    `CREATE TABLE IF NOT EXISTS friends_participants (
      id TEXT PRIMARY KEY NOT NULL,
      competition_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      joined_at TEXT NOT NULL,
      removed_at TEXT,
      UNIQUE (competition_id, user_id)
    )`,
  );
  await ensureFriendsParticipantsPendingStatus(db);
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_participants_competition ON friends_participants (competition_id, status)");
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_participants_user ON friends_participants (user_id, status)");
  await runSchema(
    db,
    `CREATE TABLE IF NOT EXISTS friends_lives (
      id TEXT PRIMARY KEY NOT NULL,
      participant_id TEXT NOT NULL,
      competition_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      life_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'ALIVE',
      current_cycle INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      eliminated_at TEXT,
      UNIQUE (participant_id, life_number)
    )`,
  );
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_lives_participant ON friends_lives (participant_id, status)");
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_lives_competition ON friends_lives (competition_id, status)");
  await runSchema(
    db,
    `CREATE TABLE IF NOT EXISTS friends_selections (
      id TEXT PRIMARY KEY NOT NULL,
      life_id TEXT NOT NULL,
      competition_id TEXT NOT NULL,
      round_id TEXT NOT NULL,
      match_id TEXT NOT NULL,
      selected_team_id TEXT NOT NULL,
      selected_team TEXT NOT NULL,
      selected_side TEXT NOT NULL,
      cycle_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  );
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_selections_life ON friends_selections (life_id, round_id)");
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_selections_round ON friends_selections (round_id)");
  await runSchema(
    db,
    `CREATE TABLE IF NOT EXISTS friends_events (
      id TEXT PRIMARY KEY NOT NULL,
      competition_id TEXT,
      user_id TEXT,
      participant_id TEXT,
      life_id TEXT,
      round_id TEXT,
      match_id TEXT,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    )`,
  );
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_events_competition ON friends_events (competition_id, created_at)");
  await runSchema(
    db,
    `CREATE TABLE IF NOT EXISTS friends_life_round_results (
      id TEXT PRIMARY KEY NOT NULL,
      competition_id TEXT NOT NULL,
      round_id TEXT NOT NULL,
      participant_id TEXT NOT NULL,
      life_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      life_number INTEGER NOT NULL,
      selected_team_id TEXT,
      selected_team TEXT,
      selected_side TEXT,
      match_id TEXT,
      match_label TEXT,
      match_result TEXT,
      outcome TEXT NOT NULL CHECK (outcome IN ('SURVIVED', 'ELIMINATED', 'VOID', 'NO_CHOICE')),
      remaining_lives_after_round INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE (round_id, life_id)
    )`,
  );
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_life_round_results_competition ON friends_life_round_results (competition_id, round_id)");
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_life_round_results_life ON friends_life_round_results (life_id, round_id)");
  await runSchema(
    db,
    `CREATE TABLE IF NOT EXISTS friends_user_updates (
      id TEXT PRIMARY KEY NOT NULL,
      competition_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      participant_id TEXT,
      round_id TEXT,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      detail_json TEXT,
      created_at TEXT NOT NULL,
      viewed_at TEXT
    )`,
  );
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_user_updates_user_viewed ON friends_user_updates (user_id, viewed_at, created_at)");
  await runSchema(db, "CREATE INDEX IF NOT EXISTS idx_friends_user_updates_competition_user ON friends_user_updates (competition_id, user_id, created_at)");

  friendsSchemaReady = true;
}

export function parseFriendsCompetitionInput(body: Record<string, unknown>): FriendsCompetitionInput {
  const name = toText(body.name);
  const rawMatchMode = toText(body.matchMode ?? body.match_mode ?? body.insertMode ?? body.insert_mode).toLowerCase();
  const matchMode: FriendsMatchMode = rawMatchMode === "automatic" ? "automatic" : "manual";
  const fixtureCompetitionId = toOptionalText(body.fixtureCompetitionId ?? body.fixture_competition_id);
  const fixtureMatchday = toPositiveInteger(body.fixtureMatchday ?? body.fixture_matchday);
  const matchesInput = Array.isArray(body.matches) ? body.matches : [];
  const matches = matchesInput.map((match) => {
    const item = match && typeof match === "object" ? match as Record<string, unknown> : {};

    return {
      awayTeamId: toText(item.awayTeamId ?? item.away_team_id),
      homeTeamId: toText(item.homeTeamId ?? item.home_team_id),
      isActive: item.isActive !== false,
    };
  });

  assertFriends(name.length >= 3, "Inserisci un nome competizione valido.");
  if (matchMode === "automatic") {
    assertFriends(fixtureCompetitionId, "Seleziona una competizione automatica.");
    assertFriends(fixtureMatchday, "Seleziona una giornata valida.");
  } else {
    assertFriends(matches.length > 0, "Aggiungi almeno un match al round iniziale.");
  }

  return {
    deadlineAt: toOptionalText(body.deadlineAt ?? body.deadline_at),
    description: toOptionalText(body.description),
    fixtureCompetitionId,
    fixtureMatchday,
    matchMode,
    matches,
    name,
    rules: toOptionalText(body.rules),
  };
}

export function listFriendsAutomaticCompetitions() {
  return listAutomaticFixtureCompetitions();
}

async function buildAutomaticMatchInputs(
  db: D1Database,
  fixtureCompetitionId: string | null,
  fixtureMatchday: number | null,
) {
  assertFriends(fixtureCompetitionId, "Seleziona una competizione automatica.");
  assertFriends(fixtureMatchday, "Seleziona una giornata valida.");

  const fixture = getAutomaticFixtureMatchday(fixtureCompetitionId, fixtureMatchday);
  assertFriends(fixture, "Giornata automatica non trovata.", 404);

  const teamRows = await listTeams(db);
  const rowsByNormalizedName = new Map(teamRows.map((team) => [normalizeTeamName(team.name), team]));
  const seedBySlug = new Map(fixture.competition.teams.map((team) => [team.slug, team]));

  return fixture.matchday.matches.map((match) => {
    const homeSeed = seedBySlug.get(match.homeTeamSlug);
    const awaySeed = seedBySlug.get(match.awayTeamSlug);

    assertFriends(homeSeed && awaySeed, "Squadre automatiche non trovate nel calendario.", 500);

    const homeTeam = rowsByNormalizedName.get(normalizeTeamName(homeSeed.name));
    const awayTeam = rowsByNormalizedName.get(normalizeTeamName(awaySeed.name));

    assertFriends(homeTeam && awayTeam, "Squadre automatiche non presenti nel catalogo.", 500);

    return {
      awayTeamId: awayTeam.id,
      homeTeamId: homeTeam.id,
      isActive: true,
    } satisfies FriendsMatchInput;
  });
}

async function resolveCompetitionMatches(db: D1Database, input: FriendsCompetitionInput) {
  return input.matchMode === "automatic"
    ? buildAutomaticMatchInputs(db, input.fixtureCompetitionId, input.fixtureMatchday)
    : input.matches;
}

export function getFriendsError(error: unknown, fallback = "Operazione Friends non riuscita.") {
  return getArenaError(error, fallback);
}

async function resolveTeams(db: D1Database, homeTeamId: string, awayTeamId: string) {
  const homeTeam = await getTeam(db, homeTeamId);
  const awayTeam = await getTeam(db, awayTeamId);

  assertFriends(homeTeam && awayTeam, "Seleziona squadre valide dal catalogo.");
  assertFriends(homeTeam.id !== awayTeam.id, "Le squadre del match devono essere diverse.");

  return {
    awayTeam,
    homeTeam,
  };
}

async function logFriendsEvent(
  db: D1Database,
  input: {
    competitionId?: string | null;
    eventType: string;
    lifeId?: string | null;
    matchId?: string | null;
    message: string;
    metadata?: Record<string, unknown>;
    participantId?: string | null;
    roundId?: string | null;
    userId?: string | null;
  },
) {
  await db
    .prepare(
      `INSERT INTO friends_events (
        id, competition_id, user_id, participant_id, life_id, round_id, match_id,
        event_type, message, metadata_json, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
    )
    .bind(
      crypto.randomUUID(),
      input.competitionId ?? null,
      input.userId ?? null,
      input.participantId ?? null,
      input.lifeId ?? null,
      input.roundId ?? null,
      input.matchId ?? null,
      input.eventType,
      input.message,
      input.metadata ? JSON.stringify(input.metadata) : null,
      nowIso(),
    )
    .run();
}

export async function createFriendsCompetition(db: D1Database, input: FriendsCompetitionInput, ownerUserId: string) {
  await ensureFriendsSchema(db);
  assertFriends(input.deadlineAt, "Imposta una deadline per creare la competizione.");
  const matches = await resolveCompetitionMatches(db, input);
  assertFriends(matches.length > 0, "Aggiungi almeno un match al round iniziale.");

  const now = nowIso();
  const competitionId = crypto.randomUUID();
  const roundId = crypto.randomUUID();
  const status: FriendsCompetitionStatus = "ACTIVE";
  const roundStatus: FriendsRoundStatus = "OPEN";

  await db
    .prepare(
      `INSERT INTO friends_competitions (
        id, owner_user_id, name, description, rules, invite_code, status, current_round_number,
        fixture_competition_id, created_at, updated_at, published_at, completed_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8, ?9, ?9, ?10, NULL)`,
    )
    .bind(
      competitionId,
      ownerUserId,
      input.name,
      input.description,
      input.rules,
      createInviteCode(),
      status,
      input.matchMode === "automatic" ? input.fixtureCompetitionId : null,
      now,
      now,
    )
    .run();

  await db
    .prepare(
      `INSERT INTO friends_rounds (
        id, competition_id, round_number, deadline_at, status, fixture_competition_id, fixture_matchday,
        created_at, updated_at, calculated_at
      ) VALUES (?1, ?2, 1, ?3, ?4, ?5, ?6, ?7, ?7, NULL)`,
    )
    .bind(
      roundId,
      competitionId,
      input.deadlineAt,
      roundStatus,
      input.matchMode === "automatic" ? input.fixtureCompetitionId : null,
      input.matchMode === "automatic" ? input.fixtureMatchday : null,
      now,
    )
    .run();

  for (const match of matches) {
    await insertFriendsMatch(db, {
      awayTeamId: match.awayTeamId,
      competitionId,
      homeTeamId: match.homeTeamId,
      isActive: match.isActive,
      roundId,
    });
  }

  await addFriendsParticipant(db, competitionId, ownerUserId, 1);
  await logFriendsEvent(db, {
    competitionId,
    eventType: "friends_competition_created",
    message: `Competizione Friends creata: ${input.name}`,
    roundId,
    userId: ownerUserId,
  });

  return getFriendsCompetitionBundle(db, competitionId, ownerUserId);
}

async function insertFriendsMatch(
  db: D1Database,
  input: {
    awayTeamId: string;
    competitionId: string;
    homeTeamId: string;
    isActive: boolean;
    roundId: string;
  },
) {
  const { awayTeam, homeTeam } = await resolveTeams(db, input.homeTeamId, input.awayTeamId);
  const now = nowIso();

  await db
    .prepare(
      `INSERT INTO friends_matches (
        id, competition_id, round_id, home_team_id, away_team_id, home_team, away_team,
        is_active, result, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'PENDING', ?9, ?9)`,
    )
    .bind(
      crypto.randomUUID(),
      input.competitionId,
      input.roundId,
      homeTeam.id,
      awayTeam.id,
      homeTeam.name,
      awayTeam.name,
      input.isActive ? 1 : 0,
      now,
    )
    .run();
}

export async function listFriendsCompetitions(db: D1Database, userId: string) {
  await ensureFriendsSchema(db);

  const rows = await db
    .prepare(
      `SELECT DISTINCT c.*, owner.username AS owner_username
       FROM friends_competitions c
       INNER JOIN users owner ON owner.id = c.owner_user_id
       LEFT JOIN friends_participants p ON p.competition_id = c.id AND p.user_id = ?1 AND p.status != 'REMOVED'
       LEFT JOIN friends_invitations i ON i.competition_id = c.id
       LEFT JOIN users invited ON invited.id = ?1
       WHERE c.owner_user_id = ?1
          OR p.id IS NOT NULL
          OR i.invited_user_id = ?1
          OR LOWER(i.invited_username) = LOWER(invited.username)
          OR LOWER(i.invited_email) = LOWER(invited.email)
       ORDER BY c.updated_at DESC`,
    )
    .bind(userId)
    .all<FriendsCompetitionRow>();

  return Promise.all((rows.results ?? []).map((row) => getFriendsCompetitionBundle(db, row.id, userId)));
}

export async function listFriendsTeams(db: D1Database) {
  return listTeams(db);
}

async function getFriendsCompetition(db: D1Database, competitionId: string) {
  await ensureFriendsSchema(db);

  return db
    .prepare(
      `SELECT c.*, owner.username AS owner_username
       FROM friends_competitions c
       INNER JOIN users owner ON owner.id = c.owner_user_id
       WHERE c.id = ?1
       LIMIT 1`,
    )
    .bind(competitionId)
    .first<FriendsCompetitionRow>();
}

async function listFriendsRounds(db: D1Database, competitionId: string) {
  const rows = await db
    .prepare(
      `SELECT
         id,
         competition_id,
         round_number,
         deadline_at,
         status,
         created_at,
         updated_at,
         calculated_at,
         fixture_competition_id,
         fixture_matchday
       FROM friends_rounds
       WHERE competition_id = ?1
       ORDER BY round_number ASC`,
    )
    .bind(competitionId)
    .all<FriendsRoundRow>();

  return rows.results ?? [];
}

async function listFriendsMatches(db: D1Database, roundId: string) {
  const rows = await db
    .prepare(
      `SELECT
        m.id,
        m.competition_id,
        m.round_id,
        m.home_team_id,
        m.away_team_id,
        m.home_team,
        m.away_team,
        home.logo_url AS home_team_logo_url,
        away.logo_url AS away_team_logo_url,
        m.is_active,
        m.result,
        m.created_at,
        m.updated_at
       FROM friends_matches m
       LEFT JOIN teams home ON home.id = m.home_team_id
       LEFT JOIN teams away ON away.id = m.away_team_id
       WHERE m.round_id = ?1
       ORDER BY m.created_at ASC`,
    )
    .bind(roundId)
    .all<FriendsMatchRow>();

  return rows.results ?? [];
}

async function getFriendsRound(db: D1Database, roundId: string) {
  return db
    .prepare(
      `SELECT
         id,
         competition_id,
         round_number,
         deadline_at,
         status,
         created_at,
         updated_at,
         calculated_at,
         fixture_competition_id,
         fixture_matchday
       FROM friends_rounds
       WHERE id = ?1
       LIMIT 1`,
    )
    .bind(roundId)
    .first<FriendsRoundRow>();
}

async function getCurrentFriendsRound(db: D1Database, competition: FriendsCompetitionRow) {
  return db
    .prepare(
      `SELECT
         id,
         competition_id,
         round_number,
         deadline_at,
         status,
         created_at,
         updated_at,
         calculated_at,
         fixture_competition_id,
         fixture_matchday
       FROM friends_rounds
       WHERE competition_id = ?1 AND round_number = ?2
       LIMIT 1`,
    )
    .bind(competition.id, competition.current_round_number)
    .first<FriendsRoundRow>();
}

function canChangeChoices(round: FriendsRoundRow | null) {
  return !!round && round.status === "OPEN" && !isDeadlinePassed(round.deadline_at);
}

async function getFriendsMatch(db: D1Database, matchId: string) {
  return db
    .prepare(
      `SELECT
        m.id,
        m.competition_id,
        m.round_id,
        m.home_team_id,
        m.away_team_id,
        m.home_team,
        m.away_team,
        home.logo_url AS home_team_logo_url,
        away.logo_url AS away_team_logo_url,
        m.is_active,
        m.result,
        m.created_at,
        m.updated_at
       FROM friends_matches m
       LEFT JOIN teams home ON home.id = m.home_team_id
       LEFT JOIN teams away ON away.id = m.away_team_id
       WHERE m.id = ?1
       LIMIT 1`,
    )
    .bind(matchId)
    .first<FriendsMatchRow>();
}

async function getFriendsParticipant(db: D1Database, competitionId: string, userId: string) {
  return db
    .prepare(
      `SELECT
        p.id,
        p.competition_id,
        p.user_id,
        p.status,
        p.joined_at,
        p.removed_at,
        u.username,
        u.email,
        u.user_code,
        COUNT(l.id) AS total_lives,
        COALESCE(SUM(CASE WHEN l.status IN ('ALIVE', 'WINNER') THEN 1 ELSE 0 END), 0) AS alive_lives,
        COALESCE(SUM(CASE WHEN l.status = 'ELIMINATED' THEN 1 ELSE 0 END), 0) AS eliminated_lives
       FROM friends_participants p
       INNER JOIN users u ON u.id = p.user_id
       LEFT JOIN friends_lives l ON l.participant_id = p.id
       WHERE p.competition_id = ?1 AND p.user_id = ?2
       GROUP BY p.id
       LIMIT 1`,
    )
    .bind(competitionId, userId)
    .first<FriendsParticipantRow>();
}

async function listFriendsParticipants(db: D1Database, competitionId: string) {
  const rows = await db
    .prepare(
      `SELECT
        p.id,
        p.competition_id,
        p.user_id,
        p.status,
        p.joined_at,
        p.removed_at,
        u.username,
        u.email,
        u.user_code,
        COUNT(l.id) AS total_lives,
        COALESCE(SUM(CASE WHEN l.status IN ('ALIVE', 'WINNER') THEN 1 ELSE 0 END), 0) AS alive_lives,
        COALESCE(SUM(CASE WHEN l.status = 'ELIMINATED' THEN 1 ELSE 0 END), 0) AS eliminated_lives
       FROM friends_participants p
       INNER JOIN users u ON u.id = p.user_id
       LEFT JOIN friends_lives l ON l.participant_id = p.id
       WHERE p.competition_id = ?1
       GROUP BY p.id
       ORDER BY p.joined_at ASC`,
    )
    .bind(competitionId)
    .all<FriendsParticipantRow>();

  return Promise.all(
    (rows.results ?? []).map(async (participant) => ({
      ...participant,
      lives: await listParticipantLives(db, participant.id),
    })),
  );
}

async function listParticipantLives(db: D1Database, participantId: string) {
  const rows = await db
    .prepare(
      `SELECT id, participant_id, competition_id, user_id, life_number, status, current_cycle, created_at, eliminated_at
       FROM friends_lives
       WHERE participant_id = ?1
       ORDER BY life_number ASC`,
    )
    .bind(participantId)
    .all<FriendsLifeRow>();
  const lives = rows.results ?? [];
  const selections = await listSelectionsForLives(db, lives.map((life) => life.id));

  return lives.map((life) => ({
    ...life,
    selections: selections.filter((selection) => selection.life_id === life.id),
  }));
}

async function listSelectionsForLives(db: D1Database, lifeIds: string[]) {
  if (lifeIds.length === 0) {
    return [];
  }

  const placeholders = lifeIds.map((_, index) => `?${index + 1}`).join(", ");
  const rows = await db
    .prepare(
      `SELECT id, life_id, competition_id, round_id, match_id, selected_team_id, selected_team,
        selected_side, cycle_number, status, created_at, updated_at
       FROM friends_selections
       WHERE life_id IN (${placeholders})
       ORDER BY created_at ASC`,
    )
    .bind(...lifeIds)
    .all<FriendsSelectionRow>();

  return rows.results ?? [];
}

async function listFriendsEvents(db: D1Database, competitionId: string) {
  const rows = await db
    .prepare(
      `SELECT e.id, e.event_type, e.message, e.created_at, u.username
       FROM friends_events e
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.competition_id = ?1
       ORDER BY e.created_at DESC
       LIMIT 80`,
    )
    .bind(competitionId)
    .all<{
      created_at: string;
      event_type: string;
      id: string;
      message: string;
      username: string | null;
    }>();

  return rows.results ?? [];
}

async function listPublicChoices(db: D1Database, roundId: string) {
  const rows = await db
    .prepare(
      `SELECT u.username, l.life_number, s.selected_team, s.status
       FROM friends_selections s
       INNER JOIN friends_lives l ON l.id = s.life_id
       INNER JOIN users u ON u.id = l.user_id
       WHERE s.round_id = ?1
       ORDER BY u.username ASC, l.life_number ASC`,
    )
    .bind(roundId)
    .all<{
      life_number: number;
      selected_team: string;
      status: string;
      username: string;
    }>();

  return rows.results ?? [];
}

async function getInvitationCount(db: D1Database, competitionId: string) {
  const row = await db
    .prepare("SELECT COUNT(*) AS count FROM friends_invitations WHERE competition_id = ?1")
    .bind(competitionId)
    .first<{ count: number }>();

  return row?.count ?? 0;
}

async function listFriendsUserUpdatesForCompetition(db: D1Database, competitionId: string, userId: string) {
  const rows = await db
    .prepare(
      `SELECT id, competition_id, user_id, participant_id, round_id, event_type, title, summary, detail_json, created_at, viewed_at
       FROM friends_user_updates
       WHERE competition_id = ?1 AND user_id = ?2 AND viewed_at IS NULL
       ORDER BY created_at ASC`,
    )
    .bind(competitionId, userId)
    .all<FriendsUserUpdateRow>();

  return rows.results ?? [];
}

export type FriendsUserUpdateSummary = FriendsUserUpdateRow & {
  competition_name: string;
};

export async function listUnviewedFriendsUserUpdates(db: D1Database, userId: string) {
  await ensureFriendsSchema(db);

  const rows = await db
    .prepare(
      `SELECT
         u.id,
         u.competition_id,
         u.user_id,
         u.participant_id,
         u.round_id,
         u.event_type,
         u.title,
         u.summary,
         u.detail_json,
         u.created_at,
         u.viewed_at,
         c.name AS competition_name
       FROM friends_user_updates u
       INNER JOIN friends_competitions c ON c.id = u.competition_id
       WHERE u.user_id = ?1 AND u.viewed_at IS NULL
       ORDER BY u.created_at ASC
       LIMIT 40`,
    )
    .bind(userId)
    .all<FriendsUserUpdateSummary>();

  return rows.results ?? [];
}

export async function markFriendsUserUpdatesViewed(
  db: D1Database,
  input: {
    competitionId?: string | null;
    ids?: string[];
    userId: string;
  },
) {
  await ensureFriendsSchema(db);

  const now = nowIso();

  if (input.competitionId) {
    await db
      .prepare(
        `UPDATE friends_user_updates
         SET viewed_at = COALESCE(viewed_at, ?1)
         WHERE user_id = ?2 AND competition_id = ?3 AND viewed_at IS NULL`,
      )
      .bind(now, input.userId, input.competitionId)
      .run();

    return { ok: true };
  }

  const ids = (input.ids ?? []).filter((id) => typeof id === "string" && id.trim().length > 0).slice(0, 80);
  assertFriends(ids.length > 0, "Nessun aggiornamento da segnare come visto.");
  const placeholders = ids.map((_, index) => `?${index + 3}`).join(", ");

  await db
    .prepare(
      `UPDATE friends_user_updates
       SET viewed_at = COALESCE(viewed_at, ?1)
       WHERE user_id = ?2 AND id IN (${placeholders}) AND viewed_at IS NULL`,
    )
    .bind(now, input.userId, ...ids)
    .run();

  return { ok: true };
}

async function createFriendsUserUpdate(
  db: D1Database,
  input: {
    competitionId: string;
    detail?: Record<string, unknown>;
    eventType: string;
    participantId?: string | null;
    roundId?: string | null;
    summary: string;
    title: string;
    userId: string;
  },
) {
  await db
    .prepare(
      `INSERT INTO friends_user_updates (
        id, competition_id, user_id, participant_id, round_id, event_type, title, summary, detail_json, created_at, viewed_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, NULL)`,
    )
    .bind(
      crypto.randomUUID(),
      input.competitionId,
      input.userId,
      input.participantId ?? null,
      input.roundId ?? null,
      input.eventType,
      input.title,
      input.summary,
      input.detail ? JSON.stringify(input.detail) : null,
      nowIso(),
    )
    .run();
}

async function listLifeRoundResults(db: D1Database, competitionId: string, roundId?: string) {
  const query = roundId
    ? `SELECT id, competition_id, round_id, participant_id, life_id, user_id, life_number,
         selected_team_id, selected_team, selected_side, match_id, match_label, match_result,
         outcome, remaining_lives_after_round, created_at
       FROM friends_life_round_results
       WHERE competition_id = ?1 AND round_id = ?2
       ORDER BY life_number ASC`
    : `SELECT id, competition_id, round_id, participant_id, life_id, user_id, life_number,
         selected_team_id, selected_team, selected_side, match_id, match_label, match_result,
         outcome, remaining_lives_after_round, created_at
       FROM friends_life_round_results
       WHERE competition_id = ?1
       ORDER BY created_at ASC, life_number ASC`;

  const statement = db.prepare(query);
  const rows = roundId
    ? await statement.bind(competitionId, roundId).all<FriendsLifeRoundResultRow>()
    : await statement.bind(competitionId).all<FriendsLifeRoundResultRow>();

  return rows.results ?? [];
}

function getFriendsUserStatus(
  competition: FriendsCompetitionRow,
  participant: FriendsParticipantRow | null | undefined,
  participants: FriendsParticipantRow[],
): FriendsUserStatus {
  if (!participant) {
    return "NOT_JOINED";
  }

  if (participant.status === "PENDING") {
    return "PENDING";
  }

  if (participant.status === "WINNER") {
    const winners = participants.filter((item) => item.status === "WINNER").length;

    return winners > 1 ? "SHARED_WINNER" : "WINNER";
  }

  if (participant.status === "ELIMINATED") {
    return "ELIMINATED";
  }

  if (competition.status === "COMPLETED") {
    return participant.alive_lives > 0 ? "WINNER" : "ELIMINATED";
  }

  return "ACTIVE";
}

function matchLabel(match: FriendsMatchRow | null | undefined) {
  return match ? `${match.home_team} - ${match.away_team}` : null;
}

function matchResultText(result: MatchResult | null | undefined) {
  if (!result || result === "PENDING") {
    return "Risultato non inserito";
  }

  if (result === "HOME_WIN") {
    return "Vittoria casa";
  }

  if (result === "AWAY_WIN") {
    return "Vittoria trasferta";
  }

  if (result === "DRAW") {
    return "Pareggio";
  }

  if (result === "POSTPONED") {
    return "Rinviata";
  }

  return "Annullata";
}

function updateLifeSummary(result: FriendsLifeRoundResultRow) {
  return {
    lifeId: result.life_id,
    lifeNumber: result.life_number,
    matchLabel: result.match_label,
    matchResult: result.match_result,
    matchResultLabel: matchResultText(result.match_result),
    outcome: result.outcome,
    selectedTeam: result.selected_team,
  };
}

function getUpdateSummaryFromResults(results: FriendsLifeRoundResultRow[], remainingLives: number) {
  const eliminated = results.filter((result) => result.outcome === "ELIMINATED" || result.outcome === "NO_CHOICE").length;
  const survived = results.filter((result) => result.outcome === "SURVIVED" || result.outcome === "VOID").length;

  if (eliminated > 0 && survived > 0) {
    return `Round concluso: ${survived} vite sopravvissute, ${eliminated} eliminate. Ti restano ${remainingLives} vite.`;
  }

  if (eliminated > 0 && remainingLives === 0) {
    return "Tutte le tue vite sono state eliminate. Il torneo pero' e' ancora in corso.";
  }

  if (eliminated > 0) {
    return `Hai perso ${eliminated} vite. Ti restano ${remainingLives} vite in gioco.`;
  }

  return `Le tue vite hanno superato il round. Ti restano ${remainingLives} vite in gioco.`;
}

async function buildFriendsHistoryReport(
  db: D1Database,
  competitionId: string,
  rounds: Array<FriendsRoundRow & { matches: FriendsMatchRow[] }>,
  participants: Array<FriendsParticipantRow & { lives: Array<FriendsLifeRow & { selections: FriendsSelectionRow[] }> }>,
) {
  const storedResults = await listLifeRoundResults(db, competitionId);
  const roundNumbers = new Map(rounds.map((round) => [round.id, round.round_number]));

  return rounds.map((round) => {
    const storedRoundResults = storedResults.filter((result) => result.round_id === round.id);

    return {
      calculated_at: round.calculated_at,
      fixture_competition_id: round.fixture_competition_id,
      fixture_matchday: round.fixture_matchday,
      participants: participants
        .filter((participant) => participant.status !== "REMOVED")
        .map((participant) => {
          const participantResults = storedRoundResults.filter((result) => result.participant_id === participant.id);
          const resultsByLifeId = new Map(participantResults.map((result) => [result.life_id, result]));
          const lives = participant.lives.map((life) => {
            const storedResult = resultsByLifeId.get(life.id);
            const selection = life.selections.find((item) => item.round_id === round.id);
            const match = selection ? round.matches.find((item) => item.id === selection.match_id) : null;

            if (storedResult) {
              return {
                life_id: storedResult.life_id,
                life_number: storedResult.life_number,
                match_label: storedResult.match_label,
                match_result: storedResult.match_result,
                outcome: storedResult.outcome,
                selected_team: storedResult.selected_team,
                selected_team_id: storedResult.selected_team_id,
                used_teams_after: life.selections
                  .filter((item) => (roundNumbers.get(item.round_id) ?? 0) <= round.round_number && item.status !== "VOID")
                  .map((item) => item.selected_team),
              } satisfies FriendsHistoryLifeReport;
            }

            return {
              life_id: life.id,
              life_number: life.life_number,
              match_label: matchLabel(match),
              match_result: match?.result ?? null,
              outcome: selection
                ? selection.status === "VOID"
                  ? "VOID"
                  : selection.status === "SURVIVED"
                    ? "SURVIVED"
                    : selection.status === "ELIMINATED"
                      ? "ELIMINATED"
                      : "PENDING"
                : storedRoundResults.length > 0 && round.status === "CALCULATED"
                  ? "NOT_PLAYING"
                  : "NO_CHOICE",
              selected_team: selection?.selected_team ?? null,
              selected_team_id: selection?.selected_team_id ?? null,
              used_teams_after: life.selections
                .filter((item) => (roundNumbers.get(item.round_id) ?? 0) <= round.round_number && item.status !== "VOID")
                .map((item) => item.selected_team),
            } satisfies FriendsHistoryLifeReport;
          });
          const computedRemainingLives = lives.filter((life) => life.outcome === "SURVIVED" || life.outcome === "VOID" || life.outcome === "PENDING").length;
          const remainingLives = participantResults[0]?.remaining_lives_after_round ?? (round.status === "CALCULATED" ? computedRemainingLives : participant.alive_lives);

          return {
            lives,
            participant_id: participant.id,
            remaining_lives_after_round: remainingLives,
            status: participant.status,
            user_id: participant.user_id,
            username: participant.username,
          };
        }),
      round_id: round.id,
      round_number: round.round_number,
      status: round.status,
    } satisfies FriendsHistoryRoundReport;
  });
}

async function canUserJoin(db: D1Database, competition: FriendsCompetitionRow, userId: string) {
  if (competition.owner_user_id === userId) {
    return true;
  }

  const row = await db
    .prepare(
      `SELECT i.id
       FROM friends_invitations i
       INNER JOIN users u ON u.id = ?2
       WHERE i.competition_id = ?1
         AND (
          i.invited_user_id = ?2
          OR LOWER(i.invited_username) = LOWER(u.username)
          OR LOWER(i.invited_email) = LOWER(u.email)
         )
       LIMIT 1`,
    )
    .bind(competition.id, userId)
    .first<{ id: string }>();

  return !!row;
}

export async function getFriendsCompetitionBundle(
  db: D1Database,
  competitionId: string,
  userId: string,
): Promise<FriendsCompetitionBundle> {
  await ensureFriendsSchema(db);

  const competition = await getFriendsCompetition(db, competitionId);
  assertFriends(competition, "Competizione Friends non trovata.", 404);

  const isOwner = competition.owner_user_id === userId;
  const [rounds, participants, participant, events, invitationCount] = await Promise.all([
    listFriendsRounds(db, competition.id),
    listFriendsParticipants(db, competition.id),
    getFriendsParticipant(db, competition.id, userId),
    listFriendsEvents(db, competition.id),
    getInvitationCount(db, competition.id),
  ]);
  const hydratedRounds = await Promise.all(
    rounds.map(async (round) => ({
      ...round,
      matches: await listFriendsMatches(db, round.id),
    })),
  );
  const currentRound = hydratedRounds.find((round) => round.round_number === competition.current_round_number) ?? null;
  const canShowPopularChoices = !!currentRound && (competition.show_popular_picks_before_deadline === 1 || !canChangeChoices(currentRound));
  const publicChoices = canShowPopularChoices ? await listPublicChoices(db, currentRound.id) : [];
  const activeParticipant = participant?.status === "REMOVED" ? null : participant;
  const canJoin = competition.status === "ACTIVE" && !activeParticipant && await canUserJoin(db, competition, userId);

  assertFriends(isOwner || activeParticipant || canJoin, "Non hai accesso a questa competizione Friends.", 403);
  const hydratedParticipant = activeParticipant
    ? participants.find((item) => item.id === activeParticipant.id) ?? {
        ...activeParticipant,
        lives: await listParticipantLives(db, activeParticipant.id),
      }
    : null;
  const [historyReport, unviewedUpdates] = await Promise.all([
    buildFriendsHistoryReport(db, competition.id, hydratedRounds, participants),
    activeParticipant ? listFriendsUserUpdatesForCompetition(db, competition.id, userId) : Promise.resolve([]),
  ]);

  return {
    ...competition,
    can_join: canJoin,
    current_round: currentRound,
    events,
    history_report: historyReport,
    invitation_count: invitationCount,
    is_owner: isOwner,
    is_participant: !!activeParticipant,
    participant: hydratedParticipant,
    participants,
    public_choices: publicChoices,
    rounds: hydratedRounds,
    unviewed_updates: unviewedUpdates,
    user_status: getFriendsUserStatus(competition, hydratedParticipant, participants),
  };
}

async function addFriendsParticipant(
  db: D1Database,
  competitionId: string,
  userId: string,
  livesToAssign = 1,
  status: FriendsParticipantRow["status"] = "ACTIVE",
) {
  const existing = await getFriendsParticipant(db, competitionId, userId);
  const now = nowIso();
  const participantId = existing?.id ?? crypto.randomUUID();

  if (existing && existing.status !== "REMOVED") {
    return existing.id;
  }

  if (existing) {
    await db
      .prepare("UPDATE friends_participants SET status = ?1, removed_at = NULL WHERE id = ?2")
      .bind(status, existing.id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO friends_participants (id, competition_id, user_id, status, joined_at, removed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, NULL)`,
      )
      .bind(participantId, competitionId, userId, status, now)
      .run();
  }

  await setParticipantLives(db, participantId, livesToAssign);

  return participantId;
}

export async function joinFriendsCompetition(db: D1Database, competitionId: string, userId: string) {
  await ensureFriendsSchema(db);

  const competition = await getFriendsCompetition(db, competitionId);
  assertFriends(competition, "Competizione Friends non trovata.", 404);
  assertFriends(competition.status === "ACTIVE", "Competizione non attiva.", 409);
  assertFriends(await canUserJoin(db, competition, userId), "Serve un invito per partecipare.", 403);
  const existing = await getFriendsParticipant(db, competitionId, userId);
  assertFriends(!existing || existing.status === "REMOVED", existing?.status === "PENDING" ? "Richiesta già in attesa di conferma." : "Sei già in questa competizione.", 409);

  const participantId = await addFriendsParticipant(db, competitionId, userId, 1, "PENDING");

  await db
    .prepare(
      `UPDATE friends_invitations
       SET accepted_at = COALESCE(accepted_at, ?1)
       WHERE competition_id = ?2
         AND (
          invited_user_id = ?3
          OR invited_username = (SELECT username FROM users WHERE id = ?3)
          OR invited_email = (SELECT email FROM users WHERE id = ?3)
         )`,
    )
    .bind(nowIso(), competitionId, userId)
    .run();

  await logFriendsEvent(db, {
    competitionId,
    eventType: "friends_join",
    message: "Partecipante in attesa di conferma organizzatore.",
    participantId,
    userId,
  });
  await notifyFriendsOwnerPendingParticipant(db, competition, userId);

  return getFriendsCompetitionBundle(db, competitionId, userId);
}

export async function declineFriendsInvitation(db: D1Database, competitionId: string, userId: string) {
  await ensureFriendsSchema(db);

  const competition = await getFriendsCompetition(db, competitionId);
  assertFriends(competition, "Competizione Friends non trovata.", 404);
  assertFriends(competition.status === "ACTIVE", "Competizione non attiva.", 409);
  assertFriends(competition.owner_user_id !== userId, "L'organizzatore non può declinare la propria competizione.", 409);

  const participant = await getFriendsParticipant(db, competitionId, userId);
  assertFriends(!participant || participant.status === "REMOVED", "Sei già partecipante a questa competizione.", 409);

  const invitation = await db
    .prepare(
      `SELECT i.id
       FROM friends_invitations i
       INNER JOIN users u ON u.id = ?2
       WHERE i.competition_id = ?1
         AND i.accepted_at IS NULL
         AND (
          i.invited_user_id = ?2
          OR LOWER(i.invited_username) = LOWER(u.username)
          OR LOWER(i.invited_email) = LOWER(u.email)
         )
       LIMIT 1`,
    )
    .bind(competitionId, userId)
    .first<{ id: string }>();
  assertFriends(invitation, "Invito non trovato.", 404);

  await db
    .prepare(
      `DELETE FROM friends_invitations
       WHERE competition_id = ?1
         AND accepted_at IS NULL
         AND (
          invited_user_id = ?2
          OR LOWER(invited_username) = LOWER((SELECT username FROM users WHERE id = ?2))
          OR LOWER(invited_email) = LOWER((SELECT email FROM users WHERE id = ?2))
         )`,
    )
    .bind(competitionId, userId)
    .run();

  await logFriendsEvent(db, {
    competitionId,
    eventType: "friends_invite_declined",
    message: "Invito Friends declinato.",
    userId,
  });

  return {
    competition_id: competitionId,
    ok: true,
  };
}

export async function joinFriendsCompetitionByCode(db: D1Database, inviteCode: string, userId: string) {
  await ensureFriendsSchema(db);
  const code = inviteCode.trim().toUpperCase();
  assertFriends(code.length >= 5, "Codice invito non valido.");

  const competition = await db
    .prepare("SELECT * FROM friends_competitions WHERE UPPER(invite_code) = ?1 LIMIT 1")
    .bind(code)
    .first<FriendsCompetitionRow>();
  assertFriends(competition, "Codice invito non trovato.", 404);
  assertFriends(competition.status === "ACTIVE", "Competizione non attiva.", 409);
  const existing = await getFriendsParticipant(db, competition.id, userId);
  assertFriends(!existing || existing.status === "REMOVED", existing?.status === "PENDING" ? "Richiesta già in attesa di conferma." : "Sei già in questa competizione.", 409);

  const participantId = await addFriendsParticipant(db, competition.id, userId, 1, "PENDING");

  await logFriendsEvent(db, {
    competitionId: competition.id,
    eventType: "friends_join_code",
    message: "Partecipante entrato con codice invito, in attesa di conferma.",
    participantId,
    userId,
  });
  await notifyFriendsOwnerPendingParticipant(db, competition, userId);

  return getFriendsCompetitionBundle(db, competition.id, userId);
}

async function notifyFriendsOwnerPendingParticipant(db: D1Database, competition: FriendsCompetitionRow, userId: string) {
  if (competition.owner_user_id === userId) {
    return;
  }

  const user = await db.prepare("SELECT username FROM users WHERE id = ?1 LIMIT 1").bind(userId).first<{ username: string }>();

  await createUserInboxMessage(db, {
    body: `${user?.username ?? "Un utente"} ha richiesto di partecipare a "${competition.name}".\n\nApri Area Manager per accettarlo o rimuoverlo.`,
    createdBy: userId,
    title: "Richiesta Friends da approvare",
    userId: competition.owner_user_id,
  });
}

async function assertOwner(db: D1Database, competitionId: string, userId: string) {
  const competition = await getFriendsCompetition(db, competitionId);
  assertFriends(competition, "Competizione Friends non trovata.", 404);
  assertFriends(competition.owner_user_id === userId, "Solo l'organizzatore può gestire questa competizione.", 403);

  return competition;
}

export async function inviteFriend(
  db: D1Database,
  input: {
    competitionId: string;
    identifier: string;
    organizerId: string;
  },
) {
  await ensureFriendsSchema(db);
  const competition = await assertOwner(db, input.competitionId, input.organizerId);
  const identifier = input.identifier.trim();

  assertFriends(identifier.length >= 3, "Inserisci username o email da invitare.");

  const user = await findUserByIdentifier(db, identifier).catch(() => null);
  const now = nowIso();
  await db
    .prepare(
      `INSERT INTO friends_invitations (
        id, competition_id, invited_user_id, invited_username, invited_email, created_at, accepted_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL)`,
    )
    .bind(
      crypto.randomUUID(),
      input.competitionId,
      user?.id ?? null,
      user?.username ?? (!identifier.includes("@") ? identifier : null),
      user?.email ?? (identifier.includes("@") ? identifier : null),
      now,
    )
    .run();

  await logFriendsEvent(db, {
    competitionId: competition.id,
    eventType: "friends_invite",
    message: `Invito creato per ${identifier}.`,
    userId: input.organizerId,
  });

  if (user?.id) {
    await createUserInboxMessage(db, {
      body: `${competition.owner_username ?? "Un amico"} ti ha invitato a "${competition.name}".\n\nPuoi accettare o declinare l'invito direttamente da qui, oppure aprire la pagina Tornei.\n[friends-invite:${competition.id}]`,
      createdBy: input.organizerId,
      title: "Nuovo invito Friends",
      userId: user.id,
    });
  }

  return getFriendsCompetitionBundle(db, competition.id, input.organizerId);
}

export async function addFriendsParticipantByIdentifier(
  db: D1Database,
  input: {
    competitionId: string;
    identifier: string;
    lives: number;
    organizerId: string;
  },
) {
  await ensureFriendsSchema(db);
  const competition = await assertOwner(db, input.competitionId, input.organizerId);
  assertFriends(competition.status !== "COMPLETED" && competition.status !== "CANCELLED", "Competizione già chiusa.", 409);
  const identifier = input.identifier.trim();
  assertFriends(identifier.length >= 3, "Inserisci username o email del partecipante.");

  const user = await findUserByIdentifier(db, identifier);
  assertFriends(user, "Utente non trovato.", 404);
  const existing = await getFriendsParticipant(db, competition.id, user.id);
  assertFriends(!existing || existing.status === "REMOVED", existing?.status === "PENDING" ? "Utente già in attesa di conferma." : "Utente già presente nella competizione.", 409);

  const participantId = await addFriendsParticipant(db, competition.id, user.id, 1, "PENDING");

  await logFriendsEvent(db, {
    competitionId: competition.id,
    eventType: "friends_participant_added",
    message: `${user.username} aggiunto in attesa con 1 vita.`,
    participantId,
    userId: input.organizerId,
  });

  await createUserInboxMessage(db, {
    body: `${competition.owner_username ?? "Un amico"} ti ha aggiunto alla competizione "${competition.name}".\n\nLa partecipazione è in attesa di conferma organizzatore.`,
    createdBy: input.organizerId,
    title: "Invito Friends in attesa",
    userId: user.id,
  });

  return getFriendsCompetitionBundle(db, competition.id, input.organizerId);
}

export async function approveFriendsParticipant(
  db: D1Database,
  input: {
    competitionId: string;
    organizerId: string;
    participantId: string;
  },
) {
  await ensureFriendsSchema(db);
  const competition = await assertOwner(db, input.competitionId, input.organizerId);
  const participant = await db
    .prepare("SELECT id, user_id, status FROM friends_participants WHERE id = ?1 AND competition_id = ?2 LIMIT 1")
    .bind(input.participantId, input.competitionId)
    .first<{ id: string; status: FriendsParticipantRow["status"]; user_id: string }>();
  assertFriends(participant, "Partecipante non trovato.", 404);
  assertFriends(participant.status === "PENDING", "Questo partecipante è già confermato.", 409);

  await db
    .prepare("UPDATE friends_participants SET status = 'ACTIVE', removed_at = NULL WHERE id = ?1")
    .bind(participant.id)
    .run();

  const lives = await db
    .prepare("SELECT COUNT(*) AS count FROM friends_lives WHERE participant_id = ?1")
    .bind(participant.id)
    .first<{ count: number }>();
  if (Number(lives?.count ?? 0) < 1) {
    await setParticipantLives(db, participant.id, 1);
  }

  await logFriendsEvent(db, {
    competitionId: input.competitionId,
    eventType: "friends_participant_approved",
    message: "Partecipante accettato nella competizione.",
    participantId: participant.id,
    userId: input.organizerId,
  });

  await createUserInboxMessage(db, {
    body: `La tua partecipazione a "${competition.name}" è stata confermata. Ora puoi giocare.`,
    createdBy: input.organizerId,
    title: "Partecipazione Friends confermata",
    userId: participant.user_id,
  });

  return getFriendsCompetitionBundle(db, input.competitionId, input.organizerId);
}

export async function updateFriendsParticipantLives(
  db: D1Database,
  input: {
    competitionId: string;
    lives: number;
    organizerId: string;
    participantId: string;
  },
) {
  await ensureFriendsSchema(db);
  await assertOwner(db, input.competitionId, input.organizerId);
  assertFriends(Number.isInteger(input.lives) && input.lives >= 0, "Numero vite non valido.");

  const participant = await db
    .prepare("SELECT id, competition_id, user_id, status FROM friends_participants WHERE id = ?1 AND competition_id = ?2 LIMIT 1")
    .bind(input.participantId, input.competitionId)
    .first<{ id: string; user_id: string; status: string }>();
  assertFriends(participant, "Partecipante non trovato.", 404);

  await setParticipantLives(db, participant.id, input.lives);
  await logFriendsEvent(db, {
    competitionId: input.competitionId,
    eventType: "friends_lives_updated",
    message: `Vite partecipante aggiornate a ${input.lives}.`,
    participantId: participant.id,
    userId: input.organizerId,
  });

  return getFriendsCompetitionBundle(db, input.competitionId, input.organizerId);
}

export async function terminateFriendsCompetition(db: D1Database, competitionId: string, organizerId: string) {
  await ensureFriendsSchema(db);
  const competition = await assertOwner(db, competitionId, organizerId);
  assertFriends(competition.status !== "COMPLETED" && competition.status !== "CANCELLED", "Competizione già chiusa.", 409);

  const now = nowIso();
  await db
    .prepare("UPDATE friends_competitions SET status = 'COMPLETED', completed_at = ?1, updated_at = ?1 WHERE id = ?2")
    .bind(now, competition.id)
    .run();

  await db
    .prepare("UPDATE friends_rounds SET status = 'CALCULATED', calculated_at = COALESCE(calculated_at, ?1), updated_at = ?1 WHERE competition_id = ?2 AND status != 'CALCULATED'")
    .bind(now, competition.id)
    .run();

  await logFriendsEvent(db, {
    competitionId: competition.id,
    eventType: "friends_competition_terminated",
    message: "Competizione terminata manualmente dall'organizzatore.",
    userId: organizerId,
  });
  await createManualCompetitionClosedUpdates(db, competition);

  return getFriendsCompetitionBundle(db, competition.id, organizerId);
}

export async function updateFriendsPopularChoicesVisibility(
  db: D1Database,
  input: {
    competitionId: string;
    organizerId: string;
    showPopularPicksBeforeDeadline: boolean;
  },
) {
  await ensureFriendsSchema(db);
  const competition = await assertOwner(db, input.competitionId, input.organizerId);
  assertFriends(competition.status !== "COMPLETED" && competition.status !== "CANCELLED", "Competizione già chiusa.", 409);

  const now = nowIso();
  await db
    .prepare("UPDATE friends_competitions SET show_popular_picks_before_deadline = ?1, updated_at = ?2 WHERE id = ?3")
    .bind(input.showPopularPicksBeforeDeadline ? 1 : 0, now, competition.id)
    .run();

  await logFriendsEvent(db, {
    competitionId: competition.id,
    eventType: "friends_popular_choices_visibility",
    message: input.showPopularPicksBeforeDeadline
      ? "Scelte più gettonate visibili prima della deadline."
      : "Scelte più gettonate nascoste fino alla deadline.",
    userId: input.organizerId,
  });

  return getFriendsCompetitionBundle(db, competition.id, input.organizerId);
}

export async function deleteFriendsCompetition(db: D1Database, competitionId: string, organizerId: string) {
  await ensureFriendsSchema(db);
  const competition = await assertOwner(db, competitionId, organizerId);

  await db.prepare("DELETE FROM friends_events WHERE competition_id = ?1").bind(competition.id).run();
  await db.prepare("DELETE FROM friends_user_updates WHERE competition_id = ?1").bind(competition.id).run();
  await db.prepare("DELETE FROM friends_life_round_results WHERE competition_id = ?1").bind(competition.id).run();
  await db.prepare("DELETE FROM friends_selections WHERE competition_id = ?1").bind(competition.id).run();
  await db.prepare("DELETE FROM friends_lives WHERE competition_id = ?1").bind(competition.id).run();
  await db.prepare("DELETE FROM friends_participants WHERE competition_id = ?1").bind(competition.id).run();
  await db.prepare("DELETE FROM friends_invitations WHERE competition_id = ?1").bind(competition.id).run();
  await db.prepare("DELETE FROM friends_matches WHERE competition_id = ?1").bind(competition.id).run();
  await db.prepare("DELETE FROM friends_rounds WHERE competition_id = ?1").bind(competition.id).run();
  await db.prepare("DELETE FROM friends_competitions WHERE id = ?1").bind(competition.id).run();

  return {
    deleted: true,
    id: competition.id,
  };
}

async function setParticipantLives(db: D1Database, participantId: string, desiredLives: number) {
  const rows = await db
    .prepare(
      `SELECT id, participant_id, competition_id, user_id, life_number, status, current_cycle, created_at, eliminated_at
       FROM friends_lives
       WHERE participant_id = ?1
       ORDER BY life_number ASC`,
    )
    .bind(participantId)
    .all<FriendsLifeRow>();
  const lives = rows.results ?? [];
  const participant = await db
    .prepare("SELECT competition_id, user_id FROM friends_participants WHERE id = ?1 LIMIT 1")
    .bind(participantId)
    .first<{ competition_id: string; user_id: string }>();

  assertFriends(participant, "Partecipante non trovato.", 404);

  if (desiredLives > lives.length) {
    const now = nowIso();
    for (let lifeNumber = lives.length + 1; lifeNumber <= desiredLives; lifeNumber += 1) {
      await db
        .prepare(
          `INSERT INTO friends_lives (
            id, participant_id, competition_id, user_id, life_number, status, current_cycle, created_at, eliminated_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, 'ALIVE', 1, ?6, NULL)`,
        )
        .bind(crypto.randomUUID(), participantId, participant.competition_id, participant.user_id, lifeNumber, now)
        .run();
    }
  }

  if (desiredLives < lives.length) {
    const removable = [...lives].sort((a, b) => b.life_number - a.life_number).slice(0, lives.length - desiredLives);
    for (const life of removable) {
      const selections = await db
        .prepare("SELECT COUNT(*) AS count FROM friends_selections WHERE life_id = ?1")
        .bind(life.id)
        .first<{ count: number }>();

      if (Number(selections?.count ?? 0) > 0) {
        await db
          .prepare("UPDATE friends_lives SET status = 'ELIMINATED', eliminated_at = COALESCE(eliminated_at, ?1) WHERE id = ?2")
          .bind(nowIso(), life.id)
          .run();
      } else {
        await db.prepare("DELETE FROM friends_lives WHERE id = ?1").bind(life.id).run();
      }
    }
  }
}

export async function removeFriendsParticipant(
  db: D1Database,
  input: {
    competitionId: string;
    organizerId: string;
    participantId: string;
  },
) {
  await ensureFriendsSchema(db);
  const competition = await assertOwner(db, input.competitionId, input.organizerId);
  const participant = await db
    .prepare("SELECT id, user_id FROM friends_participants WHERE id = ?1 AND competition_id = ?2 LIMIT 1")
    .bind(input.participantId, input.competitionId)
    .first<{ id: string; user_id: string }>();
  assertFriends(participant, "Partecipante non trovato.", 404);
  assertFriends(participant.user_id !== competition.owner_user_id, "Non puoi rimuovere l'organizzatore.", 409);

  await db
    .prepare("UPDATE friends_participants SET status = 'REMOVED', removed_at = ?1 WHERE id = ?2")
    .bind(nowIso(), participant.id)
    .run();
  await db
    .prepare("UPDATE friends_lives SET status = 'ELIMINATED', eliminated_at = COALESCE(eliminated_at, ?1) WHERE participant_id = ?2")
    .bind(nowIso(), participant.id)
    .run();

  await logFriendsEvent(db, {
    competitionId: input.competitionId,
    eventType: "friends_participant_removed",
    message: "Partecipante rimosso.",
    participantId: participant.id,
    userId: input.organizerId,
  });

  return getFriendsCompetitionBundle(db, input.competitionId, input.organizerId);
}

export async function updateFriendsRound(
  db: D1Database,
  input: {
    competitionId: string;
    deadlineAt: string | null;
    organizerId: string;
    roundId: string;
  },
) {
  await ensureFriendsSchema(db);
  await assertOwner(db, input.competitionId, input.organizerId);
  const round = await getFriendsRound(db, input.roundId);
  assertFriends(round && round.competition_id === input.competitionId, "Round non trovato.", 404);
  assertFriends(round.status !== "CALCULATED", "Round già calcolato.", 409);

  await db
    .prepare("UPDATE friends_rounds SET deadline_at = ?1, updated_at = ?2 WHERE id = ?3")
    .bind(input.deadlineAt, nowIso(), round.id)
    .run();

  return getFriendsCompetitionBundle(db, input.competitionId, input.organizerId);
}

export async function openFriendsRound(db: D1Database, competitionId: string, organizerId: string) {
  await ensureFriendsSchema(db);
  const competition = await assertOwner(db, competitionId, organizerId);
  const round = await getCurrentFriendsRound(db, competition);
  assertFriends(round, "Round corrente non trovato.", 404);
  assertFriends(round.deadline_at, "Imposta la deadline prima di aprire.");

  const now = nowIso();
  await db.prepare("UPDATE friends_rounds SET status = 'OPEN', updated_at = ?1 WHERE id = ?2").bind(now, round.id).run();
  await db.prepare("UPDATE friends_competitions SET status = 'ACTIVE', published_at = COALESCE(published_at, ?1), updated_at = ?1 WHERE id = ?2").bind(now, competitionId).run();
  await createRoundOpenedUpdates(db, competition, round);

  return getFriendsCompetitionBundle(db, competitionId, organizerId);
}

export async function lockFriendsRound(db: D1Database, competitionId: string, organizerId: string) {
  await ensureFriendsSchema(db);
  const competition = await assertOwner(db, competitionId, organizerId);
  const round = await getCurrentFriendsRound(db, competition);
  assertFriends(round, "Round corrente non trovato.", 404);

  const now = nowIso();
  await db.prepare("UPDATE friends_rounds SET status = 'LOCKED', updated_at = ?1 WHERE id = ?2").bind(now, round.id).run();
  await db.prepare("UPDATE friends_competitions SET status = 'LOCKED', updated_at = ?1 WHERE id = ?2").bind(now, competitionId).run();

  return getFriendsCompetitionBundle(db, competitionId, organizerId);
}

export async function updateFriendsMatch(
  db: D1Database,
  input: {
    awayTeamId: string;
    competitionId: string;
    homeTeamId: string;
    isActive: boolean;
    matchId?: string;
    organizerId: string;
    roundId: string;
  },
) {
  await ensureFriendsSchema(db);
  await assertOwner(db, input.competitionId, input.organizerId);
  const round = await getFriendsRound(db, input.roundId);
  assertFriends(round && round.competition_id === input.competitionId, "Round non trovato.", 404);
  assertFriends(round.status !== "CALCULATED", "Round già calcolato.", 409);

  if (!input.matchId) {
    await insertFriendsMatch(db, input);
    return getFriendsCompetitionBundle(db, input.competitionId, input.organizerId);
  }

  const match = await getFriendsMatch(db, input.matchId);
  assertFriends(match && match.round_id === input.roundId, "Match non trovato.", 404);
  const { awayTeam, homeTeam } = await resolveTeams(db, input.homeTeamId, input.awayTeamId);

  await db
    .prepare(
      `UPDATE friends_matches
       SET home_team_id = ?1, away_team_id = ?2, home_team = ?3, away_team = ?4, is_active = ?5, updated_at = ?6
       WHERE id = ?7`,
    )
    .bind(homeTeam.id, awayTeam.id, homeTeam.name, awayTeam.name, input.isActive ? 1 : 0, nowIso(), input.matchId)
    .run();

  return getFriendsCompetitionBundle(db, input.competitionId, input.organizerId);
}

export async function addFriendsAutomaticMatchday(
  db: D1Database,
  input: {
    competitionId: string;
    fixtureCompetitionId: string | null;
    fixtureMatchday: number | null;
    organizerId: string;
    roundId: string;
  },
) {
  await ensureFriendsSchema(db);
  const competition = await assertOwner(db, input.competitionId, input.organizerId);
  const round = await getFriendsRound(db, input.roundId);
  assertFriends(round && round.competition_id === input.competitionId, "Round non trovato.", 404);
  assertFriends(round.status !== "CALCULATED", "Round già calcolato.", 409);

  const matches = await buildAutomaticMatchInputs(db, input.fixtureCompetitionId, input.fixtureMatchday);
  const now = nowIso();
  let inserted = 0;

  for (const match of matches) {
    const existing = await db
      .prepare(
        `SELECT id
         FROM friends_matches
         WHERE round_id = ?1 AND home_team_id = ?2 AND away_team_id = ?3
         LIMIT 1`,
      )
      .bind(input.roundId, match.homeTeamId, match.awayTeamId)
      .first<{ id: string }>();

    if (existing) {
      continue;
    }

    await insertFriendsMatch(db, {
      awayTeamId: match.awayTeamId,
      competitionId: input.competitionId,
      homeTeamId: match.homeTeamId,
      isActive: true,
      roundId: input.roundId,
    });
    inserted += 1;
  }

  await db
    .prepare(
      `UPDATE friends_rounds
       SET fixture_competition_id = ?1,
           fixture_matchday = ?2,
           updated_at = ?3
       WHERE id = ?4`,
    )
    .bind(input.fixtureCompetitionId, input.fixtureMatchday, now, round.id)
    .run();

  await db
    .prepare(
      `UPDATE friends_competitions
       SET fixture_competition_id = COALESCE(fixture_competition_id, ?1),
           updated_at = ?2
       WHERE id = ?3`,
    )
    .bind(input.fixtureCompetitionId, now, competition.id)
    .run();

  await logFriendsEvent(db, {
    competitionId: input.competitionId,
    eventType: "friends_automatic_matchday_imported",
    message: `Giornata automatica importata: ${inserted} match aggiunti.`,
    metadata: {
      fixtureCompetitionId: input.fixtureCompetitionId,
      fixtureMatchday: input.fixtureMatchday,
      inserted,
    },
    roundId: input.roundId,
    userId: input.organizerId,
  });

  return getFriendsCompetitionBundle(db, input.competitionId, input.organizerId);
}

export async function updateFriendsMatchActiveState(
  db: D1Database,
  input: {
    competitionId: string;
    invalidateExistingChoices: boolean;
    isActive: boolean;
    matchId: string;
    organizerId: string;
  },
) {
  await ensureFriendsSchema(db);
  await assertOwner(db, input.competitionId, input.organizerId);
  const match = await getFriendsMatch(db, input.matchId);
  assertFriends(match && match.competition_id === input.competitionId, "Match non trovato.", 404);
  const round = await getFriendsRound(db, match.round_id);
  assertFriends(round && round.competition_id === input.competitionId, "Round non trovato.", 404);
  assertFriends(round.status !== "CALCULATED", "Round già calcolato.", 409);

  const now = nowIso();
  await db
    .prepare("UPDATE friends_matches SET is_active = ?1, updated_at = ?2 WHERE id = ?3")
    .bind(input.isActive ? 1 : 0, now, match.id)
    .run();

  if (!input.isActive && input.invalidateExistingChoices) {
    await db
      .prepare("DELETE FROM friends_selections WHERE competition_id = ?1 AND round_id = ?2 AND match_id = ?3 AND status = 'PENDING'")
      .bind(input.competitionId, round.id, match.id)
      .run();
  }

  await logFriendsEvent(db, {
    competitionId: input.competitionId,
    eventType: input.isActive ? "friends_match_enabled" : "friends_match_disabled",
    matchId: match.id,
    message: input.isActive
      ? `Match riabilitato: ${match.home_team} vs ${match.away_team}.`
      : input.invalidateExistingChoices
        ? `Match disabilitato e scelte annullate: ${match.home_team} vs ${match.away_team}.`
        : `Match disabilitato mantenendo le scelte esistenti: ${match.home_team} vs ${match.away_team}.`,
    roundId: round.id,
    userId: input.organizerId,
  });

  return getFriendsCompetitionBundle(db, input.competitionId, input.organizerId);
}

export async function deleteFriendsMatch(
  db: D1Database,
  input: {
    competitionId: string;
    matchId: string;
    organizerId: string;
  },
) {
  await ensureFriendsSchema(db);
  await assertOwner(db, input.competitionId, input.organizerId);
  const match = await getFriendsMatch(db, input.matchId);
  assertFriends(match && match.competition_id === input.competitionId, "Match non trovato.", 404);
  const round = await getFriendsRound(db, match.round_id);
  assertFriends(round && round.competition_id === input.competitionId, "Round non trovato.", 404);
  assertFriends(round.status !== "CALCULATED", "Round già calcolato.", 409);

  await db
    .prepare("DELETE FROM friends_selections WHERE competition_id = ?1 AND round_id = ?2 AND match_id = ?3 AND status = 'PENDING'")
    .bind(input.competitionId, round.id, match.id)
    .run();
  await db.prepare("DELETE FROM friends_matches WHERE id = ?1").bind(input.matchId).run();

  return getFriendsCompetitionBundle(db, input.competitionId, input.organizerId);
}

async function getUserLife(db: D1Database, lifeId: string, userId: string) {
  return db
    .prepare(
      `SELECT id, participant_id, competition_id, user_id, life_number, status, current_cycle, created_at, eliminated_at
       FROM friends_lives
       WHERE id = ?1 AND user_id = ?2
       LIMIT 1`,
    )
    .bind(lifeId, userId)
    .first<FriendsLifeRow>();
}

async function getSelectionForRound(db: D1Database, lifeId: string, roundId: string) {
  return db
    .prepare(
      `SELECT id, life_id, competition_id, round_id, match_id, selected_team_id, selected_team,
        selected_side, cycle_number, status, created_at, updated_at
       FROM friends_selections
       WHERE life_id = ?1 AND round_id = ?2
       LIMIT 1`,
    )
    .bind(lifeId, roundId)
    .first<FriendsSelectionRow>();
}

async function getUsedTeamsForCycle(db: D1Database, lifeId: string, cycleNumber: number, excludeRoundId: string) {
  const rows = await db
    .prepare(
      `SELECT selected_team_id, selected_team
       FROM friends_selections
       WHERE life_id = ?1 AND cycle_number = ?2 AND round_id != ?3 AND status != 'VOID'`,
    )
    .bind(lifeId, cycleNumber, excludeRoundId)
    .all<{ selected_team: string; selected_team_id: string }>();

  return (rows.results ?? []).map((row) => teamUsageKey(row.selected_team_id, row.selected_team));
}

export async function chooseFriendsLifeTeam(
  db: D1Database,
  input: {
    lifeId: string;
    matchId: string;
    selectedTeamId: string;
    userId: string;
  },
) {
  await ensureFriendsSchema(db);
  const life = await getUserLife(db, input.lifeId, input.userId);
  assertFriends(life, "Vita non trovata.", 404);
  assertFriends(life.status === "ALIVE", "Questa vita non è più attiva.", 409);
  const participant = await db
    .prepare("SELECT status FROM friends_participants WHERE id = ?1 LIMIT 1")
    .bind(life.participant_id)
    .first<{ status: FriendsParticipantRow["status"] }>();
  assertFriends(participant?.status === "ACTIVE", "Partecipazione in attesa di conferma.", 403);

  const competition = await getFriendsCompetition(db, life.competition_id);
  assertFriends(competition, "Competizione non trovata.", 404);
  assertFriends(competition.status === "ACTIVE", "Le scelte non sono aperte.", 409);

  const round = await getCurrentFriendsRound(db, competition);
  assertFriends(canChangeChoices(round), "Le scelte sono chiuse.", 409);

  const match = await getFriendsMatch(db, input.matchId);
  assertFriends(match && match.round_id === round!.id, "Match non valido.", 400);
  assertFriends(match.is_active === 1, "Match non attivo.", 409);

  const selected =
    input.selectedTeamId === match.home_team_id
      ? { id: match.home_team_id, name: match.home_team, side: "HOME" as SelectionSide }
      : input.selectedTeamId === match.away_team_id
        ? { id: match.away_team_id, name: match.away_team, side: "AWAY" as SelectionSide }
        : null;
  assertFriends(selected, "La squadra scelta non appartiene al match.", 400);

  const roundMatches = await listFriendsMatches(db, round!.id);
  const availableTeams = roundMatches
    .filter((item) => item.is_active === 1)
    .flatMap((item) => [
      { id: item.home_team_id, key: teamUsageKey(item.home_team_id, item.home_team), name: item.home_team },
      { id: item.away_team_id, key: teamUsageKey(item.away_team_id, item.away_team), name: item.away_team },
    ]);
  let cycleNumber = life.current_cycle;
  let usedTeamKeys = await getUsedTeamsForCycle(db, life.id, cycleNumber, round!.id);
  let unusedTeams = availableTeams.filter(
    (team, index, teams) => teams.findIndex((candidate) => candidate.key === team.key) === index && !usedTeamKeys.includes(team.key),
  );

  if (unusedTeams.length === 0) {
    cycleNumber += 1;
    usedTeamKeys = [];
    unusedTeams = availableTeams;
    await db.prepare("UPDATE friends_lives SET current_cycle = ?1 WHERE id = ?2").bind(cycleNumber, life.id).run();
  }

  assertFriends(!usedTeamKeys.includes(teamUsageKey(selected.id, selected.name)), "Questa vita ha già usato questa squadra nel ciclo corrente.", 409);

  const existing = await getSelectionForRound(db, life.id, round!.id);
  const now = nowIso();

  if (existing) {
    await db
      .prepare(
        `UPDATE friends_selections
         SET match_id = ?1, selected_team_id = ?2, selected_team = ?3, selected_side = ?4, cycle_number = ?5, updated_at = ?6
         WHERE id = ?7`,
      )
      .bind(match.id, selected.id, selected.name, selected.side, cycleNumber, now, existing.id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO friends_selections (
          id, life_id, competition_id, round_id, match_id, selected_team_id, selected_team,
          selected_side, cycle_number, status, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'PENDING', ?10, ?10)`,
      )
      .bind(crypto.randomUUID(), life.id, life.competition_id, round!.id, match.id, selected.id, selected.name, selected.side, cycleNumber, now)
      .run();
  }

  await logFriendsEvent(db, {
    competitionId: life.competition_id,
    eventType: existing ? "friends_choice_updated" : "friends_choice",
    lifeId: life.id,
    matchId: match.id,
    message: `Vita ${life.life_number}: scelta ${selected.name}.`,
    participantId: life.participant_id,
    roundId: round!.id,
    userId: input.userId,
  });

  return getFriendsCompetitionBundle(db, life.competition_id, input.userId);
}

type RoundLifeResolution = {
  life: FriendsLifeRow;
  match: FriendsMatchRow | null;
  outcome: FriendsLifeRoundOutcome;
  result: MatchResult | null;
  selection: FriendsSelectionRow | null;
  survives: boolean;
};

type FriendsFinalOutcome = {
  completed: boolean;
  shared: boolean;
  winners: Array<{
    alive_lives: number;
    decisive_lives: number;
    participant_id: string;
    user_id: string;
    username: string;
  }>;
};

async function getRemainingLivesMap(db: D1Database, competitionId: string) {
  const rows = await db
    .prepare(
      `SELECT participant_id, COUNT(*) AS count
       FROM friends_lives
       WHERE competition_id = ?1 AND status IN ('ALIVE', 'WINNER')
       GROUP BY participant_id`,
    )
    .bind(competitionId)
    .all<{ count: number; participant_id: string }>();

  return new Map((rows.results ?? []).map((row) => [row.participant_id, Number(row.count ?? 0)]));
}

async function recordFriendsLifeRoundResults(
  db: D1Database,
  input: {
    competitionId: string;
    createdAt: string;
    resolutions: RoundLifeResolution[];
    roundId: string;
  },
) {
  const remainingLivesByParticipant = await getRemainingLivesMap(db, input.competitionId);

  for (const resolution of input.resolutions) {
    await db
      .prepare(
        `INSERT OR REPLACE INTO friends_life_round_results (
          id,
          competition_id,
          round_id,
          participant_id,
          life_id,
          user_id,
          life_number,
          selected_team_id,
          selected_team,
          selected_side,
          match_id,
          match_label,
          match_result,
          outcome,
          remaining_lives_after_round,
          created_at
        ) VALUES (
          COALESCE((SELECT id FROM friends_life_round_results WHERE round_id = ?1 AND life_id = ?2), ?3),
          ?4, ?1, ?5, ?2, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16
        )`,
      )
      .bind(
        input.roundId,
        resolution.life.id,
        crypto.randomUUID(),
        input.competitionId,
        resolution.life.participant_id,
        resolution.life.user_id,
        resolution.life.life_number,
        resolution.selection?.selected_team_id ?? null,
        resolution.selection?.selected_team ?? null,
        resolution.selection?.selected_side ?? null,
        resolution.match?.id ?? null,
        matchLabel(resolution.match),
        resolution.result,
        resolution.outcome,
        remainingLivesByParticipant.get(resolution.life.participant_id) ?? 0,
        input.createdAt,
      )
      .run();
  }
}

async function createRoundResultUserUpdates(
  db: D1Database,
  input: {
    competition: FriendsCompetitionRow;
    finalOutcome: FriendsFinalOutcome | null;
    round: FriendsRoundRow;
  },
) {
  const [participants, roundResults] = await Promise.all([
    listFriendsParticipants(db, input.competition.id),
    listLifeRoundResults(db, input.competition.id, input.round.id),
  ]);
  const resultsByParticipant = new Map<string, FriendsLifeRoundResultRow[]>();

  roundResults.forEach((result) => {
    const current = resultsByParticipant.get(result.participant_id) ?? [];
    current.push(result);
    resultsByParticipant.set(result.participant_id, current);
  });

  for (const participant of participants.filter((item) => item.status !== "REMOVED" && item.status !== "PENDING")) {
    const participantResults = resultsByParticipant.get(participant.id) ?? [];
    const winner = input.finalOutcome?.winners.find((item) => item.participant_id === participant.id) ?? null;

    if (!input.finalOutcome && participantResults.length === 0) {
      continue;
    }

    const remainingLives = participantResults[0]?.remaining_lives_after_round ?? participant.alive_lives;
    const title = input.finalOutcome
      ? winner
        ? input.finalOutcome.shared
          ? "La gloria si condivide!"
          : "Complimenti! Hai vinto il Survival!"
        : "Il Survival si e' concluso"
      : remainingLives === 0
        ? "Sei stato eliminato dal Survival"
        : participantResults.some((result) => result.outcome === "ELIMINATED" || result.outcome === "NO_CHOICE")
          ? "Round concluso: risultati misti"
          : "Complimenti, sei ancora in gioco!";
    const summary = input.finalOutcome
      ? winner
        ? input.finalOutcome.shared
          ? `Hai vinto insieme ad altri ${input.finalOutcome.winners.length - 1} partecipanti.`
          : "Sei l'ultimo sopravvissuto del torneo."
        : "Il torneo e' terminato. Puoi consultare il report completo."
      : getUpdateSummaryFromResults(participantResults, remainingLives);
    const eventType = input.finalOutcome
      ? winner
        ? input.finalOutcome.shared
          ? "friends_shared_winner"
          : "friends_winner"
        : "friends_tournament_completed"
      : remainingLives === 0
        ? "friends_user_eliminated"
        : "friends_round_result";

    await createFriendsUserUpdate(db, {
      competitionId: input.competition.id,
      detail: {
        competitionName: input.competition.name,
        eventKind: input.finalOutcome ? "tournament_completed" : "round_result",
        lives: participantResults.map(updateLifeSummary),
        remainingLives,
        roundNumber: input.round.round_number,
        tournamentCompleted: !!input.finalOutcome,
        userStatus: participant.status,
        winners: input.finalOutcome?.winners ?? [],
      },
      eventType,
      participantId: participant.id,
      roundId: input.round.id,
      summary,
      title,
      userId: participant.user_id,
    });
  }
}

async function createRoundOpenedUpdates(db: D1Database, competition: FriendsCompetitionRow, round: FriendsRoundRow) {
  const existing = await db
    .prepare(
      `SELECT id
       FROM friends_user_updates
       WHERE competition_id = ?1 AND round_id = ?2 AND event_type = 'friends_round_started'
       LIMIT 1`,
    )
    .bind(competition.id, round.id)
    .first<{ id: string }>();

  if (existing) {
    return;
  }

  const participants = await listFriendsParticipants(db, competition.id);

  for (const participant of participants.filter((item) => item.status !== "REMOVED" && item.status !== "PENDING")) {
    await createFriendsUserUpdate(db, {
      competitionId: competition.id,
      detail: {
        competitionName: competition.name,
        eventKind: "round_started",
        fixtureMatchday: round.fixture_matchday,
        remainingLives: participant.alive_lives,
        roundNumber: round.round_number,
        userStatus: participant.status,
      },
      eventType: "friends_round_started",
      participantId: participant.id,
      roundId: round.id,
      summary: participant.status === "ELIMINATED"
        ? `Il Round ${round.round_number} e' iniziato. Sei eliminato, ma puoi seguirne l'andamento.`
        : `Il Round ${round.round_number} e' iniziato. Ti restano ${participant.alive_lives} vite.`,
      title: `Nuovo round iniziato: Round ${round.round_number}`,
      userId: participant.user_id,
    });
  }
}

async function createManualCompetitionClosedUpdates(db: D1Database, competition: FriendsCompetitionRow) {
  const participants = await listFriendsParticipants(db, competition.id);

  for (const participant of participants.filter((item) => item.status !== "REMOVED" && item.status !== "PENDING")) {
    await createFriendsUserUpdate(db, {
      competitionId: competition.id,
      detail: {
        competitionName: competition.name,
        eventKind: "tournament_completed",
        remainingLives: participant.alive_lives,
        tournamentCompleted: true,
        userStatus: participant.status,
        winners: [],
      },
      eventType: "friends_tournament_completed",
      participantId: participant.id,
      summary: "Il torneo e' stato concluso dall'organizzatore. Puoi consultare lo storico completo.",
      title: "Il Survival si e' concluso",
      userId: participant.user_id,
    });
  }
}

export async function calculateFriendsRound(
  db: D1Database,
  input: {
    organizerId: string;
    results: Array<{ matchId: string; result: MatchResult }>;
    roundId: string;
  },
) {
  await ensureFriendsSchema(db);
  const round = await getFriendsRound(db, input.roundId);
  assertFriends(round, "Round non trovato.", 404);
  const competition = await assertOwner(db, round.competition_id, input.organizerId);
  assertFriends(round.status !== "CALCULATED", "Round già calcolato.", 409);

  const matches = await listFriendsMatches(db, round.id);
  const resultMap = new Map(input.results.map((result) => [result.matchId, result.result]));
  const now = nowIso();

  for (const match of matches) {
    const result = resultMap.get(match.id);
    assertFriends(result && result !== "PENDING", `Inserisci risultato per ${match.home_team} vs ${match.away_team}.`);
    await db.prepare("UPDATE friends_matches SET result = ?1, updated_at = ?2 WHERE id = ?3").bind(result, now, match.id).run();
  }

  const aliveRows = await db
    .prepare(
      `SELECT l.id, l.participant_id, l.competition_id, l.user_id, l.life_number, l.status, l.current_cycle, l.created_at, l.eliminated_at
       FROM friends_lives l
       INNER JOIN friends_participants p ON p.id = l.participant_id
       WHERE l.competition_id = ?1 AND l.status = 'ALIVE' AND p.status = 'ACTIVE'
       ORDER BY l.created_at ASC`,
    )
    .bind(competition.id)
    .all<FriendsLifeRow>();
  const livesBefore = aliveRows.results ?? [];
  const resolutions: RoundLifeResolution[] = [];

  for (const life of livesBefore) {
    const selection = await getSelectionForRound(db, life.id, round.id);
    const selectedMatch = selection ? matches.find((match) => match.id === selection.match_id) : null;
    const result = selectedMatch ? resultMap.get(selectedMatch.id) : null;
    const survives =
      !!selection &&
      !!result &&
      (result === "POSTPONED" ||
        result === "CANCELLED" ||
        (result === "HOME_WIN" && selection.selected_side === "HOME") ||
        (result === "AWAY_WIN" && selection.selected_side === "AWAY"));
    const isVoid = result === "POSTPONED" || result === "CANCELLED";
    const outcome: FriendsLifeRoundOutcome = !selection ? "NO_CHOICE" : isVoid ? "VOID" : survives ? "SURVIVED" : "ELIMINATED";

    resolutions.push({
      life,
      match: selectedMatch ?? null,
      outcome,
      result: result ?? null,
      selection: selection ?? null,
      survives,
    });

    if (selection) {
      await db
        .prepare("UPDATE friends_selections SET status = ?1, updated_at = ?2 WHERE id = ?3")
        .bind(isVoid ? "VOID" : survives ? "SURVIVED" : "ELIMINATED", now, selection.id)
        .run();
    }

    if (!survives) {
      await db.prepare("UPDATE friends_lives SET status = 'ELIMINATED', eliminated_at = ?1 WHERE id = ?2").bind(now, life.id).run();
    }
  }

  await db.prepare("UPDATE friends_rounds SET status = 'CALCULATED', calculated_at = ?1, updated_at = ?1 WHERE id = ?2").bind(now, round.id).run();
  await db
    .prepare(
      `UPDATE friends_participants
       SET status = 'ELIMINATED'
       WHERE competition_id = ?1 AND status = 'ACTIVE'
         AND NOT EXISTS (
          SELECT 1 FROM friends_lives WHERE friends_lives.participant_id = friends_participants.id AND friends_lives.status IN ('ALIVE', 'WINNER')
         )`,
    )
    .bind(competition.id)
    .run();

  const survivors = await getAliveFriendsLives(db, competition.id);
  let finalOutcome: FriendsFinalOutcome | null = null;

  if (survivors.length <= 1) {
    finalOutcome = await completeFriendsCompetition(db, competition, survivors, livesBefore);
  } else {
    await ensureNextFriendsRound(db, competition, round);
  }

  await recordFriendsLifeRoundResults(db, {
    competitionId: competition.id,
    createdAt: now,
    resolutions,
    roundId: round.id,
  });
  await createRoundResultUserUpdates(db, {
    competition,
    finalOutcome,
    round,
  });

  return getFriendsCompetitionBundle(db, competition.id, input.organizerId);
}

async function getAliveFriendsLives(db: D1Database, competitionId: string) {
  const rows = await db
    .prepare(
      `SELECT l.id, l.participant_id, l.competition_id, l.user_id, l.life_number, l.status, l.current_cycle, l.created_at, l.eliminated_at
       FROM friends_lives l
       INNER JOIN friends_participants p ON p.id = l.participant_id
       WHERE l.competition_id = ?1 AND l.status = 'ALIVE' AND p.status = 'ACTIVE'
       ORDER BY l.created_at ASC`,
    )
    .bind(competitionId)
    .all<FriendsLifeRow>();

  return rows.results ?? [];
}

async function completeFriendsCompetition(
  db: D1Database,
  competition: FriendsCompetitionRow,
  survivors: FriendsLifeRow[],
  decisiveLives: FriendsLifeRow[] = [],
): Promise<FriendsFinalOutcome> {
  const now = nowIso();
  await db.prepare("UPDATE friends_competitions SET status = 'COMPLETED', completed_at = ?1, updated_at = ?1 WHERE id = ?2").bind(now, competition.id).run();

  if (survivors.length === 1) {
    const winner = survivors[0]!;
    await db.prepare("UPDATE friends_lives SET status = 'WINNER' WHERE id = ?1").bind(winner.id).run();
    await db.prepare("UPDATE friends_participants SET status = 'WINNER' WHERE id = ?1").bind(winner.participant_id).run();
    await logFriendsEvent(db, {
      competitionId: competition.id,
      eventType: "friends_winner",
      lifeId: winner.id,
      message: "Competizione conclusa: vincitore determinato.",
      participantId: winner.participant_id,
      userId: winner.user_id,
    });

    const participants = await listFriendsParticipants(db, competition.id);
    const winnerParticipant = participants.find((participant) => participant.id === winner.participant_id);

    return {
      completed: true,
      shared: false,
      winners: winnerParticipant
        ? [{
            alive_lives: Math.max(winnerParticipant.alive_lives, 1),
            decisive_lives: 1,
            participant_id: winnerParticipant.id,
            user_id: winnerParticipant.user_id,
            username: winnerParticipant.username,
          }]
        : [],
    };
  } else {
    const decisiveLivesByParticipant = new Map<string, number>();
    decisiveLives.forEach((life) => {
      decisiveLivesByParticipant.set(life.participant_id, (decisiveLivesByParticipant.get(life.participant_id) ?? 0) + 1);
    });

    for (const participantId of decisiveLivesByParticipant.keys()) {
      await db.prepare("UPDATE friends_participants SET status = 'WINNER' WHERE id = ?1").bind(participantId).run();
    }

    await logFriendsEvent(db, {
      competitionId: competition.id,
      eventType: decisiveLivesByParticipant.size > 0 ? "friends_shared_winners" : "friends_no_survivors",
      message: decisiveLivesByParticipant.size > 0
        ? "Competizione conclusa: vincitori condivisi determinati."
        : "Competizione conclusa: nessuna vita sopravvissuta.",
    });

    const participants = await listFriendsParticipants(db, competition.id);
    const winners = participants
      .filter((participant) => decisiveLivesByParticipant.has(participant.id))
      .map((participant) => ({
        alive_lives: participant.alive_lives,
        decisive_lives: decisiveLivesByParticipant.get(participant.id) ?? 0,
        participant_id: participant.id,
        user_id: participant.user_id,
        username: participant.username,
      }));

    return {
      completed: true,
      shared: winners.length > 1,
      winners,
    };
  }
}

async function ensureNextFriendsRound(db: D1Database, competition: FriendsCompetitionRow, currentRound: FriendsRoundRow) {
  const nextRoundNumber = currentRound.round_number + 1;
  const now = nowIso();
  const suggestedNextFixture = getNextAutomaticFixtureMatchday(
    currentRound.fixture_competition_id,
    currentRound.fixture_matchday,
  );
  const suggestedFixtureCompetitionId = suggestedNextFixture?.competition.id ?? currentRound.fixture_competition_id ?? null;
  const suggestedFixtureMatchday = suggestedNextFixture?.matchday.number ?? null;

  await db
    .prepare(
      `INSERT OR IGNORE INTO friends_rounds (
        id, competition_id, round_number, deadline_at, status, fixture_competition_id, fixture_matchday,
        created_at, updated_at, calculated_at
      ) VALUES (?1, ?2, ?3, NULL, 'PENDING', ?4, ?5, ?6, ?6, NULL)`,
    )
    .bind(
      crypto.randomUUID(),
      competition.id,
      nextRoundNumber,
      suggestedFixtureCompetitionId,
      suggestedFixtureMatchday,
      now,
    )
    .run();
  await db
    .prepare("UPDATE friends_competitions SET status = 'ACTIVE', current_round_number = ?1, updated_at = ?2 WHERE id = ?3")
    .bind(nextRoundNumber, now, competition.id)
    .run();
}

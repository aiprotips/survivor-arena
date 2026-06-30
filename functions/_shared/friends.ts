/// <reference types="@cloudflare/workers-types" />

import {
  getArenaError,
  getTeam,
  isDeadlinePassed,
  listTeams,
  type ArenaError,
  type MatchResult,
  type SelectionSide,
} from "./arena";
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
  name: string;
  owner_user_id: string;
  owner_username?: string;
  published_at: string | null;
  rules: string | null;
  status: FriendsCompetitionStatus;
  updated_at: string;
};

export type FriendsRoundRow = {
  calculated_at: string | null;
  competition_id: string;
  created_at: string;
  deadline_at: string | null;
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
};

type FriendsMatchInput = {
  awayTeamId: string;
  homeTeamId: string;
  isActive: boolean;
};

export type FriendsCompetitionInput = {
  deadlineAt: string | null;
  description: string | null;
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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      published_at TEXT,
      completed_at TEXT
    )`,
  );
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

  friendsSchemaReady = true;
}

export function parseFriendsCompetitionInput(body: Record<string, unknown>): FriendsCompetitionInput {
  const name = toText(body.name);
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
  assertFriends(matches.length > 0, "Aggiungi almeno un match al round iniziale.");

  return {
    deadlineAt: toOptionalText(body.deadlineAt ?? body.deadline_at),
    description: toOptionalText(body.description),
    matches,
    name,
    rules: toOptionalText(body.rules),
  };
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

  const now = nowIso();
  const competitionId = crypto.randomUUID();
  const roundId = crypto.randomUUID();
  const status: FriendsCompetitionStatus = "ACTIVE";
  const roundStatus: FriendsRoundStatus = "OPEN";

  await db
    .prepare(
      `INSERT INTO friends_competitions (
        id, owner_user_id, name, description, rules, invite_code, status, current_round_number,
        created_at, updated_at, published_at, completed_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8, ?8, ?9, NULL)`,
    )
    .bind(
      competitionId,
      ownerUserId,
      input.name,
      input.description,
      input.rules,
      createInviteCode(),
      status,
      now,
      now,
    )
    .run();

  await db
    .prepare(
      `INSERT INTO friends_rounds (
        id, competition_id, round_number, deadline_at, status, created_at, updated_at, calculated_at
      ) VALUES (?1, ?2, 1, ?3, ?4, ?5, ?5, NULL)`,
    )
    .bind(roundId, competitionId, input.deadlineAt, roundStatus, now)
    .run();

  for (const match of input.matches) {
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
      `SELECT id, competition_id, round_number, deadline_at, status, created_at, updated_at, calculated_at
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
      `SELECT id, competition_id, round_number, deadline_at, status, created_at, updated_at, calculated_at
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
      `SELECT id, competition_id, round_number, deadline_at, status, created_at, updated_at, calculated_at
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
  const publicChoices = currentRound && !canChangeChoices(currentRound) ? await listPublicChoices(db, currentRound.id) : [];
  const activeParticipant = participant?.status === "REMOVED" ? null : participant;
  const canJoin = competition.status === "ACTIVE" && !activeParticipant && await canUserJoin(db, competition, userId);

  assertFriends(isOwner || activeParticipant || canJoin, "Non hai accesso a questa competizione Friends.", 403);

  return {
    ...competition,
    can_join: canJoin,
    current_round: currentRound,
    events,
    invitation_count: invitationCount,
    is_owner: isOwner,
    is_participant: !!activeParticipant,
    participant: activeParticipant
      ? {
          ...activeParticipant,
          lives: await listParticipantLives(db, activeParticipant.id),
        }
      : null,
    participants,
    public_choices: publicChoices,
    rounds: hydratedRounds,
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

  return getFriendsCompetitionBundle(db, competition.id, organizerId);
}

export async function deleteFriendsCompetition(db: D1Database, competitionId: string, organizerId: string) {
  await ensureFriendsSchema(db);
  const competition = await assertOwner(db, competitionId, organizerId);

  await db.prepare("DELETE FROM friends_events WHERE competition_id = ?1").bind(competition.id).run();
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

  for (const match of matches) {
    const result = resultMap.get(match.id);
    assertFriends(result && result !== "PENDING", `Inserisci risultato per ${match.home_team} vs ${match.away_team}.`);
    await db.prepare("UPDATE friends_matches SET result = ?1, updated_at = ?2 WHERE id = ?3").bind(result, nowIso(), match.id).run();
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

    if (selection) {
      await db
        .prepare("UPDATE friends_selections SET status = ?1, updated_at = ?2 WHERE id = ?3")
        .bind(isVoid ? "VOID" : survives ? "SURVIVED" : "ELIMINATED", nowIso(), selection.id)
        .run();
    }

    if (!survives) {
      await db.prepare("UPDATE friends_lives SET status = 'ELIMINATED', eliminated_at = ?1 WHERE id = ?2").bind(nowIso(), life.id).run();
    }
  }

  await db.prepare("UPDATE friends_rounds SET status = 'CALCULATED', calculated_at = ?1, updated_at = ?1 WHERE id = ?2").bind(nowIso(), round.id).run();
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

  if (survivors.length <= 1) {
    await completeFriendsCompetition(db, competition, survivors);
  } else {
    await ensureNextFriendsRound(db, competition, round);
  }

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

async function completeFriendsCompetition(db: D1Database, competition: FriendsCompetitionRow, survivors: FriendsLifeRow[]) {
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
  } else {
    await logFriendsEvent(db, {
      competitionId: competition.id,
      eventType: "friends_no_survivors",
      message: "Competizione conclusa: nessuna vita sopravvissuta.",
    });
  }
}

async function ensureNextFriendsRound(db: D1Database, competition: FriendsCompetitionRow, currentRound: FriendsRoundRow) {
  const nextRoundNumber = currentRound.round_number + 1;
  const now = nowIso();

  await db
    .prepare(
      `INSERT OR IGNORE INTO friends_rounds (
        id, competition_id, round_number, deadline_at, status, created_at, updated_at, calculated_at
      ) VALUES (?1, ?2, ?3, NULL, 'PENDING', ?4, ?4, NULL)`,
    )
    .bind(crypto.randomUUID(), competition.id, nextRoundNumber, now)
    .run();
  await db
    .prepare("UPDATE friends_competitions SET status = 'ACTIVE', current_round_number = ?1, updated_at = ?2 WHERE id = ?3")
    .bind(nextRoundNumber, now, competition.id)
    .run();
}

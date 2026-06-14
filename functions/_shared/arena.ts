/// <reference types="@cloudflare/workers-types" />

export type TournamentStatus = "PENDING" | "ACTIVE" | "LOCKED" | "COMPLETED" | "CANCELLED";
export type RoundStatus = "PENDING" | "OPEN" | "LOCKED" | "CALCULATED";
export type MatchResult = "PENDING" | "HOME_WIN" | "DRAW" | "AWAY_WIN" | "POSTPONED" | "CANCELLED";
export type SelectionSide = "HOME" | "AWAY";

export type TournamentRow = {
  completed_at: string | null;
  created_at: string;
  created_by: string | null;
  current_round_number: number;
  description: string | null;
  entry_cost: number;
  extra_life_cost: number;
  id: string;
  initial_lives: number;
  max_lives_per_user: number | null;
  max_participants: number | null;
  name: string;
  prize_pool: number;
  prize_pool_percentage: number;
  published_at: string | null;
  rules: string | null;
  site_percentage: number;
  site_pool: number;
  status: TournamentStatus;
  unlimited_lives: number;
  unlimited_participants: number;
  updated_at: string;
};

export type RoundRow = {
  calculated_at: string | null;
  created_at: string;
  deadline_at: string | null;
  id: string;
  round_number: number;
  status: RoundStatus;
  tournament_id: string;
  updated_at: string;
};

export type MatchRow = {
  away_team: string;
  created_at: string;
  home_team: string;
  id: string;
  is_locked: number;
  is_selectable: number;
  result: MatchResult;
  round_id: string;
  tournament_id: string;
  updated_at: string;
};

export type RegistrationRow = {
  entry_cost: number;
  id: string;
  initial_lives: number;
  joined_at: string;
  left_at: string | null;
  purchased_lives: number;
  status: "ACTIVE" | "LEFT" | "ELIMINATED" | "WINNER";
  tournament_id: string;
  user_id: string;
};

export type LifeRow = {
  created_at: string;
  current_cycle: number;
  eliminated_at: string | null;
  id: string;
  life_number: number;
  registration_id: string;
  status: "ALIVE" | "ELIMINATED" | "WINNER";
  tournament_id: string;
  user_id: string;
};

export type SelectionRow = {
  created_at: string;
  cycle_number: number;
  id: string;
  life_id: string;
  match_id: string;
  round_id: string;
  selected_side: SelectionSide;
  selected_team: string;
  status: "PENDING" | "SURVIVED" | "ELIMINATED" | "VOID";
  tournament_id: string;
  updated_at: string;
};

export type TournamentInput = {
  description: string | null;
  entryCost: number;
  extraLifeCost: number;
  initialLives: number;
  maxLivesPerUser: number | null;
  maxParticipants: number | null;
  name: string;
  prizePoolPercentage: number;
  rules: string | null;
  unlimitedLives: boolean;
  unlimitedParticipants: boolean;
};

export type ArenaError = {
  message: string;
  status: number;
};

const tournamentSelect = `SELECT
  id,
  name,
  description,
  rules,
  entry_cost,
  initial_lives,
  extra_life_cost,
  max_lives_per_user,
  max_participants,
  unlimited_participants,
  unlimited_lives,
  prize_pool_percentage,
  site_percentage,
  status,
  current_round_number,
  prize_pool,
  site_pool,
  created_by,
  created_at,
  updated_at,
  published_at,
  completed_at
 FROM tournaments`;

function nowIso() {
  return new Date().toISOString();
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toOptionalString(value: unknown) {
  const text = toStringValue(value);

  return text ? text : null;
}

function toInteger(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function toBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function assertArena(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) {
    throw {
      message,
      status,
    } satisfies ArenaError;
  }
}

export function getArenaError(error: unknown, fallback = "Operazione non riuscita.") {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    "status" in error &&
    typeof error.message === "string" &&
    typeof error.status === "number"
  ) {
    return error as ArenaError;
  }

  return {
    message: fallback,
    status: 500,
  };
}

export function parseTournamentInput(body: Record<string, unknown>): TournamentInput {
  const name = toStringValue(body.name);
  const entryCost = toInteger(body.entryCost ?? body.entry_cost);
  const initialLives = toInteger(body.initialLives ?? body.initial_lives, 1);
  const extraLifeCost = toInteger(body.extraLifeCost ?? body.extra_life_cost);
  const unlimitedParticipants = toBoolean(
    body.unlimitedParticipants ?? body.unlimited_participants,
  );
  const unlimitedLives = toBoolean(body.unlimitedLives ?? body.unlimited_lives);
  const maxParticipants = unlimitedParticipants
    ? null
    : toInteger(body.maxParticipants ?? body.max_participants);
  const maxLivesPerUser = unlimitedLives
    ? null
    : toInteger(body.maxLivesPerUser ?? body.max_lives_per_user);
  const prizePoolPercentage = toInteger(
    body.prizePoolPercentage ?? body.prize_pool_percentage,
    80,
  );

  assertArena(name.length >= 3, "Inserisci un nome torneo valido.");
  assertArena(entryCost >= 0, "Il costo iscrizione deve essere maggiore o uguale a zero.");
  assertArena(initialLives >= 1, "Le vite iniziali devono essere almeno una.");
  assertArena(extraLifeCost >= 0, "Il costo vita extra deve essere maggiore o uguale a zero.");
  assertArena(
    unlimitedParticipants || (maxParticipants !== null && maxParticipants >= 1),
    "Imposta un limite partecipanti valido oppure abilita partecipanti illimitati.",
  );
  assertArena(
    unlimitedLives || (maxLivesPerUser !== null && maxLivesPerUser >= initialLives),
    "Il numero massimo vite deve essere almeno pari alle vite iniziali.",
  );
  assertArena(
    prizePoolPercentage >= 0 && prizePoolPercentage <= 100,
    "La percentuale montepremi deve essere tra 0 e 100.",
  );

  return {
    description: toOptionalString(body.description),
    entryCost,
    extraLifeCost,
    initialLives,
    maxLivesPerUser,
    maxParticipants,
    name,
    prizePoolPercentage,
    rules: toOptionalString(body.rules),
    unlimitedLives,
    unlimitedParticipants,
  };
}

export async function ensureWallet(db: D1Database, userId: string) {
  const now = nowIso();

  await db
    .prepare(
      `INSERT OR IGNORE INTO user_wallets (user_id, balance, created_at, updated_at)
       VALUES (?1, 0, ?2, ?2)`,
    )
    .bind(userId, now)
    .run();
}

export async function getWalletBalance(db: D1Database, userId: string) {
  await ensureWallet(db, userId);

  const row = await db
    .prepare("SELECT balance FROM user_wallets WHERE user_id = ?1")
    .bind(userId)
    .first<{ balance: number }>();

  return row?.balance ?? 0;
}

export async function changeWalletBalance(
  db: D1Database,
  input: {
    amount: number;
    description: string;
    movementType: "ENTRY_FEE" | "LIFE_PURCHASE" | "REFUND" | "PRIZE" | "ADMIN_ADJUSTMENT";
    tournamentId?: string | null;
    userId: string;
  },
) {
  await ensureWallet(db, input.userId);

  const currentBalance = await getWalletBalance(db, input.userId);
  const nextBalance = currentBalance + input.amount;

  assertArena(nextBalance >= 0, "Coppe insufficienti.", 409);

  const now = nowIso();
  await db
    .prepare("UPDATE user_wallets SET balance = ?1, updated_at = ?2 WHERE user_id = ?3")
    .bind(nextBalance, now, input.userId)
    .run();

  await db
    .prepare(
      `INSERT INTO wallet_movements (
        id, user_id, tournament_id, amount, balance_after, movement_type, description, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
    )
    .bind(
      crypto.randomUUID(),
      input.userId,
      input.tournamentId ?? null,
      input.amount,
      nextBalance,
      input.movementType,
      input.description,
      now,
    )
    .run();

  return nextBalance;
}

export async function logArenaEvent(
  db: D1Database,
  input: {
    eventType: string;
    lifeId?: string | null;
    matchId?: string | null;
    message: string;
    metadata?: Record<string, unknown>;
    registrationId?: string | null;
    roundId?: string | null;
    tournamentId?: string | null;
    userId?: string | null;
  },
) {
  await db
    .prepare(
      `INSERT INTO arena_events (
        id, tournament_id, user_id, registration_id, life_id, round_id, match_id,
        event_type, message, metadata_json, created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
    )
    .bind(
      crypto.randomUUID(),
      input.tournamentId ?? null,
      input.userId ?? null,
      input.registrationId ?? null,
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

export async function createTournament(
  db: D1Database,
  input: TournamentInput,
  adminId: string,
) {
  const now = nowIso();
  const tournamentId = crypto.randomUUID();
  const roundId = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO tournaments (
        id, name, description, rules, entry_cost, initial_lives, extra_life_cost,
        max_lives_per_user, max_participants, unlimited_participants, unlimited_lives,
        prize_pool_percentage, site_percentage, status, current_round_number,
        prize_pool, site_pool, created_by, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'PENDING', 1, 0, 0, ?14, ?15, ?15)`,
    )
    .bind(
      tournamentId,
      input.name,
      input.description,
      input.rules,
      input.entryCost,
      input.initialLives,
      input.extraLifeCost,
      input.maxLivesPerUser,
      input.maxParticipants,
      input.unlimitedParticipants ? 1 : 0,
      input.unlimitedLives ? 1 : 0,
      input.prizePoolPercentage,
      100 - input.prizePoolPercentage,
      adminId,
      now,
    )
    .run();

  await db
    .prepare(
      `INSERT INTO tournament_rounds (
        id, tournament_id, round_number, deadline_at, status, created_at, updated_at
      ) VALUES (?1, ?2, 1, NULL, 'PENDING', ?3, ?3)`,
    )
    .bind(roundId, tournamentId, now)
    .run();

  await logArenaEvent(db, {
    eventType: "tournament_created",
    message: `Torneo creato: ${input.name}`,
    roundId,
    tournamentId,
    userId: adminId,
  });

  return getTournamentBundle(db, tournamentId);
}

export async function getTournament(db: D1Database, tournamentId: string) {
  return db
    .prepare(`${tournamentSelect} WHERE id = ?1 LIMIT 1`)
    .bind(tournamentId)
    .first<TournamentRow>();
}

export async function listAdminTournaments(db: D1Database) {
  const tournaments = await db
    .prepare(`${tournamentSelect} ORDER BY created_at DESC`)
    .all<TournamentRow>();

  return Promise.all((tournaments.results ?? []).map((tournament) => hydrateTournament(db, tournament)));
}

async function listRounds(db: D1Database, tournamentId: string) {
  const rows = await db
    .prepare(
      `SELECT id, tournament_id, round_number, deadline_at, status, created_at, updated_at, calculated_at
       FROM tournament_rounds
       WHERE tournament_id = ?1
       ORDER BY round_number ASC`,
    )
    .bind(tournamentId)
    .all<RoundRow>();

  return rows.results ?? [];
}

async function listMatches(db: D1Database, roundId: string) {
  const rows = await db
    .prepare(
      `SELECT id, tournament_id, round_id, home_team, away_team, is_selectable, is_locked, result, created_at, updated_at
       FROM tournament_matches
       WHERE round_id = ?1
       ORDER BY created_at ASC`,
    )
    .bind(roundId)
    .all<MatchRow>();

  return rows.results ?? [];
}

async function hydrateTournament(db: D1Database, tournament: TournamentRow) {
  const rounds = await listRounds(db, tournament.id);
  const hydratedRounds = await Promise.all(
    rounds.map(async (round) => ({
      ...round,
      matches: await listMatches(db, round.id),
    })),
  );
  const participants = await getParticipantCount(db, tournament.id);
  const aliveLives = await getAliveLifeCount(db, tournament.id);

  return {
    ...tournament,
    alive_lives: aliveLives,
    participants,
    rounds: hydratedRounds,
  };
}

export async function getTournamentBundle(db: D1Database, tournamentId: string) {
  const tournament = await getTournament(db, tournamentId);
  assertArena(tournament, "Torneo non trovato.", 404);

  return hydrateTournament(db, tournament);
}

export async function updateTournament(
  db: D1Database,
  tournamentId: string,
  input: TournamentInput,
  adminId: string,
) {
  const tournament = await getTournament(db, tournamentId);
  assertArena(tournament, "Torneo non trovato.", 404);
  assertArena(tournament.status === "PENDING", "Puoi modificare i dati principali solo nei tornei pending.", 409);

  const now = nowIso();
  await db
    .prepare(
      `UPDATE tournaments
       SET name = ?1,
           description = ?2,
           rules = ?3,
           entry_cost = ?4,
           initial_lives = ?5,
           extra_life_cost = ?6,
           max_lives_per_user = ?7,
           max_participants = ?8,
           unlimited_participants = ?9,
           unlimited_lives = ?10,
           prize_pool_percentage = ?11,
           site_percentage = ?12,
           updated_at = ?13
       WHERE id = ?14`,
    )
    .bind(
      input.name,
      input.description,
      input.rules,
      input.entryCost,
      input.initialLives,
      input.extraLifeCost,
      input.maxLivesPerUser,
      input.maxParticipants,
      input.unlimitedParticipants ? 1 : 0,
      input.unlimitedLives ? 1 : 0,
      input.prizePoolPercentage,
      100 - input.prizePoolPercentage,
      now,
      tournamentId,
    )
    .run();

  await logArenaEvent(db, {
    eventType: "tournament_updated",
    message: `Torneo modificato: ${input.name}`,
    tournamentId,
    userId: adminId,
  });

  return getTournamentBundle(db, tournamentId);
}

export async function deleteTournament(db: D1Database, tournamentId: string, adminId: string) {
  const tournament = await getTournament(db, tournamentId);
  assertArena(tournament, "Torneo non trovato.", 404);
  assertArena(tournament.status === "PENDING", "Puoi eliminare solo tornei pending.", 409);

  await logArenaEvent(db, {
    eventType: "tournament_deleted",
    message: `Torneo eliminato: ${tournament.name}`,
    tournamentId,
    userId: adminId,
  });

  await db.prepare("DELETE FROM tournaments WHERE id = ?1").bind(tournamentId).run();
}

export async function updateRoundSettings(
  db: D1Database,
  input: {
    adminId: string;
    deadlineAt: string | null;
    roundId: string;
  },
) {
  const round = await getRound(db, input.roundId);
  assertArena(round, "Round non trovato.", 404);
  assertArena(round.status !== "CALCULATED", "Round già calcolato.", 409);

  await db
    .prepare("UPDATE tournament_rounds SET deadline_at = ?1, updated_at = ?2 WHERE id = ?3")
    .bind(input.deadlineAt, nowIso(), input.roundId)
    .run();

  await logArenaEvent(db, {
    eventType: "round_deadline_updated",
    message: `Deadline round ${round.round_number} aggiornata.`,
    roundId: round.id,
    tournamentId: round.tournament_id,
    userId: input.adminId,
  });

  return getTournamentBundle(db, round.tournament_id);
}

export async function getRound(db: D1Database, roundId: string) {
  return db
    .prepare(
      `SELECT id, tournament_id, round_number, deadline_at, status, created_at, updated_at, calculated_at
       FROM tournament_rounds
       WHERE id = ?1
       LIMIT 1`,
    )
    .bind(roundId)
    .first<RoundRow>();
}

export async function addMatch(
  db: D1Database,
  input: {
    adminId: string;
    awayTeam: string;
    homeTeam: string;
    isLocked: boolean;
    isSelectable: boolean;
    roundId: string;
  },
) {
  const round = await getRound(db, input.roundId);
  assertArena(round, "Round non trovato.", 404);
  assertArena(round.status !== "CALCULATED", "Round già calcolato.", 409);

  const homeTeam = input.homeTeam.trim();
  const awayTeam = input.awayTeam.trim();
  assertArena(homeTeam.length >= 2 && awayTeam.length >= 2, "Inserisci entrambe le squadre.");
  assertArena(homeTeam.toLowerCase() !== awayTeam.toLowerCase(), "Le squadre devono essere diverse.");

  const now = nowIso();
  const matchId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO tournament_matches (
        id, tournament_id, round_id, home_team, away_team, is_selectable, is_locked, result, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'PENDING', ?8, ?8)`,
    )
    .bind(
      matchId,
      round.tournament_id,
      round.id,
      homeTeam,
      awayTeam,
      input.isSelectable ? 1 : 0,
      input.isLocked ? 1 : 0,
      now,
    )
    .run();

  await logArenaEvent(db, {
    eventType: "match_created",
    matchId,
    message: `${homeTeam} vs ${awayTeam} aggiunto.`,
    roundId: round.id,
    tournamentId: round.tournament_id,
    userId: input.adminId,
  });

  return getTournamentBundle(db, round.tournament_id);
}

export async function updateMatch(
  db: D1Database,
  input: {
    adminId: string;
    awayTeam: string;
    homeTeam: string;
    isLocked: boolean;
    isSelectable: boolean;
    matchId: string;
  },
) {
  const match = await getMatch(db, input.matchId);
  assertArena(match, "Incontro non trovato.", 404);

  const round = await getRound(db, match.round_id);
  assertArena(round, "Round non trovato.", 404);
  assertArena(round.status !== "CALCULATED", "Round già calcolato.", 409);

  const homeTeam = input.homeTeam.trim();
  const awayTeam = input.awayTeam.trim();
  assertArena(homeTeam.length >= 2 && awayTeam.length >= 2, "Inserisci entrambe le squadre.");
  assertArena(homeTeam.toLowerCase() !== awayTeam.toLowerCase(), "Le squadre devono essere diverse.");

  await db
    .prepare(
      `UPDATE tournament_matches
       SET home_team = ?1,
           away_team = ?2,
           is_selectable = ?3,
           is_locked = ?4,
           updated_at = ?5
       WHERE id = ?6`,
    )
    .bind(
      homeTeam,
      awayTeam,
      input.isSelectable ? 1 : 0,
      input.isLocked ? 1 : 0,
      nowIso(),
      input.matchId,
    )
    .run();

  await logArenaEvent(db, {
    eventType: "match_updated",
    matchId: input.matchId,
    message: `${homeTeam} vs ${awayTeam} modificato.`,
    roundId: match.round_id,
    tournamentId: match.tournament_id,
    userId: input.adminId,
  });

  return getTournamentBundle(db, match.tournament_id);
}

export async function deleteMatch(db: D1Database, matchId: string, adminId: string) {
  const match = await getMatch(db, matchId);
  assertArena(match, "Incontro non trovato.", 404);

  const round = await getRound(db, match.round_id);
  assertArena(round, "Round non trovato.", 404);
  assertArena(round.status !== "CALCULATED", "Round già calcolato.", 409);

  await db.prepare("DELETE FROM tournament_matches WHERE id = ?1").bind(matchId).run();

  await logArenaEvent(db, {
    eventType: "match_deleted",
    matchId,
    message: `${match.home_team} vs ${match.away_team} rimosso.`,
    roundId: match.round_id,
    tournamentId: match.tournament_id,
    userId: adminId,
  });

  return getTournamentBundle(db, match.tournament_id);
}

export async function getMatch(db: D1Database, matchId: string) {
  return db
    .prepare(
      `SELECT id, tournament_id, round_id, home_team, away_team, is_selectable, is_locked, result, created_at, updated_at
       FROM tournament_matches
       WHERE id = ?1
       LIMIT 1`,
    )
    .bind(matchId)
    .first<MatchRow>();
}

export async function publishTournament(db: D1Database, tournamentId: string, adminId: string) {
  const bundle = await getTournamentBundle(db, tournamentId);
  assertArena(bundle.status === "PENDING", "Il torneo non è più pending.", 409);

  const firstRound = bundle.rounds.find((round) => round.round_number === 1);
  assertArena(firstRound, "Configura il Round 1 prima di pubblicare.", 409);
  assertArena(firstRound.deadline_at, "Imposta la deadline del Round 1 prima di pubblicare.", 409);
  assertArena(
    firstRound.matches.some((match) => match.is_selectable && !match.is_locked),
    "Aggiungi almeno un incontro selezionabile.",
    409,
  );

  const now = nowIso();
  await db
    .prepare(
      `UPDATE tournaments
       SET status = 'ACTIVE', published_at = ?1, updated_at = ?1
       WHERE id = ?2`,
    )
    .bind(now, tournamentId)
    .run();
  await db
    .prepare("UPDATE tournament_rounds SET status = 'OPEN', updated_at = ?1 WHERE id = ?2")
    .bind(now, firstRound.id)
    .run();

  await logArenaEvent(db, {
    eventType: "tournament_published",
    message: `Torneo pubblicato: ${bundle.name}`,
    roundId: firstRound.id,
    tournamentId,
    userId: adminId,
  });

  return getTournamentBundle(db, tournamentId);
}

export async function openCurrentRound(db: D1Database, tournamentId: string, adminId: string) {
  const tournament = await getTournament(db, tournamentId);
  assertArena(tournament, "Torneo non trovato.", 404);
  assertArena(tournament.status === "ACTIVE", "Il torneo non è pronto per aprire un round.", 409);

  const round = await getCurrentRound(db, tournament);
  assertArena(round, "Round corrente non trovato.", 404);
  assertArena(round.status === "PENDING", "Il round corrente non è pending.", 409);
  assertArena(round.deadline_at, `Imposta la deadline del Round ${round.round_number}.`, 409);

  const matches = await listMatches(db, round.id);
  assertArena(
    matches.some((match) => match.is_selectable && !match.is_locked),
    "Aggiungi almeno un incontro selezionabile.",
    409,
  );

  const now = nowIso();
  await db
    .prepare("UPDATE tournament_rounds SET status = 'OPEN', updated_at = ?1 WHERE id = ?2")
    .bind(now, round.id)
    .run();
  await db
    .prepare("UPDATE tournaments SET status = 'ACTIVE', updated_at = ?1 WHERE id = ?2")
    .bind(now, tournamentId)
    .run();

  await logArenaEvent(db, {
    eventType: "round_opened",
    message: `Round ${round.round_number} aperto.`,
    roundId: round.id,
    tournamentId,
    userId: adminId,
  });

  return getTournamentBundle(db, tournamentId);
}

export async function lockCurrentRound(db: D1Database, tournamentId: string, adminId: string) {
  const tournament = await getTournament(db, tournamentId);
  assertArena(tournament, "Torneo non trovato.", 404);
  assertArena(["ACTIVE", "LOCKED"].includes(tournament.status), "Torneo non in corso.", 409);

  const round = await getCurrentRound(db, tournament);
  assertArena(round, "Round corrente non trovato.", 404);
  assertArena(round.status !== "CALCULATED", "Round già calcolato.", 409);

  const now = nowIso();
  await db
    .prepare("UPDATE tournament_rounds SET status = 'LOCKED', updated_at = ?1 WHERE id = ?2")
    .bind(now, round.id)
    .run();
  await db
    .prepare("UPDATE tournaments SET status = 'LOCKED', updated_at = ?1 WHERE id = ?2")
    .bind(now, tournamentId)
    .run();

  await logArenaEvent(db, {
    eventType: "choices_locked",
    message: `Scelte bloccate per Round ${round.round_number}.`,
    roundId: round.id,
    tournamentId,
    userId: adminId,
  });

  return getTournamentBundle(db, tournamentId);
}

export async function getCurrentRound(db: D1Database, tournament: TournamentRow) {
  return db
    .prepare(
      `SELECT id, tournament_id, round_number, deadline_at, status, created_at, updated_at, calculated_at
       FROM tournament_rounds
       WHERE tournament_id = ?1 AND round_number = ?2
       LIMIT 1`,
    )
    .bind(tournament.id, tournament.current_round_number)
    .first<RoundRow>();
}

export function isDeadlinePassed(deadlineAt: string | null) {
  return !!deadlineAt && Number.isFinite(Date.parse(deadlineAt)) && Date.parse(deadlineAt) <= Date.now();
}

function canChangeRoundChoices(round: RoundRow) {
  return round.status === "OPEN" && !isDeadlinePassed(round.deadline_at);
}

async function getParticipantCount(db: D1Database, tournamentId: string) {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM tournament_registrations
       WHERE tournament_id = ?1 AND status = 'ACTIVE'`,
    )
    .bind(tournamentId)
    .first<{ count: number }>();

  return row?.count ?? 0;
}

async function getAliveLifeCount(db: D1Database, tournamentId: string) {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM tournament_lives
       WHERE tournament_id = ?1 AND status = 'ALIVE'`,
    )
    .bind(tournamentId)
    .first<{ count: number }>();

  return row?.count ?? 0;
}

export async function listPublicTournaments(db: D1Database, userId: string) {
  const rows = await db
    .prepare(`${tournamentSelect} WHERE status IN ('ACTIVE', 'LOCKED') ORDER BY published_at DESC`)
    .all<TournamentRow>();

  const tournaments = await Promise.all(
    (rows.results ?? []).map(async (tournament) => {
      const round = await getCurrentRound(db, tournament);
      const participants = await getParticipantCount(db, tournament.id);
      const registration = await getRegistration(db, tournament.id, userId);

      return {
        ...tournament,
        current_round: round,
        is_joined: registration?.status === "ACTIVE",
        participants,
      };
    }),
  );

  return tournaments;
}

export async function getRegistration(db: D1Database, tournamentId: string, userId: string) {
  return db
    .prepare(
      `SELECT id, tournament_id, user_id, status, initial_lives, purchased_lives, entry_cost, joined_at, left_at
       FROM tournament_registrations
       WHERE tournament_id = ?1 AND user_id = ?2
       LIMIT 1`,
    )
    .bind(tournamentId, userId)
    .first<RegistrationRow>();
}

async function getRegistrationById(db: D1Database, registrationId: string) {
  return db
    .prepare(
      `SELECT id, tournament_id, user_id, status, initial_lives, purchased_lives, entry_cost, joined_at, left_at
       FROM tournament_registrations
       WHERE id = ?1
       LIMIT 1`,
    )
    .bind(registrationId)
    .first<RegistrationRow>();
}

async function listUserLives(db: D1Database, registrationId: string) {
  const rows = await db
    .prepare(
      `SELECT id, registration_id, tournament_id, user_id, life_number, status, current_cycle, created_at, eliminated_at
       FROM tournament_lives
       WHERE registration_id = ?1
       ORDER BY life_number ASC`,
    )
    .bind(registrationId)
    .all<LifeRow>();

  return rows.results ?? [];
}

async function listSelectionsForLives(db: D1Database, lifeIds: string[]) {
  if (lifeIds.length === 0) {
    return [];
  }

  const placeholders = lifeIds.map((_, index) => `?${index + 1}`).join(", ");
  const rows = await db
    .prepare(
      `SELECT id, life_id, tournament_id, round_id, match_id, selected_team, selected_side, cycle_number, status, created_at, updated_at
       FROM life_selections
       WHERE life_id IN (${placeholders})
       ORDER BY created_at ASC`,
    )
    .bind(...lifeIds)
    .all<SelectionRow>();

  return rows.results ?? [];
}

export async function getUserTournamentDetails(
  db: D1Database,
  tournamentId: string,
  userId: string,
) {
  const bundle = await getTournamentBundle(db, tournamentId);
  assertArena(bundle.status !== "PENDING", "Torneo non ancora pubblico.", 404);

  const registration = await getRegistration(db, tournamentId, userId);
  const lives = registration ? await listUserLives(db, registration.id) : [];
  const selections = await listSelectionsForLives(db, lives.map((life) => life.id));
  const currentRound = bundle.rounds.find(
    (round) => round.round_number === bundle.current_round_number,
  );
  const publicChoices = currentRound && !canChangeRoundChoices(currentRound)
    ? await listPublicChoices(db, currentRound.id)
    : [];

  return {
    ...bundle,
    public_choices: publicChoices,
    registration,
    user_lives: lives.map((life) => ({
      ...life,
      selections: selections.filter((selection) => selection.life_id === life.id),
    })),
  };
}

export async function listPublicChoices(db: D1Database, roundId: string) {
  const rows = await db
    .prepare(
      `SELECT
        u.username,
        u.email,
        l.life_number,
        s.selected_team,
        s.status,
        s.updated_at
       FROM life_selections s
       INNER JOIN tournament_lives l ON l.id = s.life_id
       INNER JOIN users u ON u.id = l.user_id
       WHERE s.round_id = ?1
       ORDER BY u.username ASC, l.life_number ASC`,
    )
    .bind(roundId)
    .all<{
      email: string;
      life_number: number;
      selected_team: string;
      status: string;
      updated_at: string;
      username: string;
    }>();

  return rows.results ?? [];
}

export async function joinTournament(db: D1Database, tournamentId: string, userId: string) {
  const tournament = await getTournament(db, tournamentId);
  assertArena(tournament, "Torneo non trovato.", 404);
  assertArena(tournament.status === "ACTIVE", "Il torneo non è aperto alle iscrizioni.", 409);
  assertArena(tournament.current_round_number === 1, "Iscrizioni chiuse.", 409);

  const firstRound = await getCurrentRound(db, tournament);
  assertArena(firstRound, "Round 1 non configurato.", 409);
  assertArena(canChangeRoundChoices(firstRound), "Iscrizioni chiuse.", 409);

  const existing = await getRegistration(db, tournamentId, userId);
  assertArena(!existing || existing.status !== "ACTIVE", "Sei già iscritto a questa Arena.", 409);

  if (!tournament.unlimited_participants && tournament.max_participants) {
    const participants = await getParticipantCount(db, tournamentId);
    assertArena(participants < tournament.max_participants, "Limite partecipanti raggiunto.", 409);
  }

  await changeWalletBalance(db, {
    amount: -tournament.entry_cost,
    description: `Iscrizione ${tournament.name}`,
    movementType: "ENTRY_FEE",
    tournamentId,
    userId,
  });

  const prizeShare = Math.floor((tournament.entry_cost * tournament.prize_pool_percentage) / 100);
  const siteShare = tournament.entry_cost - prizeShare;
  const now = nowIso();
  const registrationId = existing?.id ?? crypto.randomUUID();

  if (existing) {
    await db
      .prepare(
        `UPDATE tournament_registrations
         SET status = 'ACTIVE',
             initial_lives = ?1,
             purchased_lives = 0,
             entry_cost = ?2,
             joined_at = ?3,
             left_at = NULL
         WHERE id = ?4`,
      )
      .bind(tournament.initial_lives, tournament.entry_cost, now, existing.id)
      .run();
    await db.prepare("DELETE FROM tournament_lives WHERE registration_id = ?1").bind(existing.id).run();
  } else {
    await db
      .prepare(
        `INSERT INTO tournament_registrations (
          id, tournament_id, user_id, status, initial_lives, purchased_lives, entry_cost, joined_at, left_at
        ) VALUES (?1, ?2, ?3, 'ACTIVE', ?4, 0, ?5, ?6, NULL)`,
      )
      .bind(registrationId, tournamentId, userId, tournament.initial_lives, tournament.entry_cost, now)
      .run();
  }

  for (let lifeNumber = 1; lifeNumber <= tournament.initial_lives; lifeNumber += 1) {
    await db
      .prepare(
        `INSERT INTO tournament_lives (
          id, registration_id, tournament_id, user_id, life_number, status, current_cycle, created_at, eliminated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, 'ALIVE', 1, ?6, NULL)`,
      )
      .bind(crypto.randomUUID(), registrationId, tournamentId, userId, lifeNumber, now)
      .run();
  }

  await db
    .prepare(
      `UPDATE tournaments
       SET prize_pool = prize_pool + ?1,
           site_pool = site_pool + ?2,
           updated_at = ?3
       WHERE id = ?4`,
    )
    .bind(prizeShare, siteShare, now, tournamentId)
    .run();

  await logArenaEvent(db, {
    eventType: "registration",
    message: `Iscrizione a ${tournament.name}.`,
    registrationId,
    tournamentId,
    userId,
  });

  return getUserTournamentDetails(db, tournamentId, userId);
}

export async function leaveTournament(db: D1Database, tournamentId: string, userId: string) {
  const tournament = await getTournament(db, tournamentId);
  assertArena(tournament, "Torneo non trovato.", 404);
  assertArena(tournament.current_round_number === 1, "Puoi disiscriverti solo prima della deadline del Round 1.", 409);

  const firstRound = await getCurrentRound(db, tournament);
  assertArena(firstRound && canChangeRoundChoices(firstRound), "Disiscrizione chiusa.", 409);

  const registration = await getRegistration(db, tournamentId, userId);
  assertArena(registration?.status === "ACTIVE", "Non sei iscritto a questa Arena.", 404);

  const prizeShare = Math.floor((registration.entry_cost * tournament.prize_pool_percentage) / 100);
  const siteShare = registration.entry_cost - prizeShare;
  const now = nowIso();

  await db
    .prepare("UPDATE tournament_registrations SET status = 'LEFT', left_at = ?1 WHERE id = ?2")
    .bind(now, registration.id)
    .run();
  await db
    .prepare("UPDATE tournament_lives SET status = 'ELIMINATED', eliminated_at = ?1 WHERE registration_id = ?2")
    .bind(now, registration.id)
    .run();
  await db
    .prepare(
      `UPDATE tournaments
       SET prize_pool = MAX(prize_pool - ?1, 0),
           site_pool = MAX(site_pool - ?2, 0),
           updated_at = ?3
       WHERE id = ?4`,
    )
    .bind(prizeShare, siteShare, now, tournamentId)
    .run();

  await changeWalletBalance(db, {
    amount: registration.entry_cost,
    description: `Rimborso ${tournament.name}`,
    movementType: "REFUND",
    tournamentId,
    userId,
  });

  await logArenaEvent(db, {
    eventType: "registration_cancelled",
    message: `Disiscrizione da ${tournament.name}.`,
    registrationId: registration.id,
    tournamentId,
    userId,
  });

  return getUserTournamentDetails(db, tournamentId, userId);
}

export async function buyExtraLife(db: D1Database, tournamentId: string, userId: string) {
  const tournament = await getTournament(db, tournamentId);
  assertArena(tournament, "Torneo non trovato.", 404);
  assertArena(tournament.status === "ACTIVE", "Il torneo non permette acquisto vite ora.", 409);
  assertArena(tournament.current_round_number === 1, "Le vite extra si acquistano solo prima della deadline del Round 1.", 409);

  const firstRound = await getCurrentRound(db, tournament);
  assertArena(firstRound && canChangeRoundChoices(firstRound), "Acquisto vite chiuso.", 409);

  const registration = await getRegistration(db, tournamentId, userId);
  assertArena(registration?.status === "ACTIVE", "Devi essere iscritto per aggiungere una vita.", 409);

  const lives = await listUserLives(db, registration.id);
  assertArena(
    tournament.unlimited_lives || !tournament.max_lives_per_user || lives.length < tournament.max_lives_per_user,
    "Hai raggiunto il numero massimo di vite.",
    409,
  );

  await changeWalletBalance(db, {
    amount: -tournament.extra_life_cost,
    description: `Vita extra ${tournament.name}`,
    movementType: "LIFE_PURCHASE",
    tournamentId,
    userId,
  });

  const prizeShare = Math.floor((tournament.extra_life_cost * tournament.prize_pool_percentage) / 100);
  const siteShare = tournament.extra_life_cost - prizeShare;
  const now = nowIso();
  const nextLifeNumber = Math.max(...lives.map((life) => life.life_number), 0) + 1;

  await db
    .prepare(
      `INSERT INTO tournament_lives (
        id, registration_id, tournament_id, user_id, life_number, status, current_cycle, created_at, eliminated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, 'ALIVE', 1, ?6, NULL)`,
    )
    .bind(crypto.randomUUID(), registration.id, tournamentId, userId, nextLifeNumber, now)
    .run();
  await db
    .prepare("UPDATE tournament_registrations SET purchased_lives = purchased_lives + 1 WHERE id = ?1")
    .bind(registration.id)
    .run();
  await db
    .prepare(
      `UPDATE tournaments
       SET prize_pool = prize_pool + ?1,
           site_pool = site_pool + ?2,
           updated_at = ?3
       WHERE id = ?4`,
    )
    .bind(prizeShare, siteShare, now, tournamentId)
    .run();

  await logArenaEvent(db, {
    eventType: "life_purchase",
    message: `Vita extra acquistata per ${tournament.name}.`,
    registrationId: registration.id,
    tournamentId,
    userId,
  });

  return getUserTournamentDetails(db, tournamentId, userId);
}

export async function chooseLifeTeam(
  db: D1Database,
  input: {
    lifeId: string;
    matchId: string;
    selectedTeam: string;
    userId: string;
  },
) {
  const life = await getUserLife(db, input.lifeId, input.userId);
  assertArena(life, "Vita non trovata.", 404);
  assertArena(life.status === "ALIVE", "Questa vita non è più attiva.", 409);

  const tournament = await getTournament(db, life.tournament_id);
  assertArena(tournament, "Torneo non trovato.", 404);
  assertArena(tournament.status === "ACTIVE", "Le scelte non sono aperte.", 409);

  const round = await getCurrentRound(db, tournament);
  assertArena(round, "Round corrente non trovato.", 404);
  assertArena(canChangeRoundChoices(round), "Le scelte sono chiuse.", 409);

  const match = await getMatch(db, input.matchId);
  assertArena(match && match.round_id === round.id, "Incontro non valido per questo round.", 400);
  assertArena(match.is_selectable === 1 && match.is_locked === 0, "Questo incontro non è selezionabile.", 409);

  const selectedTeam = input.selectedTeam.trim();
  const selectedSide: SelectionSide =
    selectedTeam.toLowerCase() === match.home_team.toLowerCase()
      ? "HOME"
      : selectedTeam.toLowerCase() === match.away_team.toLowerCase()
        ? "AWAY"
        : ("" as SelectionSide);
  assertArena(selectedSide, "La squadra scelta non appartiene all'incontro.", 400);

  const roundMatches = await listMatches(db, round.id);
  const availableTeamsInRound = roundMatches
    .filter((item) => item.is_selectable === 1 && item.is_locked === 0)
    .flatMap((item) => [item.home_team, item.away_team]);
  assertArena(availableTeamsInRound.length > 0, "Non ci sono squadre selezionabili.", 409);

  const existingSelection = await db
    .prepare(
      `SELECT id, life_id, tournament_id, round_id, match_id, selected_team, selected_side, cycle_number, status, created_at, updated_at
       FROM life_selections
       WHERE life_id = ?1 AND round_id = ?2
       LIMIT 1`,
    )
    .bind(life.id, round.id)
    .first<SelectionRow>();

  let cycleNumber = life.current_cycle;
  let usedTeams = await getUsedTeamsForCycle(db, life.id, cycleNumber, round.id);
  let unusedTeams = availableTeamsInRound.filter(
    (team, index, teams) =>
      teams.findIndex((candidate) => candidate.toLowerCase() === team.toLowerCase()) === index &&
      !usedTeams.some((usedTeam) => usedTeam.toLowerCase() === team.toLowerCase()),
  );

  if (unusedTeams.length === 0) {
    cycleNumber += 1;
    usedTeams = [];
    unusedTeams = availableTeamsInRound.filter(
      (team, index, teams) =>
        teams.findIndex((candidate) => candidate.toLowerCase() === team.toLowerCase()) === index,
    );

    await db
      .prepare("UPDATE tournament_lives SET current_cycle = ?1 WHERE id = ?2")
      .bind(cycleNumber, life.id)
      .run();
  }

  assertArena(
    !usedTeams.some((team) => team.toLowerCase() === selectedTeam.toLowerCase()),
    "Questa vita ha già usato questa squadra nel ciclo corrente.",
    409,
  );

  const now = nowIso();
  const eventType = existingSelection ? "choice_updated" : "choice";
  const message = existingSelection
    ? `Scelta modificata: vita ${life.life_number} su ${selectedTeam}.`
    : `Scelta effettuata: vita ${life.life_number} su ${selectedTeam}.`;

  if (existingSelection) {
    await db
      .prepare(
        `UPDATE life_selections
         SET match_id = ?1,
             selected_team = ?2,
             selected_side = ?3,
             cycle_number = ?4,
             updated_at = ?5
         WHERE id = ?6`,
      )
      .bind(match.id, selectedTeam, selectedSide, cycleNumber, now, existingSelection.id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO life_selections (
          id, life_id, tournament_id, round_id, match_id, selected_team,
          selected_side, cycle_number, status, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'PENDING', ?9, ?9)`,
      )
      .bind(
        crypto.randomUUID(),
        life.id,
        life.tournament_id,
        round.id,
        match.id,
        selectedTeam,
        selectedSide,
        cycleNumber,
        now,
      )
      .run();
  }

  await logArenaEvent(db, {
    eventType,
    lifeId: life.id,
    matchId: match.id,
    message,
    registrationId: life.registration_id,
    roundId: round.id,
    tournamentId: life.tournament_id,
    userId: input.userId,
  });

  return getUserTournamentDetails(db, life.tournament_id, input.userId);
}

async function getUserLife(db: D1Database, lifeId: string, userId: string) {
  return db
    .prepare(
      `SELECT id, registration_id, tournament_id, user_id, life_number, status, current_cycle, created_at, eliminated_at
       FROM tournament_lives
       WHERE id = ?1 AND user_id = ?2
       LIMIT 1`,
    )
    .bind(lifeId, userId)
    .first<LifeRow>();
}

async function getUsedTeamsForCycle(
  db: D1Database,
  lifeId: string,
  cycleNumber: number,
  excludeRoundId: string,
) {
  const rows = await db
    .prepare(
      `SELECT selected_team
       FROM life_selections
       WHERE life_id = ?1 AND cycle_number = ?2 AND round_id != ?3 AND status != 'VOID'`,
    )
    .bind(lifeId, cycleNumber, excludeRoundId)
    .all<{ selected_team: string }>();

  return (rows.results ?? []).map((row) => row.selected_team);
}

export async function calculateRound(
  db: D1Database,
  input: {
    adminId: string;
    results: Array<{ matchId: string; result: MatchResult }>;
    roundId: string;
  },
) {
  const round = await getRound(db, input.roundId);
  assertArena(round, "Round non trovato.", 404);
  assertArena(round.status !== "CALCULATED", "Round già calcolato.", 409);

  const tournament = await getTournament(db, round.tournament_id);
  assertArena(tournament, "Torneo non trovato.", 404);

  const matches = await listMatches(db, round.id);
  const resultsByMatchId = new Map(input.results.map((result) => [result.matchId, result.result]));

  for (const match of matches) {
    const result = resultsByMatchId.get(match.id);
    assertArena(result && result !== "PENDING", `Inserisci l'esito per ${match.home_team} vs ${match.away_team}.`);
    await db
      .prepare("UPDATE tournament_matches SET result = ?1, updated_at = ?2 WHERE id = ?3")
      .bind(result, nowIso(), match.id)
      .run();
  }

  const aliveRows = await db
    .prepare(
      `SELECT id, registration_id, tournament_id, user_id, life_number, status, current_cycle, created_at, eliminated_at
       FROM tournament_lives
       WHERE tournament_id = ?1 AND status = 'ALIVE'
       ORDER BY life_number ASC`,
    )
    .bind(tournament.id)
    .all<LifeRow>();
  const livesBeforeCalculation = aliveRows.results ?? [];

  for (const life of livesBeforeCalculation) {
    const selection = await db
      .prepare(
        `SELECT id, life_id, tournament_id, round_id, match_id, selected_team, selected_side, cycle_number, status, created_at, updated_at
         FROM life_selections
         WHERE life_id = ?1 AND round_id = ?2
         LIMIT 1`,
      )
      .bind(life.id, round.id)
      .first<SelectionRow>();

    const selectedMatch = selection
      ? matches.find((match) => match.id === selection.match_id)
      : null;
    const result = selectedMatch ? resultsByMatchId.get(selectedMatch.id) : null;
    const survives =
      !!selection &&
      !!result &&
      (result === "POSTPONED" ||
        result === "CANCELLED" ||
        (result === "HOME_WIN" && selection.selected_side === "HOME") ||
        (result === "AWAY_WIN" && selection.selected_side === "AWAY"));
    const isVoid = result === "POSTPONED" || result === "CANCELLED";
    const selectionStatus = !selection
      ? null
      : isVoid
        ? "VOID"
        : survives
          ? "SURVIVED"
          : "ELIMINATED";

    if (selectionStatus) {
      await db
        .prepare("UPDATE life_selections SET status = ?1, updated_at = ?2 WHERE id = ?3")
        .bind(selectionStatus, nowIso(), selection!.id)
        .run();
    }

    if (!survives) {
      await db
        .prepare("UPDATE tournament_lives SET status = 'ELIMINATED', eliminated_at = ?1 WHERE id = ?2")
        .bind(nowIso(), life.id)
        .run();
    }

    await logArenaEvent(db, {
      eventType: survives ? "life_survived" : "life_eliminated",
      lifeId: life.id,
      matchId: selection?.match_id ?? null,
      message: selection
        ? `Vita ${life.life_number}: ${selection.selected_team} - ${survives ? "sopravvissuta" : "eliminata"}.`
        : `Vita ${life.life_number}: nessuna scelta - eliminata.`,
      registrationId: life.registration_id,
      roundId: round.id,
      tournamentId: tournament.id,
      userId: life.user_id,
    });
  }

  await db
    .prepare("UPDATE tournament_rounds SET status = 'CALCULATED', calculated_at = ?1, updated_at = ?1 WHERE id = ?2")
    .bind(nowIso(), round.id)
    .run();

  const survivors = await getAliveLives(db, tournament.id);

  if (survivors.length <= 1) {
    await completeTournament(db, tournament, survivors, livesBeforeCalculation);
  } else {
    await ensureNextRound(db, tournament, round);
  }

  await logArenaEvent(db, {
    eventType: "round_calculated",
    message: `Round ${round.round_number} calcolato.`,
    roundId: round.id,
    tournamentId: tournament.id,
    userId: input.adminId,
  });

  return getTournamentBundle(db, tournament.id);
}

async function getAliveLives(db: D1Database, tournamentId: string) {
  const rows = await db
    .prepare(
      `SELECT id, registration_id, tournament_id, user_id, life_number, status, current_cycle, created_at, eliminated_at
       FROM tournament_lives
       WHERE tournament_id = ?1 AND status = 'ALIVE'
       ORDER BY created_at ASC`,
    )
    .bind(tournamentId)
    .all<LifeRow>();

  return rows.results ?? [];
}

async function completeTournament(
  db: D1Database,
  tournament: TournamentRow,
  survivors: LifeRow[],
  livesBeforeCalculation: LifeRow[],
) {
  const now = nowIso();

  await db
    .prepare("UPDATE tournaments SET status = 'COMPLETED', completed_at = ?1, updated_at = ?1 WHERE id = ?2")
    .bind(now, tournament.id)
    .run();

  if (survivors.length === 1) {
    const winner = survivors[0]!;
    await db
      .prepare("UPDATE tournament_lives SET status = 'WINNER' WHERE id = ?1")
      .bind(winner.id)
      .run();
    await db
      .prepare("UPDATE tournament_registrations SET status = 'WINNER' WHERE id = ?1")
      .bind(winner.registration_id)
      .run();

    if (tournament.prize_pool > 0) {
      await changeWalletBalance(db, {
        amount: tournament.prize_pool,
        description: `Premio ${tournament.name}`,
        movementType: "PRIZE",
        tournamentId: tournament.id,
        userId: winner.user_id,
      });
    }

    await logArenaEvent(db, {
      eventType: "prize_awarded",
      lifeId: winner.id,
      message: `Premio assegnato a una vita vincente: ${tournament.prize_pool} Coppe.`,
      registrationId: winner.registration_id,
      tournamentId: tournament.id,
      userId: winner.user_id,
    });
    return;
  }

  const candidateUserIds = Array.from(
    new Set(livesBeforeCalculation.map((life) => life.user_id)),
  );
  const share = candidateUserIds.length > 0 ? Math.floor(tournament.prize_pool / candidateUserIds.length) : 0;

  if (share > 0) {
    await Promise.all(
      candidateUserIds.map((userId) =>
        changeWalletBalance(db, {
          amount: share,
          description: `Premio diviso ${tournament.name}`,
          movementType: "PRIZE",
          tournamentId: tournament.id,
          userId,
        }),
      ),
    );
  }

  await logArenaEvent(db, {
    eventType: "prize_split",
    message: `Tutte le vite eliminate. Premio diviso tra ${candidateUserIds.length} utenti.`,
    tournamentId: tournament.id,
  });
}

async function ensureNextRound(db: D1Database, tournament: TournamentRow, currentRound: RoundRow) {
  const nextRoundNumber = currentRound.round_number + 1;
  const now = nowIso();

  await db
    .prepare(
      `INSERT OR IGNORE INTO tournament_rounds (
        id, tournament_id, round_number, deadline_at, status, created_at, updated_at
      ) VALUES (?1, ?2, ?3, NULL, 'PENDING', ?4, ?4)`,
    )
    .bind(crypto.randomUUID(), tournament.id, nextRoundNumber, now)
    .run();
  await db
    .prepare(
      `UPDATE tournaments
       SET status = 'ACTIVE',
           current_round_number = ?1,
           updated_at = ?2
       WHERE id = ?3`,
    )
    .bind(nextRoundNumber, now, tournament.id)
    .run();

  await logArenaEvent(db, {
    eventType: "next_round_created",
    message: `Round ${nextRoundNumber} creato.`,
    tournamentId: tournament.id,
  });
}

export async function listParticipants(
  db: D1Database,
  tournamentId: string,
  query = "",
) {
  const filter = `%${query.trim()}%`;
  const rows = await db
    .prepare(
      `SELECT
        r.id,
        r.status,
        r.joined_at,
        r.initial_lives,
        r.purchased_lives,
        u.username,
        u.email,
        u.user_code,
        COUNT(l.id) AS total_lives,
        SUM(CASE WHEN l.status = 'ALIVE' OR l.status = 'WINNER' THEN 1 ELSE 0 END) AS alive_lives,
        SUM(CASE WHEN l.status = 'ELIMINATED' THEN 1 ELSE 0 END) AS eliminated_lives
       FROM tournament_registrations r
       INNER JOIN users u ON u.id = r.user_id
       LEFT JOIN tournament_lives l ON l.registration_id = r.id
       WHERE r.tournament_id = ?1 AND (?2 = '%%' OR u.username LIKE ?2 OR u.email LIKE ?2)
       GROUP BY r.id
       ORDER BY r.joined_at DESC`,
    )
    .bind(tournamentId, filter)
    .all<{
      alive_lives: number | null;
      eliminated_lives: number | null;
      email: string;
      id: string;
      initial_lives: number;
      joined_at: string;
      purchased_lives: number;
      status: string;
      total_lives: number;
      user_code: string;
      username: string;
    }>();

  const participants = rows.results ?? [];

  return Promise.all(
    participants.map(async (participant) => {
      const registration = await getRegistrationById(db, participant.id);
      const lives = registration ? await listUserLives(db, registration.id) : [];
      const selections = await listSelectionsForLives(db, lives.map((life) => life.id));

      return {
        ...participant,
        alive_lives: participant.alive_lives ?? 0,
        eliminated_lives: participant.eliminated_lives ?? 0,
        lives: lives.map((life) => ({
          ...life,
          selections: selections.filter((selection) => selection.life_id === life.id),
        })),
      };
    }),
  );
}

export async function listArenaEvents(
  db: D1Database,
  filters: {
    eventType?: string;
    query?: string;
    tournamentId?: string;
  } = {},
) {
  const tournamentId = filters.tournamentId?.trim() || null;
  const eventType = filters.eventType?.trim() || null;
  const query = filters.query?.trim() ? `%${filters.query.trim()}%` : null;

  const rows = await db
    .prepare(
      `SELECT
        e.id,
        e.tournament_id,
        e.user_id,
        e.registration_id,
        e.life_id,
        e.round_id,
        e.match_id,
        e.event_type,
        e.message,
        e.metadata_json,
        e.created_at,
        t.name AS tournament_name,
        u.username,
        u.email
       FROM arena_events e
       LEFT JOIN tournaments t ON t.id = e.tournament_id
       LEFT JOIN users u ON u.id = e.user_id
       WHERE (?1 IS NULL OR e.tournament_id = ?1)
         AND (?2 IS NULL OR e.event_type = ?2)
         AND (?3 IS NULL OR u.username LIKE ?3 OR u.email LIKE ?3 OR e.message LIKE ?3)
       ORDER BY e.created_at DESC
       LIMIT 120`,
    )
    .bind(tournamentId, eventType, query)
    .all<{
      created_at: string;
      email: string | null;
      event_type: string;
      id: string;
      life_id: string | null;
      match_id: string | null;
      message: string;
      metadata_json: string | null;
      registration_id: string | null;
      round_id: string | null;
      tournament_id: string | null;
      tournament_name: string | null;
      user_id: string | null;
      username: string | null;
    }>();

  return rows.results ?? [];
}

export async function listUserMovements(db: D1Database, userId: string) {
  const rows = await db
    .prepare(
      `SELECT id, user_id, tournament_id, amount, balance_after, movement_type, description, created_at
       FROM wallet_movements
       WHERE user_id = ?1
       ORDER BY created_at DESC
       LIMIT 50`,
    )
    .bind(userId)
    .all<{
      amount: number;
      balance_after: number;
      created_at: string;
      description: string;
      id: string;
      movement_type: string;
      tournament_id: string | null;
      user_id: string;
    }>();

  return rows.results ?? [];
}

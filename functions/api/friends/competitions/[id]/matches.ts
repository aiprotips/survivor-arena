/// <reference types="@cloudflare/workers-types" />

import { requireUser } from "../../../../_shared/access";
import {
  addFriendsAutomaticMatchday,
  deleteFriendsMatch,
  getFriendsError,
  updateFriendsMatch,
  updateFriendsMatchActiveState,
} from "../../../../_shared/friends";
import { json, methodNotAllowed, missingDatabase, readJsonObject } from "../../../../_shared/http";

type Env = {
  DB: D1Database;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(context.env.DB, context.request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(context.request);
  if (!body) {
    return json({ message: "Richiesta non valida.", ok: false }, { status: 400 });
  }

  try {
    const matchMode = String(body.matchMode ?? body.match_mode ?? "").toLowerCase();

    if (matchMode === "automatic") {
      const competition = await addFriendsAutomaticMatchday(context.env.DB, {
        competitionId: getParam(context.params.id),
        fixtureCompetitionId: String(body.fixtureCompetitionId ?? body.fixture_competition_id ?? ""),
        fixtureMatchday: Number.parseInt(String(body.fixtureMatchday ?? body.fixture_matchday ?? ""), 10),
        organizerId: auth.user.id,
        roundId: String(body.roundId ?? body.round_id ?? ""),
      });

      return json({ competition, ok: true }, { status: 201 });
    }

    const competition = await updateFriendsMatch(context.env.DB, {
      awayTeamId: String(body.awayTeamId ?? body.away_team_id ?? ""),
      competitionId: getParam(context.params.id),
      homeTeamId: String(body.homeTeamId ?? body.home_team_id ?? ""),
      isActive: body.isActive !== false,
      organizerId: auth.user.id,
      roundId: String(body.roundId ?? body.round_id ?? ""),
    });

    return json({ competition, ok: true }, { status: 201 });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(context.env.DB, context.request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(context.request);
  if (!body) {
    return json({ message: "Richiesta non valida.", ok: false }, { status: 400 });
  }

  try {
    if (body.action === "toggle-active") {
      const competition = await updateFriendsMatchActiveState(context.env.DB, {
        competitionId: getParam(context.params.id),
        invalidateExistingChoices: body.invalidateExistingChoices === true,
        isActive: body.isActive === true,
        matchId: String(body.matchId ?? body.match_id ?? ""),
        organizerId: auth.user.id,
      });

      return json({ competition, ok: true });
    }

    const competition = await updateFriendsMatch(context.env.DB, {
      awayTeamId: String(body.awayTeamId ?? body.away_team_id ?? ""),
      competitionId: getParam(context.params.id),
      homeTeamId: String(body.homeTeamId ?? body.home_team_id ?? ""),
      isActive: body.isActive !== false,
      matchId: String(body.matchId ?? body.match_id ?? ""),
      organizerId: auth.user.id,
      roundId: String(body.roundId ?? body.round_id ?? ""),
    });

    return json({ competition, ok: true });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  if (!context.env.DB) {
    return missingDatabase();
  }

  const auth = await requireUser(context.env.DB, context.request);
  if (!auth.user) {
    return auth.response;
  }

  const body = await readJsonObject(context.request);
  if (!body) {
    return json({ message: "Richiesta non valida.", ok: false }, { status: 400 });
  }

  try {
    const competition = await deleteFriendsMatch(context.env.DB, {
      competitionId: getParam(context.params.id),
      matchId: String(body.matchId ?? body.match_id ?? ""),
      organizerId: auth.user.id,
    });

    return json({ competition, ok: true });
  } catch (error) {
    const friendsError = getFriendsError(error);

    return json({ message: friendsError.message, ok: false }, { status: friendsError.status });
  }
};

export const onRequestGet = methodNotAllowed;

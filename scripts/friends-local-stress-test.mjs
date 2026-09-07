#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const baseUrl = new URL(process.env.SURVIVOR_ARENA_TEST_BASE_URL ?? "http://127.0.0.1:8791");
const allowedHosts = new Set(["127.0.0.1", "localhost", "::1"]);

if (!allowedHosts.has(baseUrl.hostname) && process.env.ALLOW_REMOTE_FRIENDS_TESTS !== "1") {
  throw new Error(
    `Refusing to run mutating Friends tests against ${baseUrl.origin}. Use a local Pages/D1 instance only.`,
  );
}

const password = "ArenaStress1!";
const stamp = `${Date.now().toString(36).slice(-7)}${Math.random().toString(36).slice(2, 5)}`;
const nodeBin = process.execPath;
const wranglerBin = "node_modules/wrangler/bin/wrangler.js";
const localD1Name = process.env.SURVIVOR_ARENA_TEST_D1_NAME ?? "survivor-arena-db";
const shouldClearRateLimits = process.env.SURVIVOR_ARENA_CLEAR_RATE_LIMITS === "1";
const scenarioSizes = [10, 8, 20, 50, 5, 3, 12, 16, 7, 25, 4, 18, 30, 6, 14, 22, 9, 35, 11, 28, 13, 40, 15, 24, 19, 32, 21, 45, 26, 50];
const resultPatterns = [
  ["HOME_WIN", "DRAW", "AWAY_WIN", "POSTPONED", "CANCELLED"],
  ["AWAY_WIN", "HOME_WIN", "DRAW", "CANCELLED", "POSTPONED"],
  ["DRAW", "HOME_WIN", "AWAY_WIN", "POSTPONED", "CANCELLED"],
  ["POSTPONED", "CANCELLED", "HOME_WIN", "AWAY_WIN", "DRAW"],
];

const metrics = {
  automaticCompetitionsChecked: 0,
  choicesSaved: 0,
  competitionsCreated: 0,
  completedNoSurvivors: 0,
  completedWithWinner: 0,
  disabledChoicesInvalidated: 0,
  disabledChoicesKept: 0,
  duplicateTeamBlocked: 0,
  eliminatedStillInActiveTournaments: 0,
  historyReportsVerified: 0,
  invitedByCode: 0,
  invitedByManager: 0,
  nextRoundsCreated: 0,
  participantsApproved: 0,
  participantsPending: 0,
  roundCalculations: 0,
  roundStartedUpdatesVerified: 0,
  userUpdatesMarkedViewed: 0,
  userUpdatesVerified: 0,
  usersRegistered: 0,
};

function assert(condition, message, details) {
  if (!condition) {
    const suffix = details === undefined ? "" : `\n${JSON.stringify(details, null, 2)}`;
    throw new Error(`${message}${suffix}`);
  }
}

function expectStatus(result, status, message) {
  assert(result.status === status, `${message}: expected ${status}, got ${result.status}`, result.data);
}

function futureDate(minutes) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function uniqueUsername(index) {
  return `fr${stamp}${index}`.slice(0, 20);
}

function uniquePhone(index) {
  return `+393${String(700000000 + index).slice(0, 9)}`;
}

function cycle(items, index) {
  return items[index % items.length];
}

function clearLocalRateLimits() {
  execFileSync(
    nodeBin,
    [wranglerBin, "d1", "execute", localD1Name, "--local", "--command", "DELETE FROM rate_limits;"],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "ignore",
    },
  );
}

async function mapLimit(items, limit, fn) {
  const results = [];
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

class Client {
  cookie = "";

  async request(path, options = {}) {
    let response = await fetch(new URL(path, baseUrl), {
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers: {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(this.cookie ? { cookie: this.cookie } : {}),
      },
      method: options.method ?? "GET",
      redirect: options.redirect ?? "follow",
    });

    if (response.status === 429 && shouldClearRateLimits) {
      clearLocalRateLimits();
      response = await fetch(new URL(path, baseUrl), {
        body: options.body ? JSON.stringify(options.body) : undefined,
        headers: {
          ...(options.body ? { "content-type": "application/json" } : {}),
          ...(this.cookie ? { cookie: this.cookie } : {}),
        },
        method: options.method ?? "GET",
        redirect: options.redirect ?? "follow",
      });
    }

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      this.cookie = setCookie.split(";")[0] ?? this.cookie;
    }

    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    return {
      data,
      location: response.headers.get("location"),
      status: response.status,
    };
  }
}

async function register(client, index) {
  const username = uniqueUsername(index);
  const response = await client.request("/api/register", {
    body: {
      acceptCookiePolicy: true,
      acceptPrivacy: true,
      acceptTerms: true,
      confirmPassword: password,
      email: `${username}@friends-local.test`,
      password,
      phone: uniquePhone(index),
      username,
    },
    method: "POST",
  });

  expectStatus(response, 201, `register ${username}`);
  assert(response.data.user?.id, "registered user missing", response.data);
  metrics.usersRegistered += 1;

  return response.data.user;
}

async function verifyTelegram(client, label) {
  const link = await client.request("/api/account/telegram-link", {
    body: { purpose: "verify" },
    method: "POST",
  });
  expectStatus(link, 200, `telegram link ${label}`);

  const startUrl = new URL(link.data.telegramStartUrl);
  const linkCode = startUrl.searchParams.get("start");
  assert(linkCode, "telegram start code missing", link.data);

  const telegram = await client.request("/api/telegram/webhook", {
    body: {
      message: {
        chat: { id: Number(`51${Math.floor(10000000 + Math.random() * 89999999)}`) },
        from: {
          first_name: label,
          id: Number(`61${Math.floor(10000000 + Math.random() * 89999999)}`),
          username: label.slice(0, 24),
        },
        text: `/start ${linkCode}`,
      },
    },
    method: "POST",
  });
  expectStatus(telegram, 200, `telegram start ${label}`);

  const otpCode = String(telegram.data.text || "").match(/\b\d{6}\b/)?.[0];
  assert(otpCode, "telegram OTP missing", telegram.data);

  const verified = await client.request("/api/account/telegram-verify", {
    body: { code: otpCode },
    method: "POST",
  });
  expectStatus(verified, 200, `telegram verify ${label}`);
}

async function login(client, identifier) {
  const response = await client.request("/api/login", {
    body: { identifier, password },
    method: "POST",
  });
  expectStatus(response, 200, `login ${identifier}`);

  if (response.data.redirectTo === "/verifica-telegram") {
    await verifyTelegram(client, String(identifier));
    return response.data.user;
  }

  assert(response.data.redirectTo === "/dashboard", "unexpected login redirect", response.data);
  return response.data.user;
}

async function createVerifiedUser(index) {
  const client = new Client();
  const user = await register(client, index);
  await login(client, user.username);
  return { client, user };
}

async function getCompetition(client, id) {
  const response = await client.request(`/api/friends/competitions/${id}`);
  expectStatus(response, 200, `get competition ${id}`);
  return response.data.competition;
}

async function createCompetition(owner, index, fixtureCompetitionId, fixtureMatchday, manualTeams) {
  const automatic = index % 5 !== 4;
  const body = automatic
    ? {
        deadlineAt: futureDate(180 + index),
        description: `Scenario automatico ${index + 1}`,
        fixtureCompetitionId,
        fixtureMatchday,
        matchMode: "automatic",
        name: `Stress Friends ${stamp}-${index + 1}`,
        rules: "Stress locale: inviti, vite, scelte e calcolo round.",
      }
    : {
        deadlineAt: futureDate(180 + index),
        description: `Scenario manuale ${index + 1}`,
        matchMode: "manual",
        matches: manualTeams.slice(0, 8).map((team, teamIndex, teams) => ({
          awayTeamId: teams[(teamIndex + 1) % teams.length].id,
          homeTeamId: team.id,
          isActive: true,
        })),
        name: `Stress Friends ${stamp}-${index + 1}`,
        rules: "Stress locale manuale.",
      };

  const response = await owner.client.request("/api/friends/competitions", {
    body,
    method: "POST",
  });
  expectStatus(response, 201, `create competition ${index + 1}`);
  const competition = response.data.competition;
  assert(competition.status === "ACTIVE", "competition should be active", competition);
  assert(competition.current_round?.matches?.length > 0, "current round has no matches", competition);
  metrics.competitionsCreated += 1;
  return competition;
}

function findParticipant(competition, userId) {
  return competition.participants.find((participant) => participant.user_id === userId);
}

async function addAndApproveParticipants(owner, competition, candidates, index) {
  let current = competition;

  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    if (i % 2 === 0) {
      const joined = await candidate.client.request("/api/friends/join", {
        body: { inviteCode: current.invite_code },
        method: "POST",
      });
      expectStatus(joined, 200, `join by code ${candidate.user.username}`);
      metrics.invitedByCode += 1;
      current = await getCompetition(owner.client, current.id);
    } else {
      const added = await owner.client.request(`/api/friends/competitions/${current.id}/participants`, {
        body: { identifier: candidate.user.email, lives: 4 },
        method: "POST",
      });
      expectStatus(added, 201, `manager add ${candidate.user.username}`);
      metrics.invitedByManager += 1;
      current = added.data.competition;
    }

    const pending = findParticipant(current, candidate.user.id);
    assert(pending?.status === "PENDING", "new participant should start pending", {
      candidate: candidate.user.username,
      pending,
    });
    assert(pending.lives.length === 1, "pending participant should start with one life", {
      candidate: candidate.user.username,
      lives: pending.lives.length,
    });
    metrics.participantsPending += 1;

    const approved = await owner.client.request(`/api/friends/competitions/${current.id}/participants`, {
      body: { action: "approve", participantId: pending.id },
      method: "PATCH",
    });
    expectStatus(approved, 200, `approve ${candidate.user.username}`);
    current = approved.data.competition;

    const active = findParticipant(current, candidate.user.id);
    assert(active?.status === "ACTIVE", "approved participant should be active", active);
    metrics.participantsApproved += 1;

    const desiredLives = 1 + ((index + i) % 5);
    const updated = await owner.client.request(`/api/friends/competitions/${current.id}/participants`, {
      body: { lives: desiredLives, participantId: active.id },
      method: "PATCH",
    });
    expectStatus(updated, 200, `set lives ${candidate.user.username}`);
    current = updated.data.competition;

    const adjusted = findParticipant(current, candidate.user.id);
    assert(adjusted?.lives.length === desiredLives, "participant life count mismatch", {
      actual: adjusted?.lives.length,
      expected: desiredLives,
      username: candidate.user.username,
    });
  }

  return current;
}

async function chooseLife(client, life, match, side) {
  const selectedTeamId = side === "HOME" ? match.home_team_id : match.away_team_id;
  const response = await client.request(`/api/friends/lives/${life.id}/choice`, {
    body: {
      matchId: match.id,
      selectedTeamId,
    },
    method: "POST",
  });
  expectStatus(response, 200, `choose ${side}`);
  metrics.choicesSaved += 1;
  return response.data.competition;
}

async function exerciseChoices(owner, competition, participants, index) {
  let current = await getCompetition(owner.client, competition.id);
  const round = current.current_round;
  const activeMatches = round.matches.filter((match) => match.is_active === 1);
  assert(activeMatches.length > 0, "no active matches for choice exercise", current);

  for (let participantIndex = 0; participantIndex < participants.length; participantIndex += 1) {
    const entry = participants[participantIndex];
    const participantView = await getCompetition(entry.client, current.id);
    const participant = participantView.participant;

    if (participant?.status !== "ACTIVE") {
      continue;
    }

    for (let lifeIndex = 0; lifeIndex < participant.lives.length; lifeIndex += 1) {
      const life = participant.lives[lifeIndex];
      if (life.status !== "ALIVE") {
        continue;
      }

      if ((participantIndex + lifeIndex + index) % 7 === 0) {
        continue;
      }

      const match = activeMatches[(participantIndex + lifeIndex + index) % activeMatches.length];
      const side = (participantIndex + lifeIndex + index) % 2 === 0 ? "HOME" : "AWAY";
      await chooseLife(entry.client, life, match, side);
    }
  }

  current = await getCompetition(owner.client, current.id);

  if (current.participants.length > 1 && activeMatches.length > 0) {
    const firstActive = current.participants.find((participant) => participant.status === "ACTIVE" && participant.lives.length >= 2);
    if (firstActive) {
      const userEntry = participants.find((candidate) => candidate.user.id === firstActive.user_id) ?? owner;
      const userView = await getCompetition(userEntry.client, current.id);
      const liveLifeA = userView.participant?.lives.find((life) => life.status === "ALIVE");
      const liveLifeB = userView.participant?.lives.find((life) => life.status === "ALIVE" && life.id !== liveLifeA?.id);
      if (liveLifeA && liveLifeB) {
        const match = activeMatches[0];
        await chooseLife(userEntry.client, liveLifeA, match, "HOME");
        await chooseLife(userEntry.client, liveLifeB, match, "HOME");
      }
    }
  }

  current = await getCompetition(owner.client, current.id);
  if (current.current_round.matches.length >= 2 && index % 3 === 0) {
    const match = current.current_round.matches[0];
    const disabled = await owner.client.request(`/api/friends/competitions/${current.id}/matches`, {
      body: {
        action: "toggle-active",
        invalidateExistingChoices: index % 2 === 0,
        isActive: false,
        matchId: match.id,
      },
      method: "PATCH",
    });
    expectStatus(disabled, 200, `disable match ${index + 1}`);
    if (index % 2 === 0) {
      metrics.disabledChoicesInvalidated += 1;
    } else {
      metrics.disabledChoicesKept += 1;
    }
    current = disabled.data.competition;

    const enabled = await owner.client.request(`/api/friends/competitions/${current.id}/matches`, {
      body: {
        action: "toggle-active",
        invalidateExistingChoices: false,
        isActive: true,
        matchId: match.id,
      },
      method: "PATCH",
    });
    expectStatus(enabled, 200, `re-enable match ${index + 1}`);
    current = enabled.data.competition;
  }

  return current;
}

function resultsForRound(round, index) {
  const pattern = cycle(resultPatterns, index);
  return round.matches.map((match, matchIndex) => ({
    matchId: match.id,
    result: pattern[matchIndex % pattern.length],
  }));
}

async function lockAndCalculate(owner, competition, index) {
  let current = competition;
  const lock = await owner.client.request(`/api/friends/competitions/${current.id}/round`, {
    body: { action: "lock" },
    method: "POST",
  });
  expectStatus(lock, 200, `lock round ${index + 1}`);
  current = lock.data.competition;

  const calculate = await owner.client.request(`/api/friends/rounds/${current.current_round.id}/calculate`, {
    body: { results: resultsForRound(current.current_round, index) },
    method: "POST",
  });
  expectStatus(calculate, 200, `calculate round ${index + 1}`);
  metrics.roundCalculations += 1;

  current = calculate.data.competition;
  assert(Array.isArray(current.history_report), "competition should include a history report", current);
  assert(
    current.history_report.some((round) => round.status === "CALCULATED" && round.participants.length > 0),
    "calculated round should be present in history report",
    current.history_report,
  );
  metrics.historyReportsVerified += 1;

  assert(Array.isArray(current.unviewed_updates), "competition should include personal updates", current);
  assert(current.unviewed_updates.length > 0, "owner should receive a round update", current.unviewed_updates);
  metrics.userUpdatesVerified += 1;

  const alive = current.participants.flatMap((participant) => participant.lives).filter((life) => life.status === "ALIVE" || life.status === "WINNER");

  if (current.status === "COMPLETED") {
    if (alive.length === 1) {
      metrics.completedWithWinner += 1;
    } else {
      metrics.completedNoSurvivors += 1;
    }
    return current;
  }

  assert(current.current_round_number > 1, "next round was not created", current);
  assert(current.current_round?.status === "PENDING", "next round should start pending", current.current_round);
  metrics.nextRoundsCreated += 1;

  return current;
}

async function verifyPersonalUpdateFlow(entries, competition) {
  const eliminated = competition.participants.find((participant) => participant.status === "ELIMINATED");
  if (!eliminated || competition.status === "COMPLETED") {
    return;
  }

  const entry = entries.find((candidate) => candidate.user.id === eliminated.user_id);
  if (!entry) {
    return;
  }

  const list = await entry.client.request("/api/friends/competitions");
  expectStatus(list, 200, `eliminated list ${entry.user.username}`);
  const listed = list.data.competitions.find((item) => item.id === competition.id);
  assert(listed, "eliminated user should still see the tournament", list.data);
  assert(listed.status !== "COMPLETED", "eliminated user should still see tournament as active globally", listed);
  metrics.eliminatedStillInActiveTournaments += 1;

  const detail = await getCompetition(entry.client, competition.id);
  assert(detail.user_status === "ELIMINATED", "eliminated user should have a personal eliminated status", detail);
  assert(detail.status !== "COMPLETED", "personal elimination must not complete the tournament", detail);
  assert(detail.history_report.some((round) => round.status === "CALCULATED"), "eliminated user should see calculated history", detail.history_report);

  const updates = await entry.client.request("/api/friends/updates");
  expectStatus(updates, 200, `updates ${entry.user.username}`);
  assert(updates.data.updates.some((update) => update.competition_id === competition.id), "eliminated user should have an unviewed update", updates.data);

  const marked = await entry.client.request("/api/friends/updates", {
    body: { competitionId: competition.id },
    method: "PATCH",
  });
  expectStatus(marked, 200, `mark updates viewed ${entry.user.username}`);
  const after = await entry.client.request("/api/friends/updates");
  expectStatus(after, 200, `updates after viewed ${entry.user.username}`);
  assert(!after.data.updates.some((update) => update.competition_id === competition.id), "viewed updates should not reappear", after.data);
  metrics.userUpdatesMarkedViewed += 1;
}

async function verifyRoundStartedUpdate(entries, competition) {
  const active = competition.participants.find((participant) => participant.status === "ACTIVE");
  const entry = active ? entries.find((candidate) => candidate.user.id === active.user_id) : null;
  if (!entry) {
    return;
  }

  const updates = await entry.client.request("/api/friends/updates");
  expectStatus(updates, 200, `round started updates ${entry.user.username}`);
  assert(
    updates.data.updates.some((update) => update.competition_id === competition.id && update.event_type === "friends_round_started"),
    "opening a new round should create a personal round-started update",
    updates.data,
  );
  metrics.roundStartedUpdatesVerified += 1;
}

async function importAndOpenNextRound(owner, competition, index, fixtureCompetitionId) {
  let current = competition;
  const nextRound = current.current_round;
  assert(nextRound, "missing next round", current);
  const fixtureMatchday = nextRound.fixture_matchday ?? ((index + 2 - 1) % 38) + 1;

  const imported = await owner.client.request(`/api/friends/competitions/${current.id}/matches`, {
    body: {
      fixtureCompetitionId,
      fixtureMatchday,
      matchMode: "automatic",
      roundId: nextRound.id,
    },
    method: "POST",
  });
  expectStatus(imported, 201, `import next matchday ${index + 1}`);
  current = imported.data.competition;
  assert(current.current_round.matches.length > 0, "next round import produced no matches", current.current_round);

  const deadline = await owner.client.request(`/api/friends/competitions/${current.id}/round`, {
    body: {
      deadlineAt: futureDate(260 + index),
      roundId: current.current_round.id,
    },
    method: "PATCH",
  });
  expectStatus(deadline, 200, `set next deadline ${index + 1}`);

  const opened = await owner.client.request(`/api/friends/competitions/${current.id}/round`, {
    body: { action: "open" },
    method: "POST",
  });
  expectStatus(opened, 200, `open next round ${index + 1}`);
  return opened.data.competition;
}

async function exerciseDuplicateTeamRule(owner, teams) {
  const competition = await createCompetition(owner, 904, "", 1, teams.slice(0, 8));
  let current = competition;
  const ownerParticipant = current.participants.find((participant) => participant.user_id === owner.user.id);
  assert(ownerParticipant, "owner participant missing", current);

  let updated = await owner.client.request(`/api/friends/competitions/${current.id}/participants`, {
    body: { lives: 2, participantId: ownerParticipant.id },
    method: "PATCH",
  });
  expectStatus(updated, 200, "cycle setup two lives");
  current = updated.data.competition;

  const firstRound = current.current_round;
  await chooseLife(owner.client, current.participant.lives[0], firstRound.matches[0], "HOME");
  await chooseLife(owner.client, current.participant.lives[1], firstRound.matches[0], "HOME");
  current = await lockAndCalculate(owner, current, 900);
  assert(current.status !== "COMPLETED", "duplicate team setup should continue after round 1", current);

  const nextRound = current.current_round;
  const selectedTeamId = firstRound.matches[0].home_team_id;
  const fallbackAwayTeam = teams.find((team) => team.id !== selectedTeamId);
  assert(fallbackAwayTeam, "duplicate team setup missing fallback team", teams.slice(0, 4));

  const manualMatch = await owner.client.request(`/api/friends/competitions/${current.id}/matches`, {
    body: {
      awayTeamId: fallbackAwayTeam.id,
      homeTeamId: selectedTeamId,
      isActive: true,
      roundId: nextRound.id,
    },
    method: "POST",
  });
  expectStatus(manualMatch, 201, "duplicate team setup add reused team match");
  current = manualMatch.data.competition;

  const deadline = await owner.client.request(`/api/friends/competitions/${current.id}/round`, {
    body: {
      deadlineAt: futureDate(420),
      roundId: current.current_round.id,
    },
    method: "PATCH",
  });
  expectStatus(deadline, 200, "duplicate team setup deadline");

  const opened = await owner.client.request(`/api/friends/competitions/${current.id}/round`, {
    body: { action: "open" },
    method: "POST",
  });
  expectStatus(opened, 200, "duplicate team setup open round");
  current = opened.data.competition;

  const userView = await getCompetition(owner.client, current.id);
  const life = userView.participant.lives.find((item) => item.status === "ALIVE");
  const blocked = await owner.client.request(`/api/friends/lives/${life.id}/choice`, {
    body: {
      matchId: current.current_round.matches[0].id,
      selectedTeamId,
    },
    method: "POST",
  });
  expectStatus(blocked, 409, "same life duplicate team should be blocked");
  metrics.duplicateTeamBlocked += 1;
}

async function run() {
  const health = await new Client().request("/");
  assert(health.status >= 200 && health.status < 400, "local app is not reachable", health);

  const users = await mapLimit(Array.from({ length: 65 }, (_, index) => index), 8, createVerifiedUser);
  const owner = users[0];

  const automatic = await owner.client.request("/api/friends/automatic-competitions");
  expectStatus(automatic, 200, "automatic competitions");
  const serieA = automatic.data.competitions.find((competition) => competition.id === "serie-a-2026-2027");
  assert(serieA, "Serie A 2026-2027 automatic competition missing", automatic.data);
  assert(serieA.matchdays.length === 38, "Serie A must expose 38 matchdays", serieA);
  assert(serieA.matchdays.every((matchday) => matchday.matchCount > 0), "one or more matchdays have no matches", serieA);
  metrics.automaticCompetitionsChecked += 1;

  const teamsResponse = await owner.client.request("/api/friends/teams");
  expectStatus(teamsResponse, 200, "friends teams");
  const teams = teamsResponse.data.teams;
  assert(Array.isArray(teams) && teams.length >= 20, "not enough teams available", teamsResponse.data);
  assert(teams.every((team) => team.logo_url), "one or more teams have no logo_url", teams.slice(0, 20));

  for (let index = 0; index < scenarioSizes.length; index += 1) {
    const participantCount = scenarioSizes[index];
    let competition = await createCompetition(owner, index, serieA.id, ((index % 38) + 1), teams);
    const candidates = Array.from({ length: participantCount }, (_, offset) => users[1 + ((index * 13 + offset) % (users.length - 1))]);
    competition = await addAndApproveParticipants(owner, competition, candidates, index);
    competition = await exerciseChoices(owner, competition, candidates, index);
    competition = await lockAndCalculate(owner, competition, index);
    await verifyPersonalUpdateFlow([owner, ...candidates], competition);

    if (competition.status !== "COMPLETED" && index % 2 === 0) {
      competition = await importAndOpenNextRound(owner, competition, index, serieA.id);
      await verifyRoundStartedUpdate([owner, ...candidates], competition);
      competition = await exerciseChoices(owner, competition, candidates, index + 100);
      await lockAndCalculate(owner, competition, index + 100);
    }
  }

  await exerciseDuplicateTeamRule(owner, teams);

  assert(metrics.duplicateTeamBlocked > 0, "duplicate team rule was not exercised", metrics);

  const summary = {
    baseUrl: baseUrl.origin,
    metrics,
    owner: {
      username: owner.user.username,
      password,
    },
    scenarioSizes,
    stamp,
  };

  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const baseUrl = new URL(process.env.SURVIVOR_ARENA_TEST_BASE_URL ?? "http://127.0.0.1:8789");
const allowedHosts = new Set(["127.0.0.1", "localhost", "::1"]);

if (!allowedHosts.has(baseUrl.hostname) && process.env.ALLOW_REMOTE_SMOKE_TESTS !== "1") {
  throw new Error(
    `Refusing to run mutating smoke tests against ${baseUrl.origin}. Set ALLOW_REMOTE_SMOKE_TESTS=1 only for an intentional disposable environment.`,
  );
}

const password = "ArenaTest1!";
const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const nodeBin = process.execPath;
const wranglerBin = "node_modules/wrangler/bin/wrangler.js";
const testResults = [];

function currentRound(tournament) {
  return tournament.rounds.find((round) => round.round_number === tournament.current_round_number);
}

function futureDate(minutes = 60) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function sql(value) {
  return String(value).replaceAll("'", "''");
}

function runLocalSql(command) {
  execFileSync(
    nodeBin,
    [wranglerBin, "d1", "execute", "survivor-arena-db", "--local", "--command", command],
    {
      cwd: process.cwd(),
      env: process.env,
      stdio: "ignore",
    },
  );
}

async function step(name, fn) {
  try {
    await fn();
    testResults.push({ name, status: "ok" });
    console.log(`ok - ${name}`);
  } catch (error) {
    testResults.push({ name, error, status: "failed" });
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function assert(condition, message, details) {
  if (!condition) {
    const suffix = details ? `\n${JSON.stringify(details, null, 2)}` : "";
    throw new Error(`${message}${suffix}`);
  }
}

function expectStatus(result, status, message) {
  assert(
    result.status === status,
    `${message}: expected ${status}, got ${result.status}`,
    result.data,
  );
}

class Client {
  cookie = "";

  async request(path, options = {}) {
    const response = await fetch(new URL(path, baseUrl), {
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers: {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(this.cookie ? { cookie: this.cookie } : {}),
      },
      method: options.method ?? "GET",
      redirect: options.redirect ?? "follow",
    });
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

function userSeed(prefix) {
  const safePrefix = prefix.replace(/[^a-z0-9_]/gi, "").toLowerCase().slice(0, 8);
  const shortStamp = stamp.slice(-8);
  const username = `${safePrefix}_${shortStamp}`.slice(0, 20);
  const phoneDigits = `${Math.floor(10_000_000 + Math.random() * 89_999_999)}${Date.now()}`
    .slice(0, 12)
    .padEnd(12, "0");

  return {
    email: `${safePrefix}-${stamp}@example.com`,
    phone: `+39${phoneDigits}`,
    username,
  };
}

async function register(client, prefix, overrides = {}) {
  const seed = userSeed(prefix);
  const payload = {
    confirmPassword: password,
    email: seed.email,
    password,
    phone: seed.phone,
    username: seed.username,
    ...overrides,
  };
  const response = await client.request("/api/register", {
    body: payload,
    method: "POST",
  });

  expectStatus(response, 201, `register ${prefix}`);
  assert(/^SA-[A-Z0-9]{8}$/.test(response.data.user.user_code), "invalid user code", response.data);

  return {
    ...payload,
    user: response.data.user,
  };
}

async function login(client, identifier, inputPassword = password, expectedRedirect = "/dashboard") {
  const response = await client.request("/api/login", {
    body: {
      identifier,
      password: inputPassword,
    },
    method: "POST",
  });

  expectStatus(response, 200, `login ${identifier}`);
  assert(response.data.redirectTo === expectedRedirect, "unexpected login redirect", response.data);

  return response.data.user;
}

function promoteAdmin(username) {
  runLocalSql(`UPDATE users SET role = 'admin' WHERE username = '${sql(username)}'`);
}

function setBalance(username, balance) {
  const now = new Date().toISOString();

  runLocalSql(`
    INSERT OR IGNORE INTO user_wallets (user_id, balance, created_at, updated_at)
    SELECT id, 0, '${sql(now)}', '${sql(now)}' FROM users WHERE username = '${sql(username)}';
  `);
  runLocalSql(`
    UPDATE user_wallets
    SET balance = ${Number(balance)}, updated_at = '${sql(now)}'
    WHERE user_id = (SELECT id FROM users WHERE username = '${sql(username)}');
  `);
}

function tournamentInput(name, overrides = {}) {
  return {
    description: "Smoke test torneo",
    entryCost: 0,
    extraLifeCost: 0,
    initialLives: 1,
    maxLivesPerUser: 3,
    maxParticipants: 50,
    name,
    prizePoolPercentage: 80,
    rules: "Regole smoke test.",
    unlimitedLives: false,
    unlimitedParticipants: false,
    ...overrides,
  };
}

async function createTournament(admin, name, overrides = {}) {
  const response = await admin.request("/api/admin/tournaments", {
    body: tournamentInput(name, overrides),
    method: "POST",
  });

  expectStatus(response, 201, `create tournament ${name}`);

  return response.data.tournament;
}

async function configureRound(admin, tournament, matches = [["Juventus", "Inter"]]) {
  let round = currentRound(tournament);
  const deadline = await admin.request(`/api/admin/tournaments/${tournament.id}/round`, {
    body: {
      deadlineAt: futureDate(),
      roundId: round.id,
    },
    method: "PATCH",
  });

  expectStatus(deadline, 200, `configure round ${round.round_number}`);
  tournament = deadline.data.tournament;
  round = currentRound(tournament);

  for (const [homeTeam, awayTeam] of matches) {
    const added = await admin.request("/api/admin/matches", {
      body: {
        awayTeam,
        homeTeam,
        isLocked: false,
        isSelectable: true,
        roundId: round.id,
      },
      method: "POST",
    });

    expectStatus(added, 201, `add match ${homeTeam} vs ${awayTeam}`);
    tournament = added.data.tournament;
    round = currentRound(tournament);
  }

  return tournament;
}

async function publishTournament(admin, tournament) {
  const response = await admin.request(`/api/admin/tournaments/${tournament.id}/publish`, {
    method: "POST",
  });

  expectStatus(response, 200, `publish ${tournament.name}`);

  return response.data.tournament;
}

async function lockTournament(admin, tournament) {
  const response = await admin.request(`/api/admin/tournaments/${tournament.id}/lock`, {
    method: "POST",
  });

  expectStatus(response, 200, `lock ${tournament.name}`);

  return response.data.tournament;
}

async function calculateRound(admin, round, results) {
  const response = await admin.request(`/api/admin/rounds/${round.id}/calculate`, {
    body: { results },
    method: "POST",
  });

  expectStatus(response, 200, `calculate round ${round.round_number}`);

  return response.data.tournament;
}

async function main() {
  console.log(`Smoke tests base URL: ${baseUrl.origin}`);
  console.log("Production DB guard: enabled");

  const anonymous = new Client();
  const user = new Client();
  const admin = new Client();
  const secondUser = new Client();
  const thirdUser = new Client();
  const leaveUser = new Client();

  let userData;
  let adminData;
  let gameTournament;
  let zeroTournament;
  let leaveTournamentData;
  let userLives;
  let userSessionAfterPrize;

  await step("D1 health endpoint responds", async () => {
    const response = await anonymous.request("/api/d1-health");
    expectStatus(response, 200, "d1 health");
    assert(response.data.ok === true, "d1 health not ok", response.data);
  });

  await step("protected pages redirect anonymous users", async () => {
    const dashboard = await anonymous.request("/dashboard/", { redirect: "manual" });
    const adminPage = await anonymous.request("/admin/", { redirect: "manual" });

    assert(dashboard.status === 302 && dashboard.location?.includes("/login"), "dashboard did not redirect to login", dashboard);
    assert(adminPage.status === 302 && adminPage.location?.includes("/login"), "admin did not redirect to login", adminPage);
  });

  await step("registration validation blocks weak passwords", async () => {
    const seed = userSeed("weak");
    const response = await anonymous.request("/api/register", {
      body: {
        confirmPassword: "weak",
        email: seed.email,
        password: "weak",
        phone: seed.phone,
        username: seed.username,
      },
      method: "POST",
    });

    expectStatus(response, 400, "weak password registration");
    assert(response.data.field === "password", "weak password field mismatch", response.data);
  });

  await step("registration creates user and blocks duplicates", async () => {
    userData = await register(user, "player");

    const duplicateUsername = await anonymous.request("/api/register", {
      body: {
        confirmPassword: password,
        email: `other-${stamp}@example.com`,
        password,
        phone: `+391${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
        username: userData.username,
      },
      method: "POST",
    });
    const duplicateEmail = await anonymous.request("/api/register", {
      body: {
        confirmPassword: password,
        email: userData.email,
        password,
        phone: `+392${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
        username: `email_${stamp}`.slice(0, 20),
      },
      method: "POST",
    });
    const duplicatePhone = await anonymous.request("/api/register", {
      body: {
        confirmPassword: password,
        email: `phone-${stamp}@example.com`,
        password,
        phone: userData.phone,
        username: `phone_${stamp}`.slice(0, 20),
      },
      method: "POST",
    });

    expectStatus(duplicateUsername, 409, "duplicate username");
    expectStatus(duplicateEmail, 409, "duplicate email");
    expectStatus(duplicatePhone, 409, "duplicate phone");
  });

  await step("login works by username and email, wrong password is blocked, logout invalidates session", async () => {
    const wrongPassword = await anonymous.request("/api/login", {
      body: {
        identifier: userData.username,
        password: "WrongPassword1!",
      },
      method: "POST",
    });

    expectStatus(wrongPassword, 401, "wrong password");

    await login(user, userData.username);
    const session = await user.request("/api/session");
    expectStatus(session, 200, "session after username login");
    assert(session.data.user.username === userData.username, "session username mismatch", session.data);

    const emailClient = new Client();
    await login(emailClient, userData.email);
    const logout = await emailClient.request("/api/logout", { method: "POST" });
    expectStatus(logout, 200, "logout");
    const afterLogout = await emailClient.request("/api/session");
    expectStatus(afterLogout, 401, "session after logout");
  });

  await step("non-admin cannot access admin APIs or admin page", async () => {
    const api = await user.request("/api/admin/tournaments");
    const page = await user.request("/admin/", { redirect: "manual" });

    expectStatus(api, 403, "user admin API");
    assert(page.status === 302 && page.location?.includes("/dashboard"), "non-admin page redirect mismatch", page);
  });

  await step("admin can authenticate and list tournaments", async () => {
    adminData = await register(admin, "admin");
    promoteAdmin(adminData.username);
    await login(admin, adminData.username, password, "/admin");

    const session = await admin.request("/api/session");
    expectStatus(session, 200, "admin session");
    assert(session.data.user.role === "admin", "admin role mismatch", session.data);

    const list = await admin.request("/api/admin/tournaments");
    expectStatus(list, 200, "admin tournaments list");
    assert(Array.isArray(list.data.tournaments), "admin tournaments list malformed", list.data);
  });

  await step("admin tournament validation, pending delete, deadline and match checks work", async () => {
    const invalidTournament = await admin.request("/api/admin/tournaments", {
      body: tournamentInput("No", { maxLivesPerUser: 0 }),
      method: "POST",
    });
    expectStatus(invalidTournament, 400, "invalid tournament");

    const deletable = await createTournament(admin, `Delete Smoke ${stamp}`, {
      maxParticipants: 5,
    });
    const deleted = await admin.request(`/api/admin/tournaments/${deletable.id}`, {
      method: "DELETE",
    });
    expectStatus(deleted, 200, "delete pending tournament");

    gameTournament = await createTournament(admin, `Flow Smoke ${stamp}`, {
      entryCost: 10,
      extraLifeCost: 5,
      initialLives: 1,
      maxLivesPerUser: 2,
      maxParticipants: 1,
    });

    const publishWithoutRound = await admin.request(`/api/admin/tournaments/${gameTournament.id}/publish`, {
      method: "POST",
    });
    expectStatus(publishWithoutRound, 409, "publish without deadline/match");

    const round = currentRound(gameTournament);
    const invalidMatch = await admin.request("/api/admin/matches", {
      body: {
        awayTeam: "Roma",
        homeTeam: "Roma",
        roundId: round.id,
      },
      method: "POST",
    });
    expectStatus(invalidMatch, 400, "invalid same-team match");

    gameTournament = await configureRound(admin, gameTournament);
    const match = currentRound(gameTournament).matches[0];
    const disabled = await admin.request(`/api/admin/matches/${match.id}`, {
      body: {
        awayTeam: match.away_team,
        homeTeam: match.home_team,
        isLocked: false,
        isSelectable: false,
      },
      method: "PATCH",
    });
    expectStatus(disabled, 200, "disable match");
    const publishWithoutSelectable = await admin.request(`/api/admin/tournaments/${gameTournament.id}/publish`, {
      method: "POST",
    });
    expectStatus(publishWithoutSelectable, 409, "publish without selectable match");

    const enabled = await admin.request(`/api/admin/matches/${match.id}`, {
      body: {
        awayTeam: match.away_team,
        homeTeam: match.home_team,
        isLocked: false,
        isSelectable: true,
      },
      method: "PATCH",
    });
    expectStatus(enabled, 200, "reenable match");
    gameTournament = enabled.data.tournament;
  });

  await step("published tournament appears to users and enforces balance, duplicate join and participant limit", async () => {
    gameTournament = await publishTournament(admin, gameTournament);

    const publicList = await user.request("/api/arena/tournaments");
    expectStatus(publicList, 200, "public tournaments");
    assert(
      publicList.data.tournaments.some((tournament) => tournament.id === gameTournament.id),
      "published tournament not visible",
      publicList.data,
    );

    const insufficient = await user.request(`/api/arena/tournaments/${gameTournament.id}/join`, {
      method: "POST",
    });
    expectStatus(insufficient, 409, "join insufficient cups");

    setBalance(userData.username, 100);
    const joined = await user.request(`/api/arena/tournaments/${gameTournament.id}/join`, {
      method: "POST",
    });
    expectStatus(joined, 200, "join after balance");
    userLives = joined.data.tournament.user_lives;
    assert(userLives.length === 1, "initial lives mismatch", joined.data);

    const duplicateJoin = await user.request(`/api/arena/tournaments/${gameTournament.id}/join`, {
      method: "POST",
    });
    expectStatus(duplicateJoin, 409, "duplicate join");

    const otherData = await register(secondUser, "second");
    await login(secondUser, otherData.username);
    setBalance(otherData.username, 100);
    const participantLimit = await secondUser.request(`/api/arena/tournaments/${gameTournament.id}/join`, {
      method: "POST",
    });
    expectStatus(participantLimit, 409, "participant limit");
  });

  await step("extra lives, movements and choice validation work", async () => {
    const movementsAfterJoin = await user.request("/api/arena/movements");
    expectStatus(movementsAfterJoin, 200, "movements after join");
    assert(
      movementsAfterJoin.data.movements.some((movement) => movement.movement_type === "ENTRY_FEE"),
      "entry movement missing",
      movementsAfterJoin.data,
    );

    const extraLife = await user.request(`/api/arena/tournaments/${gameTournament.id}/buy-life`, {
      method: "POST",
    });
    expectStatus(extraLife, 200, "buy extra life");
    userLives = extraLife.data.tournament.user_lives;
    assert(userLives.length === 2, "extra life missing", extraLife.data);

    const maxLife = await user.request(`/api/arena/tournaments/${gameTournament.id}/buy-life`, {
      method: "POST",
    });
    expectStatus(maxLife, 409, "max lives");

    const details = await user.request(`/api/arena/tournaments/${gameTournament.id}`);
    expectStatus(details, 200, "tournament details");
    const round = currentRound(details.data.tournament);
    const match = round.matches[0];

    const invalidChoice = await user.request(`/api/arena/lives/${userLives[0].id}/choice`, {
      body: {
        matchId: match.id,
        selectedTeam: "Napoli",
      },
      method: "POST",
    });
    expectStatus(invalidChoice, 400, "invalid choice team");

    for (const life of userLives) {
      const choice = await user.request(`/api/arena/lives/${life.id}/choice`, {
        body: {
          matchId: match.id,
          selectedTeam: "Juventus",
        },
        method: "POST",
      });
      expectStatus(choice, 200, `choice life ${life.life_number}`);
    }
  });

  await step("locking choices exposes public choices and blocks further edits", async () => {
    gameTournament = await lockTournament(admin, gameTournament);
    const round = currentRound(gameTournament);
    const match = round.matches[0];
    const blockedChoice = await user.request(`/api/arena/lives/${userLives[0].id}/choice`, {
      body: {
        matchId: match.id,
        selectedTeam: "Inter",
      },
      method: "POST",
    });
    expectStatus(blockedChoice, 409, "choice after lock");

    const details = await user.request(`/api/arena/tournaments/${gameTournament.id}`);
    expectStatus(details, 200, "details after lock");
    assert(details.data.tournament.public_choices.length >= 2, "public choices not visible", details.data);

    const missingResult = await admin.request(`/api/admin/rounds/${round.id}/calculate`, {
      body: { results: [] },
      method: "POST",
    });
    expectStatus(missingResult, 400, "missing match result");

    gameTournament = await calculateRound(admin, round, [
      {
        matchId: match.id,
        result: "HOME_WIN",
      },
    ]);
    assert(currentRound(gameTournament).round_number === 2, "round 2 was not created", gameTournament);
  });

  await step("round 2 enforces per-life team cycle and completes with one survivor", async () => {
    let roundTwo = currentRound(gameTournament);
    const leaveAfterRoundOne = await user.request(`/api/arena/tournaments/${gameTournament.id}/leave`, {
      method: "POST",
    });
    const buyAfterRoundOne = await user.request(`/api/arena/tournaments/${gameTournament.id}/buy-life`, {
      method: "POST",
    });
    expectStatus(leaveAfterRoundOne, 409, "leave after round one");
    expectStatus(buyAfterRoundOne, 409, "buy life after round one");

    gameTournament = await configureRound(admin, gameTournament, [["Juventus", "Milan"]]);
    const opened = await admin.request(`/api/admin/tournaments/${gameTournament.id}/open-round`, {
      method: "POST",
    });
    expectStatus(opened, 200, "open round 2");
    gameTournament = opened.data.tournament;
    roundTwo = currentRound(gameTournament);
    const match = roundTwo.matches[0];

    const repeatedTeam = await user.request(`/api/arena/lives/${userLives[0].id}/choice`, {
      body: {
        matchId: match.id,
        selectedTeam: "Juventus",
      },
      method: "POST",
    });
    expectStatus(repeatedTeam, 409, "same life repeats team in same cycle");

    const allowedTeam = await user.request(`/api/arena/lives/${userLives[0].id}/choice`, {
      body: {
        matchId: match.id,
        selectedTeam: "Milan",
      },
      method: "POST",
    });
    expectStatus(allowedTeam, 200, "same life chooses unused team");

    gameTournament = await lockTournament(admin, gameTournament);
    gameTournament = await calculateRound(admin, currentRound(gameTournament), [
      {
        matchId: match.id,
        result: "AWAY_WIN",
      },
    ]);
    assert(gameTournament.status === "COMPLETED", "tournament was not completed", gameTournament);

    const session = await user.request("/api/session");
    expectStatus(session, 200, "session after prize");
    userSessionAfterPrize = session.data.user;
    assert(userSessionAfterPrize.cup_balance === 97, "unexpected balance after entry, extra life and prize", session.data);

    const adminUpdateCompleted = await admin.request(`/api/admin/tournaments/${gameTournament.id}`, {
      body: tournamentInput(`Updated ${stamp}`),
      method: "PATCH",
    });
    const adminDeleteCompleted = await admin.request(`/api/admin/tournaments/${gameTournament.id}`, {
      method: "DELETE",
    });
    expectStatus(adminUpdateCompleted, 409, "update completed tournament");
    expectStatus(adminDeleteCompleted, 409, "delete completed tournament");
  });

  await step("participants and event registry expose admin history", async () => {
    const participants = await admin.request(`/api/admin/tournaments/${gameTournament.id}/participants?q=${userData.username}`);
    const events = await admin.request(`/api/admin/events?tournamentId=${gameTournament.id}`);

    expectStatus(participants, 200, "participants");
    assert(participants.data.participants.length >= 1, "participant missing", participants.data);
    assert(participants.data.participants[0].lives.length >= 2, "participant lives missing", participants.data);

    expectStatus(events, 200, "events");
    assert(
      events.data.events.some((event) => event.event_type === "round_calculated"),
      "round calculated event missing",
      events.data,
    );
  });

  await step("zero-survivor round completes cleanly", async () => {
    const zeroData = await register(thirdUser, "zero");
    await login(thirdUser, zeroData.username);

    zeroTournament = await createTournament(admin, `Zero Smoke ${stamp}`, {
      entryCost: 0,
      initialLives: 1,
      maxParticipants: 10,
    });
    zeroTournament = await configureRound(admin, zeroTournament, [["Roma", "Lazio"]]);
    zeroTournament = await publishTournament(admin, zeroTournament);

    const joined = await thirdUser.request(`/api/arena/tournaments/${zeroTournament.id}/join`, {
      method: "POST",
    });
    expectStatus(joined, 200, "zero join");
    const life = joined.data.tournament.user_lives[0];
    const match = currentRound(joined.data.tournament).matches[0];
    const choice = await thirdUser.request(`/api/arena/lives/${life.id}/choice`, {
      body: {
        matchId: match.id,
        selectedTeam: "Roma",
      },
      method: "POST",
    });
    expectStatus(choice, 200, "zero choice");

    zeroTournament = await lockTournament(admin, zeroTournament);
    zeroTournament = await calculateRound(admin, currentRound(zeroTournament), [
      {
        matchId: match.id,
        result: "DRAW",
      },
    ]);
    assert(zeroTournament.status === "COMPLETED", "zero-survivor tournament not completed", zeroTournament);
  });

  await step("pre-deadline unsubscribe refunds entry cost", async () => {
    const leaveData = await register(leaveUser, "leave");
    await login(leaveUser, leaveData.username);
    setBalance(leaveData.username, 50);

    leaveTournamentData = await createTournament(admin, `Leave Smoke ${stamp}`, {
      entryCost: 20,
      initialLives: 1,
      maxParticipants: 10,
    });
    leaveTournamentData = await configureRound(admin, leaveTournamentData, [["Atalanta", "Bologna"]]);
    leaveTournamentData = await publishTournament(admin, leaveTournamentData);

    const joined = await leaveUser.request(`/api/arena/tournaments/${leaveTournamentData.id}/join`, {
      method: "POST",
    });
    expectStatus(joined, 200, "leave join");
    const beforeLeave = await leaveUser.request("/api/session");
    expectStatus(beforeLeave, 200, "session before leave");
    assert(beforeLeave.data.user.cup_balance === 30, "entry fee not deducted", beforeLeave.data);

    const left = await leaveUser.request(`/api/arena/tournaments/${leaveTournamentData.id}/leave`, {
      method: "POST",
    });
    expectStatus(left, 200, "leave tournament");
    const afterLeave = await leaveUser.request("/api/session");
    expectStatus(afterLeave, 200, "session after leave");
    assert(afterLeave.data.user.cup_balance === 50, "entry fee not refunded", afterLeave.data);
  });

  console.log(`\n${testResults.length} flow groups passed.`);
}

main().catch((error) => {
  console.error(error.stack ?? error.message ?? error);
  process.exit(1);
});

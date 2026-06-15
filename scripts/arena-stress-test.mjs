#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const baseUrl = new URL(process.env.SURVIVOR_ARENA_TEST_BASE_URL ?? "http://127.0.0.1:8789");
const allowedHosts = new Set(["127.0.0.1", "localhost", "::1"]);

if (!allowedHosts.has(baseUrl.hostname) && process.env.ALLOW_REMOTE_SMOKE_TESTS !== "1") {
  throw new Error(
    `Refusing to run mutating stress tests against ${baseUrl.origin}. This test is designed for local D1 only.`,
  );
}

const tournamentCount = Number(process.env.STRESS_TOURNAMENTS ?? 300);
const userCount = Number(process.env.STRESS_USERS ?? 120);
const teamCount = Number(process.env.STRESS_TEAMS ?? 40);
const password = "ArenaStress1!";
const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const nodeBin = process.execPath;
const wranglerBin = "node_modules/wrangler/bin/wrangler.js";
const stressPrefix = `Stress ${stamp}`;
const expectedBalances = new Map();

function assert(condition, message, details) {
  if (!condition) {
    const suffix = details ? `\n${JSON.stringify(details, null, 2)}` : "";
    throw new Error(`${message}${suffix}`);
  }
}

function expectStatus(result, status, message) {
  assert(result.status === status, `${message}: expected ${status}, got ${result.status}`, result.data);
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

async function mapLimit(items, limit, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await fn(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));

  return results;
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

function currentRound(tournament) {
  return tournament.rounds.find((round) => round.round_number === tournament.current_round_number);
}

function futureDate(minutes = 60) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function matchResult(match, result) {
  return {
    matchId: match.id,
    result,
  };
}

function participantCountFor(index) {
  if (index === 0) {
    return 10;
  }

  if (index === 1 || index % 50 === 0) {
    return 100;
  }

  if (index % 10 === 0) {
    return 25;
  }

  return 6 + (index % 5);
}

function selectUsers(users, index, count) {
  return Array.from({ length: count }, (_, offset) => users[(index * 17 + offset) % users.length]);
}

async function register(client, username, email, phone) {
  const response = await client.request("/api/register", {
    body: {
      confirmPassword: password,
      email,
      password,
      phone,
      username,
    },
    method: "POST",
  });

  expectStatus(response, 201, `register ${username}`);
  assert(response.data.user?.id, "missing registered user", response.data);

  return response.data.user;
}

async function verifyTelegram(client, label) {
  const link = await client.request("/api/account/telegram-link", {
    body: {
      purpose: "verify",
    },
    method: "POST",
  });

  expectStatus(link, 200, `telegram link ${label}`);
  assert(link.data.telegramStartUrl, "missing telegram start url", link.data);

  const startUrl = new URL(link.data.telegramStartUrl);
  const linkCode = startUrl.searchParams.get("start");
  assert(linkCode, "missing telegram link code", link.data);

  const telegram = await client.request("/api/telegram/webhook", {
    body: {
      message: {
        chat: {
          id: Number(`30${Math.floor(10000000 + Math.random() * 89999999)}`),
        },
        from: {
          first_name: label,
          id: Number(`40${Math.floor(10000000 + Math.random() * 89999999)}`),
          username: label.slice(0, 24),
        },
        text: `/start ${linkCode}`,
      },
    },
    method: "POST",
  });
  expectStatus(telegram, 200, `telegram start ${label}`);
  assert(telegram.data.debugOtp, "telegram debug OTP missing. Start local dev with TELEGRAM_TEST_MODE=1 and TELEGRAM_DEBUG_CODES=1.", telegram.data);

  const verified = await client.request("/api/account/telegram-verify", {
    body: {
      code: telegram.data.debugOtp,
    },
    method: "POST",
  });

  expectStatus(verified, 200, `verify telegram ${label}`);
}

async function login(client, identifier, expectedRedirect = "/dashboard") {
  const response = await client.request("/api/login", {
    body: {
      identifier,
      password,
    },
    method: "POST",
  });

  expectStatus(response, 200, `login ${identifier}`);
  if (response.data.redirectTo === "/verifica-telegram" && expectedRedirect === "/dashboard") {
    await verifyTelegram(client, String(identifier));
    return response.data.user;
  }

  assert(response.data.redirectTo === expectedRedirect, "unexpected login redirect", response.data);

  return response.data.user;
}

function promoteAdmin(username) {
  runLocalSql(`UPDATE users SET role = 'admin' WHERE username = '${sql(username)}'`);
}

function seedBalances() {
  const now = new Date().toISOString();
  const emailPattern = `%@stress-${sql(stamp)}.example.com`;

  runLocalSql(`
    INSERT OR IGNORE INTO user_wallets (user_id, balance, created_at, updated_at)
    SELECT id, 0, '${sql(now)}', '${sql(now)}' FROM users WHERE email LIKE '${emailPattern}';
  `);
  runLocalSql(`
    UPDATE user_wallets
    SET balance = 1000000, updated_at = '${sql(now)}'
    WHERE user_id IN (SELECT id FROM users WHERE email LIKE '${emailPattern}');
  `);
}

async function createStressUsers() {
  const users = [];
  const adminClient = new Client();
  const adminUsername = `sadmin_${stamp.slice(-10)}`.slice(0, 20);
  const adminEmail = `admin-${stamp}@stress-${stamp}.example.com`;
  const adminUser = await register(adminClient, adminUsername, adminEmail, `+39199${Date.now().toString().slice(-8)}`);

  promoteAdmin(adminUsername);
  await login(adminClient, adminUsername, "/admin");

  for (let index = 0; index < userCount; index += 1) {
    const client = new Client();
    const suffix = `${index}`.padStart(3, "0");
    const username = `su${suffix}_${stamp.slice(-8)}`.slice(0, 20);
    const email = `user-${suffix}-${stamp}@stress-${stamp}.example.com`;
    const phone = `+393${String(index).padStart(3, "0")}${Date.now().toString().slice(-8)}`;
    const user = await register(client, username, email, phone);
    await login(client, username);
    users.push({
      client,
      user,
      username,
    });
    expectedBalances.set(user.id, 1000000);
  }

  seedBalances();

  return {
    admin: {
      client: adminClient,
      user: adminUser,
      username: adminUsername,
    },
    users,
  };
}

async function createTeams(admin) {
  const teams = [];

  for (let index = 0; index < teamCount; index += 1) {
    const name = `StressTeam ${stamp} ${String(index + 1).padStart(2, "0")}`;
    const response = await admin.request("/api/admin/teams", {
      body: {
        logoUrl: `https://example.com/${encodeURIComponent(name)}.png`,
        name,
      },
      method: "POST",
    });

    expectStatus(response, 201, `create team ${name}`);
    teams.push(response.data.team);
  }

  const duplicate = await admin.request("/api/admin/teams", {
    body: {
      logoUrl: teams[0].logo_url,
      name: teams[0].name,
    },
    method: "POST",
  });
  expectStatus(duplicate, 409, "duplicate team");

  return teams;
}

function tournamentInput(index, participantLimit) {
  return {
    description: `Stress locale ${index}`,
    entryCost: 10 + (index % 13),
    extraLifeCost: 5,
    initialLives: 1,
    maxLivesPerUser: 2,
    maxParticipants: participantLimit,
    name: `${stressPrefix} Tournament ${String(index + 1).padStart(3, "0")}`,
    prizePoolPercentage: 80,
    rules: "Stress test locale.",
    unlimitedLives: false,
    unlimitedParticipants: false,
  };
}

async function createTournament(admin, index, participantLimit, overrides = {}) {
  const response = await admin.request("/api/admin/tournaments", {
    body: {
      ...tournamentInput(index, participantLimit),
      ...overrides,
    },
    method: "POST",
  });

  expectStatus(response, 201, `create stress tournament ${index}`);

  return response.data.tournament;
}

async function configureRound(admin, tournament, pairs) {
  let round = currentRound(tournament);
  const deadline = await admin.request(`/api/admin/tournaments/${tournament.id}/round`, {
    body: {
      deadlineAt: futureDate(90),
      roundId: round.id,
    },
    method: "PATCH",
  });
  expectStatus(deadline, 200, `deadline ${tournament.name}`);
  tournament = deadline.data.tournament;
  round = currentRound(tournament);

  for (const [home, away] of pairs) {
    const added = await admin.request("/api/admin/matches", {
      body: {
        awayTeamId: away.id,
        homeTeamId: home.id,
        isLocked: false,
        isSelectable: true,
        roundId: round.id,
      },
      method: "POST",
    });
    expectStatus(added, 201, `match ${home.name} vs ${away.name}`);
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

async function openRound(admin, tournament) {
  const response = await admin.request(`/api/admin/tournaments/${tournament.id}/open-round`, {
    method: "POST",
  });

  expectStatus(response, 200, `open round ${currentRound(tournament)?.round_number}`);

  return response.data.tournament;
}

async function joinTournament(entryCost, participant, tournament) {
  const response = await participant.client.request(`/api/arena/tournaments/${tournament.id}/join`, {
    method: "POST",
  });

  expectStatus(response, 200, `join ${participant.username}`);
  expectedBalances.set(participant.user.id, expectedBalances.get(participant.user.id) - entryCost);

  return {
    participant,
    tournament: response.data.tournament,
  };
}

async function chooseTeam(joined, life, match, teamName, teamId) {
  const response = await joined.participant.client.request(`/api/arena/lives/${life.id}/choice`, {
    body: {
      matchId: match.id,
      selectedTeam: teamName,
      selectedTeamId: teamId,
    },
    method: "POST",
  });

  expectStatus(response, 200, `choice ${joined.participant.username}`);

  return response.data.tournament;
}

function pairSet(teams, index) {
  const start = (index * 3) % (teams.length - 8);

  return [
    [teams[start], teams[start + 1]],
    [teams[start + 2], teams[start + 3]],
    [teams[start + 4], teams[start + 5]],
    [teams[start + 6], teams[start + 7]],
  ];
}

async function runRegularTournament({ admin, index, participants, scenario, teams }) {
  const participantLimit = participants.length;
  const input = tournamentInput(index, participantLimit);
  let tournament = await createTournament(admin, index, participantLimit);
  tournament = await configureRound(admin, tournament, pairSet(teams, index));
  tournament = await publishTournament(admin, tournament);

  const joined = await mapLimit(participants, 12, (participant) =>
    joinTournament(input.entryCost, participant, tournament),
  );
  const roundOne = currentRound(tournament);
  const firstMatch = roundOne.matches[0];
  const prizePool = Math.floor((input.entryCost * input.prizePoolPercentage) / 100) * participants.length;

  if (scenario === "one_winner") {
    await mapLimit(joined, 12, (entry, entryIndex) =>
      chooseTeam(
        entry,
        entry.tournament.user_lives[0],
        firstMatch,
        entryIndex === 0 ? firstMatch.home_team : firstMatch.away_team,
        entryIndex === 0 ? firstMatch.home_team_id : firstMatch.away_team_id,
      ),
    );

    tournament = await lockTournament(admin, tournament);
    tournament = await calculateRound(admin, roundOne, [
      matchResult(firstMatch, "HOME_WIN"),
      ...roundOne.matches.slice(1).map((match) => matchResult(match, "HOME_WIN")),
    ]);
    expectedBalances.set(joined[0].participant.user.id, expectedBalances.get(joined[0].participant.user.id) + prizePool);
    assert(tournament.status === "COMPLETED", "one winner tournament not completed", tournament);
  }

  if (scenario === "zero_survivors") {
    await mapLimit(joined, 12, (entry, entryIndex) =>
      chooseTeam(
        entry,
        entry.tournament.user_lives[0],
        firstMatch,
        entryIndex % 2 === 0 ? firstMatch.home_team : firstMatch.away_team,
        entryIndex % 2 === 0 ? firstMatch.home_team_id : firstMatch.away_team_id,
      ),
    );

    tournament = await lockTournament(admin, tournament);
    tournament = await calculateRound(admin, roundOne, [
      matchResult(firstMatch, "DRAW"),
      ...roundOne.matches.slice(1).map((match) => matchResult(match, "HOME_WIN")),
    ]);
    const share = Math.floor(prizePool / participants.length);
    for (const entry of joined) {
      expectedBalances.set(entry.participant.user.id, expectedBalances.get(entry.participant.user.id) + share);
    }
    assert(tournament.status === "COMPLETED", "zero survivor tournament not completed", tournament);
  }

  if (scenario === "next_round") {
    await mapLimit(joined, 12, (entry, entryIndex) =>
      chooseTeam(
        entry,
        entry.tournament.user_lives[0],
        firstMatch,
        entryIndex % 2 === 0 ? firstMatch.home_team : firstMatch.away_team,
        entryIndex % 2 === 0 ? firstMatch.home_team_id : firstMatch.away_team_id,
      ),
    );

    tournament = await lockTournament(admin, tournament);
    tournament = await calculateRound(admin, roundOne, [
      matchResult(firstMatch, "HOME_WIN"),
      ...roundOne.matches.slice(1).map((match) => matchResult(match, "HOME_WIN")),
    ]);
    assert(currentRound(tournament).round_number === 2, "round 2 not created", tournament);

    const survivors = joined.filter((_, entryIndex) => entryIndex % 2 === 0);
    tournament = await configureRound(admin, tournament, pairSet(teams, index + 11));
    tournament = await openRound(admin, tournament);
    const roundTwo = currentRound(tournament);
    const roundTwoMatch = roundTwo.matches[0];

    await mapLimit(survivors, 12, (entry, entryIndex) =>
      chooseTeam(
        entry,
        entry.tournament.user_lives[0],
        roundTwoMatch,
        entryIndex === 0 ? roundTwoMatch.home_team : roundTwoMatch.away_team,
        entryIndex === 0 ? roundTwoMatch.home_team_id : roundTwoMatch.away_team_id,
      ),
    );

    tournament = await lockTournament(admin, tournament);
    tournament = await calculateRound(admin, roundTwo, [
      matchResult(roundTwoMatch, "HOME_WIN"),
      ...roundTwo.matches.slice(1).map((match) => matchResult(match, "HOME_WIN")),
    ]);
    expectedBalances.set(survivors[0].participant.user.id, expectedBalances.get(survivors[0].participant.user.id) + prizePool);
    assert(tournament.status === "COMPLETED", "next round tournament not completed", tournament);
  }

  if (index % 50 === 0) {
    const participantsResponse = await admin.request(`/api/admin/tournaments/${tournament.id}/participants`);
    expectStatus(participantsResponse, 200, `participants stress ${index}`);
    assert(participantsResponse.data.participants.length === participantLimit, "participant count mismatch", {
      expected: participantLimit,
      received: participantsResponse.data.participants.length,
    });
  }
}

async function runCycleTournament({ admin, index, participant, teams }) {
  const input = tournamentInput(index, 1);
  input.initialLives = 2;
  input.name = `${stressPrefix} Cycle Tournament`;

  let tournament = await createTournament(admin, index, 1, input);
  tournament = await configureRound(admin, tournament, [[teams[0], teams[1]]]);
  tournament = await publishTournament(admin, tournament);

  const joined = await joinTournament(input.entryCost, participant, tournament);
  const [lifeOne, lifeTwo] = joined.tournament.user_lives;
  const roundOneMatch = currentRound(joined.tournament).matches[0];

  await chooseTeam(joined, lifeOne, roundOneMatch, roundOneMatch.home_team, roundOneMatch.home_team_id);
  await chooseTeam(joined, lifeTwo, roundOneMatch, roundOneMatch.home_team, roundOneMatch.home_team_id);

  tournament = await lockTournament(admin, tournament);
  tournament = await calculateRound(admin, currentRound(tournament), [matchResult(roundOneMatch, "HOME_WIN")]);
  assert(currentRound(tournament).round_number === 2, "cycle stress round 2 not created", tournament);

  tournament = await configureRound(admin, tournament, [[teams[0], teams[2]]]);
  tournament = await openRound(admin, tournament);
  const roundTwoMatch = currentRound(tournament).matches[0];

  const repeated = await participant.client.request(`/api/arena/lives/${lifeOne.id}/choice`, {
    body: {
      matchId: roundTwoMatch.id,
      selectedTeam: roundTwoMatch.home_team,
      selectedTeamId: roundTwoMatch.home_team_id,
    },
    method: "POST",
  });
  expectStatus(repeated, 409, "life repeated team before cycle reset");

  await chooseTeam(joined, lifeOne, roundTwoMatch, roundTwoMatch.away_team, roundTwoMatch.away_team_id);
  await chooseTeam(joined, lifeTwo, roundTwoMatch, roundTwoMatch.away_team, roundTwoMatch.away_team_id);

  tournament = await lockTournament(admin, tournament);
  tournament = await calculateRound(admin, currentRound(tournament), [matchResult(roundTwoMatch, "AWAY_WIN")]);
  assert(currentRound(tournament).round_number === 3, "cycle stress round 3 not created", tournament);

  tournament = await configureRound(admin, tournament, [[teams[0], teams[2]]]);
  tournament = await openRound(admin, tournament);
  const roundThreeMatch = currentRound(tournament).matches[0];
  const afterReset = await chooseTeam(joined, lifeOne, roundThreeMatch, roundThreeMatch.home_team, roundThreeMatch.home_team_id);
  const updatedLife = afterReset.user_lives.find((life) => life.id === lifeOne.id);

  assert(updatedLife?.current_cycle === 2, "life cycle did not reset in stress test", updatedLife);
}

async function verifySampleBalances(users) {
  const samples = users.filter((_, index) => index % 13 === 0).slice(0, 10);

  for (const sample of samples) {
    const session = await sample.client.request("/api/session");
    expectStatus(session, 200, `sample session ${sample.username}`);
    assert(
      session.data.user.cup_balance === expectedBalances.get(sample.user.id),
      "sample balance mismatch after stress test",
      {
        expected: expectedBalances.get(sample.user.id),
        received: session.data.user.cup_balance,
        username: sample.username,
      },
    );
  }
}

function cleanupStressData() {
  const tournamentPattern = `${stressPrefix}%`;
  const teamPattern = `StressTeam ${stamp} %`;
  const emailPattern = `%@stress-${stamp}.example.com`;

  runLocalSql(`
    DELETE FROM life_selections
    WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE '${sql(tournamentPattern)}');
  `);
  runLocalSql(`
    DELETE FROM tournament_lives
    WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE '${sql(tournamentPattern)}');
  `);
  runLocalSql(`
    DELETE FROM tournament_registrations
    WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE '${sql(tournamentPattern)}');
  `);
  runLocalSql(`
    DELETE FROM tournament_matches
    WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE '${sql(tournamentPattern)}');
  `);
  runLocalSql(`
    DELETE FROM tournament_rounds
    WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE '${sql(tournamentPattern)}');
  `);
  runLocalSql(`
    DELETE FROM wallet_movements
    WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE '${sql(tournamentPattern)}');
  `);
  runLocalSql(`
    DELETE FROM arena_events
    WHERE tournament_id IN (SELECT id FROM tournaments WHERE name LIKE '${sql(tournamentPattern)}')
       OR message LIKE '%${sql(stamp)}%';
  `);
  runLocalSql(`DELETE FROM tournaments WHERE name LIKE '${sql(tournamentPattern)}';`);
  runLocalSql(`
    DELETE FROM wallet_movements
    WHERE user_id IN (SELECT id FROM users WHERE email LIKE '${sql(emailPattern)}');
  `);
  runLocalSql(`
    DELETE FROM user_wallets
    WHERE user_id IN (SELECT id FROM users WHERE email LIKE '${sql(emailPattern)}');
  `);
  runLocalSql(`
    DELETE FROM telegram_links
    WHERE user_id IN (SELECT id FROM users WHERE email LIKE '${sql(emailPattern)}');
  `);
  runLocalSql(`
    DELETE FROM pending_registrations
    WHERE email LIKE '${sql(emailPattern)}';
  `);
  runLocalSql(`
    DELETE FROM telegram_link_requests
    WHERE user_id IN (SELECT id FROM users WHERE email LIKE '${sql(emailPattern)}');
  `);
  runLocalSql(`
    DELETE FROM password_reset_codes
    WHERE user_id IN (SELECT id FROM users WHERE email LIKE '${sql(emailPattern)}');
  `);
  runLocalSql(`DELETE FROM users WHERE email LIKE '${sql(emailPattern)}';`);
  runLocalSql(`DELETE FROM teams WHERE name LIKE '${sql(teamPattern)}';`);
}

async function main() {
  console.log(`Stress tests base URL: ${baseUrl.origin}`);
  console.log("Production DB guard: enabled. D1 writes are local-only.");
  console.log(`Stress stamp: ${stamp}`);

  let created = false;

  try {
    const { admin, users } = await createStressUsers();
    created = true;
    const teams = await createTeams(admin.client);

    const listedTeams = await admin.client.request("/api/admin/teams");
    expectStatus(listedTeams, 200, "teams list after setup");
    assert(listedTeams.data.teams.length >= teams.length, "teams list missing created teams", listedTeams.data);

    for (let index = 0; index < tournamentCount; index += 1) {
      if (index === tournamentCount - 1) {
        await runCycleTournament({
          admin: admin.client,
          index,
          participant: users[0],
          teams,
        });
      } else {
        const count = participantCountFor(index);
        const participants = selectUsers(users, index, count);
        const scenario = index % 3 === 0 ? "one_winner" : index % 3 === 1 ? "zero_survivors" : "next_round";

        await runRegularTournament({
          admin: admin.client,
          index,
          participants,
          scenario,
          teams,
        });
      }

      if ((index + 1) % 25 === 0 || index === tournamentCount - 1) {
        console.log(`ok - ${index + 1}/${tournamentCount} tournaments simulated`);
      }
    }

    await verifySampleBalances(users);
    console.log(`\nStress test passed: ${tournamentCount} tournaments, ${userCount} users, ${teamCount} teams.`);
  } finally {
    if (created) {
      cleanupStressData();
      console.log("Local stress data cleaned up, including created teams.");
    }
  }
}

main().catch((error) => {
  console.error(error.stack ?? error.message ?? error);
  process.exit(1);
});

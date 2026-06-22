"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Crown,
  Download,
  Eye,
  ImageIcon,
  KeyRound,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PiggyBank,
  Plus,
  Search,
  Shield,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import {
  formatCups,
  formatDeadline,
  fromDateTimeLocal,
  isDeadlinePassed,
  toDateTimeLocal,
  type ArenaMatch,
  type ArenaTournament,
  type MatchResult,
} from "@/lib/arena-client";
import { cn } from "@/lib/cn";

type AdminUser = {
  cup_balance: number;
  email: string;
  id: string;
  role: string;
  user_code: string;
  username: string;
};

type AdminDashboardUser = AdminUser & {
  blocked_at: string | null;
  blocked_reason: string | null;
  created_at: string;
  last_login_at: string | null;
  phone: string;
  phone_verified_at: string | null;
  status: "active" | "blocked";
  telegram_username: string | null;
  updated_at: string;
};

type AdminUsersResponse =
  | {
      ok: true;
      users: AdminDashboardUser[];
    }
  | {
      message: string;
      ok: false;
    };

type AdminMovement = {
  amount: number;
  balance_after: number;
  created_at: string;
  description: string;
  id: string;
  movement_type: string;
};

type AdminUserMovementsResponse =
  | {
      balance: number;
      movements: AdminMovement[];
      ok: true;
      user: AdminUser;
    }
  | {
      message: string;
      ok: false;
    };

type AdminMessageSummary = {
  body: string;
  created_at: string;
  delivery_mode: "both" | "inbox" | "popup";
  id: string;
  popup_seen_count: number;
  read_count: number;
  recipient_count: number;
  target_type: "all" | "users";
  title: string;
};

type AdminMessagesResponse =
  | {
      messages: AdminMessageSummary[];
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

type SessionResponse =
  | {
      ok: true;
      user: AdminUser;
    }
  | {
      message: string;
      ok: false;
    };

type TournamentsResponse =
  | {
      ok: true;
      tournaments: ArenaTournament[];
    }
  | {
      message: string;
      ok: false;
    };

type TournamentResponse =
  | {
      ok: true;
      tournament: ArenaTournament;
    }
  | {
      message: string;
      ok: false;
    };

type Participant = {
  alive_lives: number;
  eliminated_lives: number;
  email: string;
  id: string;
  joined_at: string;
  lives: Array<{
    id: string;
    life_number: number;
    selections: Array<{
      round_id: string;
      selected_team: string;
      status: string;
    }>;
    status: string;
  }>;
  status: string;
  total_lives: number;
  user_code: string;
  username: string;
};

type EventLog = {
  created_at: string;
  email: string | null;
  event_type: string;
  id: string;
  message: string;
  tournament_name: string | null;
  username: string | null;
};

type Team = {
  created_at: string;
  created_by: string | null;
  id: string;
  logo_url: string | null;
  name: string;
  normalized_name: string;
  updated_at: string;
};

type TeamsResponse =
  | {
      ok: true;
      teams: Team[];
    }
  | {
      message: string;
      ok: false;
    };

type TeamResponse =
  | {
      ok: true;
      team: Team;
    }
  | {
      message: string;
      ok: false;
    };

type AdminPanelKey =
  | "dashboard"
  | "messages"
  | "create"
  | "manage"
  | "teams"
  | "participants"
  | "events";

type TournamentForm = {
  description: string;
  entryCost: string;
  extraLifeCost: string;
  initialLives: string;
  maxLivesPerUser: string;
  maxParticipants: string;
  name: string;
  prizePoolPercentage: string;
  rules: string;
  unlimitedLives: boolean;
  unlimitedParticipants: boolean;
};

const emptyTournamentForm: TournamentForm = {
  description: "",
  entryCost: "100",
  extraLifeCost: "50",
  initialLives: "1",
  maxLivesPerUser: "5",
  maxParticipants: "100",
  name: "",
  prizePoolPercentage: "80",
  rules: "",
  unlimitedLives: false,
  unlimitedParticipants: false,
};

const resultLabels: Record<MatchResult, string> = {
  AWAY_WIN: "Vittoria Trasferta",
  CANCELLED: "Annullato",
  DRAW: "Pareggio",
  HOME_WIN: "Vittoria Casa",
  PENDING: "Da inserire",
  POSTPONED: "Rinviato",
};

const resultOptions: MatchResult[] = [
  "HOME_WIN",
  "DRAW",
  "AWAY_WIN",
  "POSTPONED",
  "CANCELLED",
];

const adminTabs: Array<{
  icon: LucideIcon;
  key: AdminPanelKey;
  label: string;
}> = [
  {
    icon: LayoutDashboard,
    key: "dashboard",
    label: "Dashboard",
  },
  {
    icon: MessageSquare,
    key: "messages",
    label: "Messaggi",
  },
  {
    icon: Plus,
    key: "create",
    label: "Crea torneo",
  },
  {
    icon: Swords,
    key: "manage",
    label: "Gestisci",
  },
  {
    icon: ImageIcon,
    key: "teams",
    label: "Squadre",
  },
  {
    icon: Users,
    key: "participants",
    label: "Partecipanti",
  },
  {
    icon: ClipboardList,
    key: "events",
    label: "Registro eventi",
  },
];

async function fetchJson<TResponse>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const data = (await response.json()) as TResponse;

  return {
    data,
    response,
  };
}

function getCurrentRound(tournament: ArenaTournament | null) {
  return tournament?.rounds.find(
    (round) => round.round_number === tournament.current_round_number,
  ) ?? null;
}

function buildTournamentPayload(form: TournamentForm) {
  return {
    description: form.description,
    entryCost: Number(form.entryCost),
    extraLifeCost: Number(form.extraLifeCost),
    initialLives: Number(form.initialLives),
    maxLivesPerUser: Number(form.maxLivesPerUser),
    maxParticipants: Number(form.maxParticipants),
    name: form.name,
    prizePoolPercentage: Number(form.prizePoolPercentage),
    rules: form.rules,
    unlimitedLives: form.unlimitedLives,
    unlimitedParticipants: form.unlimitedParticipants,
  };
}

export function AdminArenaPanel() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [tournaments, setTournaments] = useState<ArenaTournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminDashboardUser[]>([]);
  const [adminUserQuery, setAdminUserQuery] = useState("");
  const [selectedAdminUserId, setSelectedAdminUserId] = useState("");
  const [selectedUserMovements, setSelectedUserMovements] = useState<AdminMovement[]>([]);
  const [selectedUserBalance, setSelectedUserBalance] = useState<number | null>(null);
  const [adminMessages, setAdminMessages] = useState<AdminMessageSummary[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [events, setEvents] = useState<EventLog[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantQuery, setParticipantQuery] = useState("");
  const [eventQuery, setEventQuery] = useState("");
  const [activePanel, setActivePanel] = useState<AdminPanelKey>("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const selectedTournament = useMemo(
    () => tournaments.find((tournament) => tournament.id === selectedTournamentId) ?? tournaments[0] ?? null,
    [selectedTournamentId, tournaments],
  );
  const selectedAdminUser = useMemo(
    () => adminUsers.find((adminUser) => adminUser.id === selectedAdminUserId) ?? adminUsers[0] ?? null,
    [adminUsers, selectedAdminUserId],
  );

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      const session = await fetchJson<SessionResponse>("/api/session");

      if (!isMounted) {
        return;
      }

      if (!session.data.ok) {
        router.replace("/login");
        return;
      }

      if (session.data.user.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setUser(session.data.user);
      const tournamentsResponse = await fetchJson<TournamentsResponse>("/api/admin/tournaments");

      if (tournamentsResponse.data.ok) {
        setTournaments(tournamentsResponse.data.tournaments);
        setSelectedTournamentId(tournamentsResponse.data.tournaments[0]?.id || "");
      } else {
        setMessage(tournamentsResponse.data.message);
      }

      const teamsResponse = await fetchJson<TeamsResponse>("/api/admin/teams");

      if (teamsResponse.data.ok) {
        setTeams(teamsResponse.data.teams);
      } else {
        setMessage(teamsResponse.data.message);
      }

      const eventsResponse = await fetchJson<
        | {
            events: EventLog[];
            ok: true;
          }
        | {
            message: string;
            ok: false;
          }
      >("/api/admin/events");

      if (eventsResponse.data.ok) {
        setEvents(eventsResponse.data.events);
      }

      const loadedUsers = await loadAdminUsers("");
      if (loadedUsers[0]) {
        await loadAdminUserMovements(loadedUsers[0].id);
      }

      await loadAdminMessages();

      setIsLoading(false);
    }

    boot().catch(() => {
      if (isMounted) {
        setMessage("Pannello admin non disponibile. Riprova tra poco.");
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function loadAdminUsers(query = adminUserQuery) {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }

    const { data } = await fetchJson<AdminUsersResponse>(`/api/admin/users${params.toString() ? `?${params}` : ""}`);

    if (!data.ok) {
      setMessage(data.message);
      return [];
    }

    setAdminUsers(data.users);
    setSelectedAdminUserId((current) => {
      if (current && data.users.some((adminUser) => adminUser.id === current)) {
        return current;
      }

      return data.users[0]?.id ?? "";
    });

    return data.users;
  }

  async function loadAdminUserMovements(userId = selectedAdminUser?.id) {
    if (!userId) {
      setSelectedUserBalance(null);
      setSelectedUserMovements([]);
      return;
    }

    const { data } = await fetchJson<AdminUserMovementsResponse>(`/api/admin/users/${userId}/movements`);

    if (!data.ok) {
      setMessage(data.message);
      return;
    }

    setSelectedUserBalance(data.balance);
    setSelectedUserMovements(data.movements);
  }

  async function loadAdminMessages() {
    const { data } = await fetchJson<AdminMessagesResponse>("/api/admin/messages");

    if (data.ok) {
      setAdminMessages(data.messages);
    } else {
      setMessage(data.message);
    }
  }

  async function loadEvents(query = eventQuery) {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }

    const { data } = await fetchJson<
      | {
          events: EventLog[];
          ok: true;
        }
      | {
          message: string;
          ok: false;
        }
    >(`/api/admin/events${params.toString() ? `?${params}` : ""}`);

    if (data.ok) {
      setEvents(data.events);
    } else {
      setMessage(data.message);
    }
  }

  async function loadParticipants(tournamentId = selectedTournament?.id, query = participantQuery) {
    if (!tournamentId) {
      return;
    }

    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }

    const { data } = await fetchJson<
      | {
          ok: true;
          participants: Participant[];
        }
      | {
          message: string;
          ok: false;
        }
    >(`/api/admin/tournaments/${tournamentId}/participants${params.toString() ? `?${params}` : ""}`);

    if (data.ok) {
      setParticipants(data.participants);
    } else {
      setMessage(data.message);
    }
  }

  async function loadTeams() {
    const { data } = await fetchJson<TeamsResponse>("/api/admin/teams");

    if (data.ok) {
      setTeams(data.teams);
    } else {
      setMessage(data.message);
    }
  }

  async function mutateTeam(url: string, init?: RequestInit) {
    setMessage("");
    const { data, response } = await fetchJson<TeamResponse | { ok: true } | { message: string; ok: false }>(url, init);

    if (!data.ok) {
      setMessage(data.message);
      return null;
    }

    await loadTeams();

    if (response.status === 201 || "team" in data) {
      return "team" in data ? data.team : null;
    }

    return null;
  }

  async function mutateTournament(
    url: string,
    init?: RequestInit,
    options: {
      keepPanel?: AdminPanelKey;
    } = {},
  ) {
    setMessage("");
    const { data } = await fetchJson<TournamentResponse>(url, init);

    if (!data.ok) {
      setMessage(data.message);
      return null;
    }

    setTournaments((current) => {
      const exists = current.some((tournament) => tournament.id === data.tournament.id);
      const next = exists
        ? current.map((tournament) => (tournament.id === data.tournament.id ? data.tournament : tournament))
        : [data.tournament, ...current];

      return next.sort((left, right) => right.id.localeCompare(left.id));
    });
    setSelectedTournamentId(data.tournament.id);
    setActivePanel(options.keepPanel ?? "manage");
    await loadEvents();

    return data.tournament;
  }

  async function updateUserStatus(userId: string, status: "active" | "blocked", reason: string) {
    setMessage("");
    const { data } = await fetchJson<
      | {
          ok: true;
          user: AdminDashboardUser;
        }
      | {
          message: string;
          ok: false;
        }
    >(`/api/admin/users/${userId}/status`, {
      body: JSON.stringify({
        reason,
        status,
      }),
      method: "PATCH",
    });

    if (!data.ok) {
      setMessage(data.message);
      return false;
    }

    setAdminUsers((current) =>
      current.map((adminUser) =>
        adminUser.id === userId
          ? {
              ...adminUser,
              blocked_at: data.user.blocked_at,
              blocked_reason: data.user.blocked_reason,
              status: data.user.status,
            }
          : adminUser,
      ),
    );
    setMessage(status === "blocked" ? "Accesso utente bloccato." : "Accesso utente riattivato.");

    return true;
  }

  async function updateUserPassword(userId: string, password: string, confirmPassword: string) {
    setMessage("");
    const { data } = await fetchJson<
      | {
          message: string;
          ok: true;
        }
      | {
          message: string;
          ok: false;
        }
    >(`/api/admin/users/${userId}/password`, {
      body: JSON.stringify({
        confirmPassword,
        password,
      }),
      method: "PATCH",
    });

    setMessage(data.message);

    return data.ok;
  }

  async function adjustUserWallet(userId: string, amount: number, reason: string) {
    setMessage("");
    const { data } = await fetchJson<
      | {
          balance: number;
          movements: AdminMovement[];
          ok: true;
        }
      | {
          message: string;
          ok: false;
        }
    >(`/api/admin/users/${userId}/wallet`, {
      body: JSON.stringify({
        amount,
        reason,
      }),
      method: "POST",
    });

    if (!data.ok) {
      setMessage(data.message);
      return false;
    }

    setSelectedUserBalance(data.balance);
    setSelectedUserMovements(data.movements);
    setAdminUsers((current) =>
      current.map((adminUser) =>
        adminUser.id === userId
          ? {
              ...adminUser,
              cup_balance: data.balance,
            }
          : adminUser,
      ),
    );
    setMessage(amount > 0 ? "Coppe depositate correttamente." : "Coppe prelevate correttamente.");

    return true;
  }

  async function sendAdminMessage(input: {
    body: string;
    deliveryMode: "both" | "inbox" | "popup";
    targetUserIds: string[];
    title: string;
  }) {
    setMessage("");
    const { data } = await fetchJson<
      | {
          message: AdminMessageSummary;
          ok: true;
        }
      | {
          message: string;
          ok: false;
        }
    >("/api/admin/messages", {
      body: JSON.stringify(input),
      method: "POST",
    });

    if (!data.ok) {
      setMessage(data.message);
      return false;
    }

    await loadAdminMessages();
    setMessage("Messaggio inviato correttamente.");

    return true;
  }

  async function handleLogout() {
    await fetch("/api/logout", {
      credentials: "include",
      method: "POST",
    });
    router.replace("/");
  }

  if (isLoading || !user) {
    return (
      <main className="user-page">
        <section className="user-loading-shell">
          <Card className="user-loading-card">
            <p>{message || "Caricamento pannello admin..."}</p>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="user-page admin-page">
      <header className="admin-header">
        <BrandLogo />
        <div className="admin-header-copy">
          <span>Admin Arena</span>
          <strong>{user.username}</strong>
        </div>
        <button className="admin-logout-button" onClick={handleLogout} type="button">
          Logout
        </button>
      </header>

      <section className="admin-shell">
        <header className="admin-hero">
          <p className="user-page-kicker">Pannello Admin</p>
          <h1>ADMIN ARENA</h1>
          <p>Gestisci tornei, round, vite, scelte e registro eventi da un unico pannello.</p>
          <PremiumDivider />
        </header>

        {message ? (
          <div className="auth-form-message auth-form-message-error" role="alert">
            {message}
          </div>
        ) : null}

        <nav className="admin-tabs" aria-label="Sezioni admin">
          {adminTabs.map(({ icon: Icon, key, label }) => (
            <button
              className={cn("admin-tab", activePanel === key && "admin-tab-active")}
              key={key}
              onClick={() => {
                setActivePanel(key);
                if (key === "dashboard") {
                  void loadAdminUsers();
                  if (selectedAdminUser?.id) {
                    void loadAdminUserMovements(selectedAdminUser.id);
                  }
                }
                if (key === "messages") {
                  void loadAdminUsers();
                  void loadAdminMessages();
                }
                if (key === "participants") {
                  void loadParticipants();
                }
                if (key === "teams") {
                  void loadTeams();
                }
                if (key === "events") {
                  void loadEvents();
                }
              }}
              type="button"
            >
              <Icon aria-hidden="true" className="admin-tab-icon" />
              {label}
            </button>
          ))}
        </nav>

        <div className={cn("admin-layout-grid", (activePanel === "dashboard" || activePanel === "messages") && "admin-layout-grid-wide")}>
          {activePanel !== "dashboard" && activePanel !== "messages" ? (
            <TournamentSidebar
              onSelect={(id) => {
                setSelectedTournamentId(id);
                setActivePanel("manage");
                void loadParticipants(id);
              }}
              selectedTournamentId={selectedTournament?.id ?? ""}
              tournaments={tournaments}
            />
          ) : null}

          <div className="admin-main-panel">
            {activePanel === "dashboard" ? (
              <AdminUsersDashboard
                movements={selectedUserMovements}
                onAdjustWallet={adjustUserWallet}
                onChangePassword={updateUserPassword}
                onExport={() => exportUsersCsv(adminUsers)}
                onRefresh={() => {
                  void loadAdminUsers(adminUserQuery);
                  if (selectedAdminUser?.id) {
                    void loadAdminUserMovements(selectedAdminUser.id);
                  }
                }}
                onSearch={(query) => {
                  setAdminUserQuery(query);
                  void loadAdminUsers(query);
                }}
                onSelect={(adminUser) => {
                  setSelectedAdminUserId(adminUser.id);
                  void loadAdminUserMovements(adminUser.id);
                }}
                onToggleStatus={updateUserStatus}
                query={adminUserQuery}
                selectedBalance={selectedUserBalance}
                selectedUser={selectedAdminUser}
                users={adminUsers}
              />
            ) : null}

            {activePanel === "messages" ? (
              <AdminMessagesPanel
                messages={adminMessages}
                onSend={sendAdminMessage}
                users={adminUsers}
              />
            ) : null}

            {activePanel === "create" ? (
              <CreateTournamentWizard
                onCreate={async (form) => {
                  const tournament = await mutateTournament("/api/admin/tournaments", {
                    body: JSON.stringify(buildTournamentPayload(form)),
                    method: "POST",
                  });

                  if (tournament) {
                    setMessage("Torneo creato in stato PENDING. Ora configura il Round 1.");
                  }
                }}
              />
            ) : null}

            {activePanel === "manage" ? (
              <TournamentManager
                key={`${selectedTournament?.id ?? "empty"}-${getCurrentRound(selectedTournament)?.id ?? "none"}-${getCurrentRound(selectedTournament)?.updated_at ?? "fresh"}`}
                onMutate={mutateTournament}
                teams={teams}
                tournament={selectedTournament}
              />
            ) : null}

            {activePanel === "teams" ? (
              <TeamsPanel
                onMutate={mutateTeam}
                teams={teams}
              />
            ) : null}

            {activePanel === "participants" ? (
              <ParticipantsPanel
                onSearch={(query) => {
                  setParticipantQuery(query);
                  void loadParticipants(selectedTournament?.id, query);
                }}
                participants={participants}
                query={participantQuery}
                tournament={selectedTournament}
              />
            ) : null}

            {activePanel === "events" ? (
              <EventsPanel
                events={events}
                onSearch={(query) => {
                  setEventQuery(query);
                  void loadEvents(query);
                }}
                query={eventQuery}
              />
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Mai";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatDateOnly(value: string | null) {
  if (!value) {
    return "Mai";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function shiftDateInputValue(value: string, days: number) {
  const source = value ? new Date(`${value}T12:00:00`) : new Date();
  source.setDate(source.getDate() + days);

  return toDateInputValue(source);
}

function getUserStatusLabel(status: AdminDashboardUser["status"]) {
  return status === "blocked" ? "Bloccato" : "Attivo";
}

function formatCsvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");

  return `"${text.replaceAll('"', '""')}"`;
}

function exportUsersCsv(users: AdminDashboardUser[]) {
  const headers = [
    "Username",
    "Codice utente",
    "Email",
    "Telefono",
    "Ruolo",
    "Stato",
    "Coppe",
    "Creato il",
    "Ultimo login",
    "Motivo blocco",
  ];
  const rows = users.map((user) => [
    user.username,
    user.user_code,
    user.email,
    user.phone,
    user.role,
    getUserStatusLabel(user.status),
    user.cup_balance,
    formatDateTime(user.created_at),
    formatDateTime(user.last_login_at),
    user.blocked_reason ?? "",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => formatCsvCell(cell)).join(";"))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `survivor-arena-utenti-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function AdminUsersDashboard({
  movements,
  onAdjustWallet,
  onChangePassword,
  onExport,
  onRefresh,
  onSearch,
  onSelect,
  onToggleStatus,
  query,
  selectedBalance,
  selectedUser,
  users,
}: {
  movements: AdminMovement[];
  onAdjustWallet: (userId: string, amount: number, reason: string) => Promise<boolean>;
  onChangePassword: (userId: string, password: string, confirmPassword: string) => Promise<boolean>;
  onExport: () => void;
  onRefresh: () => void;
  onSearch: (query: string) => void;
  onSelect: (user: AdminDashboardUser) => void;
  onToggleStatus: (userId: string, status: "active" | "blocked", reason: string) => Promise<boolean>;
  query: string;
  selectedBalance: number | null;
  selectedUser: AdminDashboardUser | null;
  users: AdminDashboardUser[];
}) {
  const [passwordForm, setPasswordForm] = useState({
    confirmPassword: "",
    password: "",
  });
  const [walletForm, setWalletForm] = useState({
    amount: "",
    reason: "",
  });
  const [walletOperation, setWalletOperation] = useState<"deposit" | "withdraw">("deposit");
  const [blockReason, setBlockReason] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [activeModal, setActiveModal] = useState<"movements" | "profile" | "wallet" | null>(null);
  const [activeUserId, setActiveUserId] = useState("");
  const [movementDateFrom, setMovementDateFrom] = useState("");
  const [movementDateTo, setMovementDateTo] = useState("");
  const [movementPage, setMovementPage] = useState(1);
  const activeUsers = users.filter((adminUser) => adminUser.status === "active").length;
  const blockedUsers = users.filter((adminUser) => adminUser.status === "blocked").length;
  const totalCups = users.reduce((sum, adminUser) => sum + (adminUser.cup_balance ?? 0), 0);
  const activeUser = (activeUserId ? users.find((adminUser) => adminUser.id === activeUserId) : null) ?? selectedUser;
  const activeBalance = activeUser
    ? activeUser.id === selectedUser?.id
      ? selectedBalance ?? activeUser.cup_balance ?? 0
      : activeUser.cup_balance ?? 0
    : 0;
  const activeMovements = activeUser?.id === selectedUser?.id ? movements : [];
  const movementPageSize = 10;
  const filteredMovements = activeMovements.filter((movement) => {
    const movementTime = new Date(movement.created_at).getTime();
    const fromTime = movementDateFrom ? new Date(`${movementDateFrom}T00:00:00`).getTime() : -Infinity;
    const toTime = movementDateTo ? new Date(`${movementDateTo}T23:59:59`).getTime() : Infinity;

    return movementTime >= fromTime && movementTime <= toTime;
  });
  const movementPages = Math.max(1, Math.ceil(filteredMovements.length / movementPageSize));
  const currentMovementPage = Math.min(movementPage, movementPages);
  const paginatedMovements = filteredMovements.slice(
    (currentMovementPage - 1) * movementPageSize,
    currentMovementPage * movementPageSize,
  );

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeUser) {
      return;
    }

    setIsWorking(true);
    const ok = await onChangePassword(activeUser.id, passwordForm.password, passwordForm.confirmPassword);
    if (ok) {
      setPasswordForm({
        confirmPassword: "",
        password: "",
      });
    }
    setIsWorking(false);
  }

  async function handleWalletSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeUser) {
      return;
    }

    const absoluteAmount = Math.abs(Number(walletForm.amount));
    if (!Number.isFinite(absoluteAmount) || absoluteAmount <= 0) {
      return;
    }

    const signedAmount = walletOperation === "withdraw" ? -absoluteAmount : absoluteAmount;
    setIsWorking(true);
    const ok = await onAdjustWallet(activeUser.id, signedAmount, walletForm.reason);
    if (ok) {
      setWalletForm({
        amount: "",
        reason: "",
      });
      setWalletOperation("deposit");
      setActiveModal(null);
    }
    setIsWorking(false);
  }

  async function handleStatusToggle() {
    if (!activeUser) {
      return;
    }

    const nextStatus = activeUser.status === "blocked" ? "active" : "blocked";
    setIsWorking(true);
    const ok = await onToggleStatus(activeUser.id, nextStatus, blockReason);
    if (ok) {
      setBlockReason("");
    }
    setIsWorking(false);
  }

  function openUserModal(user: AdminDashboardUser, modal: "movements" | "profile" | "wallet") {
    setActiveUserId(user.id);
    setActiveModal(modal);
    onSelect(user);

    if (modal === "movements") {
      setMovementDateFrom("");
      setMovementDateTo("");
      setMovementPage(1);
    }

    if (modal === "wallet") {
      setWalletOperation("deposit");
      setWalletForm({
        amount: "",
        reason: "",
      });
    }
  }

  function shiftMovementDates(days: number) {
    setMovementDateFrom((current) => shiftDateInputValue(current || movementDateTo, days));
    setMovementDateTo((current) => shiftDateInputValue(current || movementDateFrom, days));
    setMovementPage(1);
  }

  return (
    <div className="admin-stack">
      <Card className="admin-card">
        <div className="admin-card-heading admin-dashboard-heading">
          <div>
            <p className="user-page-kicker">Controllo utenti</p>
            <h2>Dashboard utenti</h2>
            <p>Gestisci accesso, saldo Coppe, password e storico movimenti degli account registrati.</p>
          </div>
          <div className="admin-actions-row admin-dashboard-actions">
            <Button onClick={onRefresh} type="button" variant="secondary">
              Aggiorna
            </Button>
            <Button onClick={onExport} type="button" variant="gold">
              <Download aria-hidden="true" className="admin-button-icon" />
              Esporta CSV
            </Button>
          </div>
        </div>

        <div className="admin-summary-grid">
          <AdminMetric icon={Users} label="Utenti totali" value={users.length.toString()} />
          <AdminMetric icon={CheckCircle2} label="Attivi" value={activeUsers.toString()} />
          <AdminMetric icon={Ban} label="Bloccati" value={blockedUsers.toString()} />
          <AdminMetric icon={Crown} label="Coppe totali" value={formatCups(totalCups)} />
        </div>

        <SearchBox
          onSearch={onSearch}
          placeholder="Cerca username, email, telefono o codice"
          query={query}
        />

        <div className="admin-users-layout">
          <div className="admin-user-list" aria-label="Utenti registrati">
            {users.length > 0 ? (
              <div className="admin-user-list-scroll">
                <div className="admin-user-list-header" aria-hidden="true">
                  <span>Utente</span>
                  <span>Codice</span>
                  <span>Verifica</span>
                  <span>Saldo</span>
                  <span>Ruolo</span>
                  <span>Iscritto</span>
                  <span>Azioni</span>
                </div>

                {users.map((adminUser) => {
                  const isBlocked = adminUser.status === "blocked";
                  const isVerified = adminUser.role === "admin" || Boolean(adminUser.phone_verified_at);
                  const verificationLabel = adminUser.role === "admin"
                    ? "Admin OK"
                    : isVerified
                      ? "Telefono OK"
                      : "Da verificare";

                  return (
                    <article
                      className={cn(
                        "admin-user-row",
                        selectedUser?.id === adminUser.id && "admin-user-row-active",
                      )}
                      key={adminUser.id}
                    >
                      <button className="admin-user-row-main" onClick={() => openUserModal(adminUser, "profile")} type="button">
                        <span className="admin-user-cell admin-user-identity">
                          <span
                            className={cn("admin-user-presence", isBlocked && "admin-user-presence-danger")}
                            aria-hidden="true"
                          />
                          <span className="admin-user-main">
                            <strong>{adminUser.username}</strong>
                            <small>
                              {adminUser.email} • {getUserStatusLabel(adminUser.status)}
                            </small>
                          </span>
                        </span>
                        <span className="admin-user-cell admin-user-code">( {adminUser.user_code} )</span>
                        <span
                          className={cn(
                            "admin-user-cell admin-user-verify",
                            isVerified ? "admin-user-verify-ok" : "admin-user-verify-warn",
                          )}
                        >
                          {verificationLabel}
                        </span>
                        <span className="admin-user-cell admin-user-amount">
                          {formatCups(adminUser.cup_balance ?? 0)}
                        </span>
                        <span className="admin-user-cell admin-user-role">
                          {adminUser.role === "admin" ? "Admin" : "Utente"}
                        </span>
                        <span className="admin-user-cell admin-user-date">
                          {formatDateOnly(adminUser.created_at)}
                        </span>
                      </button>
                      <span className="admin-user-row-actions">
                        <button
                          className="admin-user-action-button"
                          onClick={() => openUserModal(adminUser, "movements")}
                          type="button"
                        >
                          Movimenti
                        </button>
                        <button
                          className="admin-user-action-button admin-user-action-button-secondary"
                          onClick={() => openUserModal(adminUser, "wallet")}
                          type="button"
                        >
                          Giroconto
                        </button>
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="admin-muted">Nessun utente trovato.</p>
            )}
          </div>

          <div className="admin-user-detail">
            {selectedUser ? (
              <>
                <div className="admin-user-profile-card">
                  <div>
                    <p className="user-page-kicker">Utente selezionato</p>
                    <h3>{selectedUser.username}</h3>
                    <span>{selectedUser.user_code}</span>
                  </div>
                  <span className={cn("admin-status-pill", selectedUser.status === "blocked" && "admin-status-pill-danger")}>
                    {getUserStatusLabel(selectedUser.status)}
                  </span>
                </div>

                <div className="admin-user-data-grid">
                  <AdminDataItem label="Email" value={selectedUser.email} />
                  <AdminDataItem label="Telefono" value={selectedUser.phone} />
                  <AdminDataItem
                    label="Verifica telefono"
                    value={selectedUser.phone_verified_at ? "Verificato" : "Non verificato"}
                  />
                  <AdminDataItem
                    label="Telegram"
                    value={selectedUser.telegram_username ? `@${selectedUser.telegram_username}` : "Non collegato"}
                  />
                  <AdminDataItem label="Ruolo" value={selectedUser.role} />
                  <AdminDataItem label="Saldo" value={formatCups(selectedBalance ?? selectedUser.cup_balance ?? 0)} />
                  <AdminDataItem label="Creato" value={formatDateTime(selectedUser.created_at)} />
                  <AdminDataItem label="Ultimo login" value={formatDateTime(selectedUser.last_login_at)} />
                </div>

                <div className="admin-user-tools-grid">
                  <form className="admin-tool-card" onSubmit={handlePasswordSubmit}>
                    <div className="admin-tool-heading">
                      <KeyRound aria-hidden="true" className="admin-metric-icon" />
                      <strong>Cambia password</strong>
                    </div>
                    <input
                      className="ui-input"
                      onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Nuova password"
                      type="password"
                      value={passwordForm.password}
                    />
                    <input
                      className="ui-input"
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                      }
                      placeholder="Conferma password"
                      type="password"
                      value={passwordForm.confirmPassword}
                    />
                    <Button disabled={isWorking} type="submit" variant="secondary">
                      Aggiorna password
                    </Button>
                  </form>

                  <form className="admin-tool-card" onSubmit={handleWalletSubmit}>
                    <div className="admin-tool-heading">
                      <PiggyBank aria-hidden="true" className="admin-metric-icon" />
                      <strong>Deposita / preleva Coppe</strong>
                    </div>
                    <input
                      className="ui-input"
                      inputMode="numeric"
                      onChange={(event) => setWalletForm((current) => ({ ...current, amount: event.target.value }))}
                      placeholder="Es. 500 oppure -100"
                      type="number"
                      value={walletForm.amount}
                    />
                    <input
                      className="ui-input"
                      onChange={(event) => setWalletForm((current) => ({ ...current, reason: event.target.value }))}
                      placeholder="Motivo operazione"
                      value={walletForm.reason}
                    />
                    <Button disabled={isWorking} type="submit" variant="gold">
                      Applica movimento
                    </Button>
                  </form>
                </div>

                <div className="admin-tool-card">
                  <div className="admin-tool-heading">
                    {selectedUser.status === "blocked" ? (
                      <CheckCircle2 aria-hidden="true" className="admin-metric-icon" />
                    ) : (
                      <Ban aria-hidden="true" className="admin-metric-icon" />
                    )}
                    <strong>{selectedUser.status === "blocked" ? "Riattiva accesso" : "Blocca accesso"}</strong>
                  </div>
                  {selectedUser.status === "active" ? (
                    <input
                      className="ui-input"
                      onChange={(event) => setBlockReason(event.target.value)}
                      placeholder="Motivo blocco, facoltativo"
                      value={blockReason}
                    />
                  ) : selectedUser.blocked_reason ? (
                    <p className="admin-muted">Motivo blocco: {selectedUser.blocked_reason}</p>
                  ) : null}
                  <Button
                    disabled={isWorking}
                    onClick={handleStatusToggle}
                    type="button"
                    variant={selectedUser.status === "blocked" ? "primary" : "secondary"}
                  >
                    {selectedUser.status === "blocked" ? "Riattiva utente" : "Blocca utente"}
                  </Button>
                </div>

                <div className="admin-tool-card">
                  <div className="admin-tool-heading">
                    <Eye aria-hidden="true" className="admin-metric-icon" />
                    <strong>Lista movimenti</strong>
                  </div>
                  <div className="admin-user-movement-list">
                    {movements.length > 0 ? (
                      movements.map((movement) => (
                        <article className="admin-user-movement-row" key={movement.id}>
                          <span>
                            {movement.amount > 0 ? "+" : ""}
                            {formatCups(movement.amount)}
                          </span>
                          <strong>{movement.description}</strong>
                          <small>{formatDateTime(movement.created_at)}</small>
                        </article>
                      ))
                    ) : (
                      <p className="admin-muted">Nessun movimento registrato per questo utente.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="admin-muted">Seleziona un utente per gestirlo.</p>
            )}
          </div>
        </div>
      </Card>

      {activeModal === "profile" && activeUser ? (
        <AdminModal onClose={() => setActiveModal(null)} title={activeUser.username} kicker="Scheda utente">
          <div className="admin-user-profile-card">
            <div>
              <p className="user-page-kicker">Utente selezionato</p>
              <h3>{activeUser.username}</h3>
              <span>{activeUser.user_code}</span>
            </div>
            <span className={cn("admin-status-pill", activeUser.status === "blocked" && "admin-status-pill-danger")}>
              {getUserStatusLabel(activeUser.status)}
            </span>
          </div>

          <div className="admin-user-data-grid">
            <AdminDataItem label="Email" value={activeUser.email} />
            <AdminDataItem label="Telefono" value={activeUser.phone} />
            <AdminDataItem
              label="Verifica telefono"
              value={activeUser.phone_verified_at ? "Verificato" : "Non verificato"}
            />
            <AdminDataItem
              label="Telegram"
              value={activeUser.telegram_username ? `@${activeUser.telegram_username}` : "Non collegato"}
            />
            <AdminDataItem label="Ruolo" value={activeUser.role} />
            <AdminDataItem label="Saldo" value={formatCups(activeBalance)} />
            <AdminDataItem label="Creato" value={formatDateTime(activeUser.created_at)} />
            <AdminDataItem label="Ultimo login" value={formatDateTime(activeUser.last_login_at)} />
          </div>

          <div className="admin-user-tools-grid">
            <form className="admin-tool-card" onSubmit={handlePasswordSubmit}>
              <div className="admin-tool-heading">
                <KeyRound aria-hidden="true" className="admin-metric-icon" />
                <strong>Cambia password</strong>
              </div>
              <input
                className="ui-input"
                onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Nuova password"
                type="password"
                value={passwordForm.password}
              />
              <input
                className="ui-input"
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                placeholder="Conferma password"
                type="password"
                value={passwordForm.confirmPassword}
              />
              <Button disabled={isWorking} type="submit" variant="secondary">
                Aggiorna password
              </Button>
            </form>

            <div className="admin-tool-card">
              <div className="admin-tool-heading">
                {activeUser.status === "blocked" ? (
                  <CheckCircle2 aria-hidden="true" className="admin-metric-icon" />
                ) : (
                  <Ban aria-hidden="true" className="admin-metric-icon" />
                )}
                <strong>{activeUser.status === "blocked" ? "Riattiva accesso" : "Blocca accesso"}</strong>
              </div>
              {activeUser.status === "active" ? (
                <input
                  className="ui-input"
                  onChange={(event) => setBlockReason(event.target.value)}
                  placeholder="Motivo blocco, facoltativo"
                  value={blockReason}
                />
              ) : activeUser.blocked_reason ? (
                <p className="admin-muted">Motivo blocco: {activeUser.blocked_reason}</p>
              ) : null}
              <Button
                disabled={isWorking}
                onClick={handleStatusToggle}
                type="button"
                variant={activeUser.status === "blocked" ? "primary" : "secondary"}
              >
                {activeUser.status === "blocked" ? "Riattiva utente" : "Blocca utente"}
              </Button>
            </div>
          </div>
        </AdminModal>
      ) : null}

      {activeModal === "wallet" && activeUser ? (
        <AdminModal onClose={() => setActiveModal(null)} title="Giroconto Coppe" kicker={activeUser.username}>
          <form className="admin-modal-form" onSubmit={handleWalletSubmit}>
            <div className="admin-wallet-summary">
              <span>Saldo attuale</span>
              <strong>{formatCups(activeBalance)}</strong>
            </div>
            <div className="admin-segmented-control" role="radiogroup" aria-label="Tipo giroconto">
              <label className={cn(walletOperation === "deposit" && "admin-segmented-active")}>
                <input
                  checked={walletOperation === "deposit"}
                  name="wallet-operation"
                  onChange={() => setWalletOperation("deposit")}
                  type="radio"
                />
                Deposito
              </label>
              <label className={cn(walletOperation === "withdraw" && "admin-segmented-active")}>
                <input
                  checked={walletOperation === "withdraw"}
                  name="wallet-operation"
                  onChange={() => setWalletOperation("withdraw")}
                  type="radio"
                />
                Prelievo
              </label>
            </div>
            <label className="ui-field">
              <span className="ui-field-label">Importo Coppe</span>
              <input
                className="ui-input"
                inputMode="numeric"
                min="1"
                onChange={(event) => setWalletForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder="Es. 500"
                type="number"
                value={walletForm.amount}
              />
            </label>
            <label className="ui-field">
              <span className="ui-field-label">Motivo</span>
              <input
                className="ui-input"
                onChange={(event) => setWalletForm((current) => ({ ...current, reason: event.target.value }))}
                placeholder="Es. Accredito manuale"
                value={walletForm.reason}
              />
            </label>
            <Button disabled={isWorking} type="submit" variant={walletOperation === "deposit" ? "gold" : "secondary"}>
              OK
            </Button>
          </form>
        </AdminModal>
      ) : null}

      {activeModal === "movements" && activeUser ? (
        <AdminModal onClose={() => setActiveModal(null)} title="Movimenti utente" kicker={activeUser.username}>
          <div className="admin-movement-toolbar">
            <button className="admin-date-step-button" onClick={() => shiftMovementDates(-1)} type="button">
              Giorno precedente
            </button>
            <label>
              Da
              <input
                className="admin-date-input"
                onChange={(event) => {
                  setMovementDateFrom(event.target.value);
                  setMovementPage(1);
                }}
                type="date"
                value={movementDateFrom}
              />
            </label>
            <label>
              A
              <input
                className="admin-date-input"
                onChange={(event) => {
                  setMovementDateTo(event.target.value);
                  setMovementPage(1);
                }}
                type="date"
                value={movementDateTo}
              />
            </label>
            <button className="admin-date-step-button" onClick={() => shiftMovementDates(1)} type="button">
              Giorno successivo
            </button>
            <button
              className="admin-date-step-button"
              onClick={() => {
                setMovementDateFrom("");
                setMovementDateTo("");
                setMovementPage(1);
              }}
              type="button"
            >
              Tutti
            </button>
          </div>

          <div className="admin-user-movement-list admin-modal-movement-list">
            {paginatedMovements.length > 0 ? (
              paginatedMovements.map((movement) => (
                <article className="admin-user-movement-row" key={movement.id}>
                  <span>
                    {movement.amount > 0 ? "+" : ""}
                    {formatCups(movement.amount)}
                  </span>
                  <strong>{movement.description}</strong>
                  <small>
                    {formatDateTime(movement.created_at)} • Saldo {formatCups(movement.balance_after)}
                  </small>
                </article>
              ))
            ) : (
              <p className="admin-empty-state">
                {activeMovements.length > 0
                  ? "Nessun movimento da mostrare per le date selezionate."
                  : "Nessun movimento da mostrare."}
              </p>
            )}
          </div>

          <div className="admin-pagination">
            <Button
              disabled={currentMovementPage <= 1}
              onClick={() => setMovementPage((current) => Math.max(1, current - 1))}
              type="button"
              variant="secondary"
            >
              Indietro
            </Button>
            <span>
              Pagina {currentMovementPage} di {movementPages}
            </span>
            <Button
              disabled={currentMovementPage >= movementPages}
              onClick={() => setMovementPage((current) => Math.min(movementPages, current + 1))}
              type="button"
              variant="secondary"
            >
              Avanti
            </Button>
          </div>
        </AdminModal>
      ) : null}
    </div>
  );
}

function AdminModal({
  children,
  kicker,
  onClose,
  title,
}: {
  children: ReactNode;
  kicker: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="admin-modal-backdrop" role="presentation">
      <section className="admin-modal-card" aria-modal="true" role="dialog">
        <header className="admin-modal-header">
          <div>
            <p className="user-page-kicker">{kicker}</p>
            <h2>{title}</h2>
          </div>
          <button aria-label="Chiudi popup" className="admin-modal-close" onClick={onClose} type="button">
            ×
          </button>
        </header>
        <div className="admin-modal-content">{children}</div>
      </section>
    </div>
  );
}

function AdminMessagesPanel({
  messages,
  onSend,
  users,
}: {
  messages: AdminMessageSummary[];
  onSend: (input: {
    body: string;
    deliveryMode: "both" | "inbox" | "popup";
    targetUserIds: string[];
    title: string;
  }) => Promise<boolean>;
  users: AdminDashboardUser[];
}) {
  const [form, setForm] = useState({
    body: "",
    deliveryMode: "inbox" as "both" | "inbox" | "popup",
    targetMode: "all" as "all" | "users",
    title: "",
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [localMessage, setLocalMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedSet = new Set(selectedUserIds);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalMessage("");

    if (form.targetMode === "users" && selectedUserIds.length === 0) {
      setLocalMessage("Seleziona almeno un utente oppure scegli invio a tutti.");
      return;
    }

    setIsSubmitting(true);
    const ok = await onSend({
      body: form.body,
      deliveryMode: form.deliveryMode,
      targetUserIds: form.targetMode === "all" ? [] : selectedUserIds,
      title: form.title,
    });

    if (ok) {
      setForm({
        body: "",
        deliveryMode: "inbox",
        targetMode: "all",
        title: "",
      });
      setSelectedUserIds([]);
      setLocalMessage("Messaggio inviato.");
    }

    setIsSubmitting(false);
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  return (
    <div className="admin-stack">
      <Card className="admin-card">
        <div className="admin-card-heading">
          <p className="user-page-kicker">Comunicazioni</p>
          <h2>Messaggi agli utenti</h2>
          <p>Invia avvisi in posta, popup al login oppure entrambi. Puoi scegliere tutti gli utenti o destinatari specifici.</p>
        </div>

        {localMessage ? (
          <div className="auth-form-message auth-form-message-success" role="alert">
            {localMessage}
          </div>
        ) : null}

        <form className="admin-message-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="ui-field">
              <label className="ui-field-label" htmlFor="admin-message-title">
                Titolo
              </label>
              <input
                className="ui-input"
                id="admin-message-title"
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Es. Nuova Arena disponibile"
                value={form.title}
              />
            </div>

            <div className="ui-field">
              <label className="ui-field-label" htmlFor="admin-message-delivery">
                Dove appare
              </label>
              <select
                className="admin-select"
                id="admin-message-delivery"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    deliveryMode: event.target.value as "both" | "inbox" | "popup",
                  }))
                }
                value={form.deliveryMode}
              >
                <option value="inbox">Posta utente</option>
                <option value="popup">Popup al login</option>
                <option value="both">Posta + popup</option>
              </select>
            </div>

            <label className="ui-field admin-message-body">
              <span className="ui-field-label">Messaggio</span>
              <textarea
                className="admin-textarea"
                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                placeholder="Scrivi il messaggio da mostrare agli utenti..."
                value={form.body}
              />
            </label>
          </div>

          <div className="admin-message-targets">
            <div className="admin-target-toggle" role="radiogroup" aria-label="Destinatari messaggio">
              <label>
                <input
                  checked={form.targetMode === "all"}
                  name="admin-message-target"
                  onChange={() => setForm((current) => ({ ...current, targetMode: "all" }))}
                  type="radio"
                />
                Tutti gli utenti
              </label>
              <label>
                <input
                  checked={form.targetMode === "users"}
                  name="admin-message-target"
                  onChange={() => setForm((current) => ({ ...current, targetMode: "users" }))}
                  type="radio"
                />
                Utenti specifici
              </label>
            </div>

            {form.targetMode === "users" ? (
              <div className="admin-recipient-list" aria-label="Seleziona destinatari">
                {users
                  .filter((adminUser) => adminUser.role === "user")
                  .map((adminUser) => (
                    <label className="admin-recipient-row" key={adminUser.id}>
                      <input
                        checked={selectedSet.has(adminUser.id)}
                        onChange={() => toggleUser(adminUser.id)}
                        type="checkbox"
                      />
                      <span>{adminUser.username}</span>
                      <small>{adminUser.email}</small>
                    </label>
                  ))}
              </div>
            ) : null}
          </div>

          <Button disabled={isSubmitting} type="submit">
            <Mail aria-hidden="true" className="admin-button-icon" />
            {isSubmitting ? "Invio..." : "Invia messaggio"}
          </Button>
        </form>
      </Card>

      <Card className="admin-card">
        <div className="admin-card-heading">
          <p className="user-page-kicker">Storico</p>
          <h2>Messaggi inviati</h2>
        </div>

        <div className="admin-message-list">
          {messages.length > 0 ? (
            messages.map((message) => (
              <article className="admin-message-row" key={message.id}>
                <div>
                  <span>{message.delivery_mode === "both" ? "Posta + popup" : message.delivery_mode === "popup" ? "Popup" : "Posta"}</span>
                  <strong>{message.title}</strong>
                  <p>{message.body}</p>
                </div>
                <div className="admin-message-meta">
                  <small>{formatDateTime(message.created_at)}</small>
                  <small>{message.recipient_count} destinatari</small>
                  <small>{message.read_count} letti</small>
                </div>
              </article>
            ))
          ) : (
            <p className="admin-muted">Nessun messaggio inviato.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function AdminDataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-data-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TournamentSidebar({
  onSelect,
  selectedTournamentId,
  tournaments,
}: {
  onSelect: (id: string) => void;
  selectedTournamentId: string;
  tournaments: ArenaTournament[];
}) {
  const groups = [
    ["Pending", tournaments.filter((tournament) => tournament.status === "PENDING")],
    ["In corso", tournaments.filter((tournament) => tournament.status === "ACTIVE" || tournament.status === "LOCKED")],
    ["Conclusi", tournaments.filter((tournament) => tournament.status === "COMPLETED")],
  ] as const;

  return (
    <aside className="admin-sidebar">
      {groups.map(([label, items]) => (
        <section className="admin-sidebar-section" key={label}>
          <h2>{label}</h2>
          {items.length > 0 ? (
            <div className="admin-tournament-list">
              {items.map((tournament) => (
                <button
                  className={cn(
                    "admin-tournament-item",
                    selectedTournamentId === tournament.id && "admin-tournament-item-active",
                  )}
                  key={tournament.id}
                  onClick={() => onSelect(tournament.id)}
                  type="button"
                >
                  <span>{tournament.name}</span>
                  <small>
                    {formatCups(tournament.prize_pool)} • Round {tournament.current_round_number}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <p>Nessun torneo.</p>
          )}
        </section>
      ))}
    </aside>
  );
}

function CreateTournamentWizard({
  onCreate,
}: {
  onCreate: (form: TournamentForm) => Promise<void>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<TournamentForm>(emptyTournamentForm);
  const sitePercentage = Math.max(0, 100 - Number(form.prizePoolPercentage || 0));

  function updateField(field: keyof TournamentForm) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target;
      setForm((current) => ({
        ...current,
        [field]: target instanceof HTMLInputElement && target.type === "checkbox"
          ? target.checked
          : target.value,
      }));
    };
  }

  return (
    <Card className="admin-card">
      <div className="admin-card-heading">
        <p className="user-page-kicker">Crea torneo</p>
        <h2>Wizard torneo</h2>
        <p>Step {step} di 2</p>
      </div>

      {step === 1 ? (
        <form
          className="admin-form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            setStep(2);
          }}
        >
          <AdminField label="Nome torneo">
            <input className="ui-input" onChange={updateField("name")} value={form.name} />
          </AdminField>
          <AdminField label="Descrizione">
            <textarea className="admin-textarea" onChange={updateField("description")} value={form.description} />
          </AdminField>
          <AdminField label="Regolamento popup">
            <textarea className="admin-textarea" onChange={updateField("rules")} value={form.rules} />
          </AdminField>
          <AdminField label="Costo iscrizione (Coppe)">
            <input className="ui-input" min="0" onChange={updateField("entryCost")} type="number" value={form.entryCost} />
          </AdminField>
          <AdminField label="Vite iniziali incluse">
            <input className="ui-input" min="1" onChange={updateField("initialLives")} type="number" value={form.initialLives} />
          </AdminField>
          <AdminField label="Costo vita extra">
            <input className="ui-input" min="0" onChange={updateField("extraLifeCost")} type="number" value={form.extraLifeCost} />
          </AdminField>
          <AdminField label="Numero massimo vite per utente">
            <input
              className="ui-input"
              disabled={form.unlimitedLives}
              min="1"
              onChange={updateField("maxLivesPerUser")}
              type="number"
              value={form.maxLivesPerUser}
            />
          </AdminField>
          <AdminField label="Numero massimo partecipanti">
            <input
              className="ui-input"
              disabled={form.unlimitedParticipants}
              min="1"
              onChange={updateField("maxParticipants")}
              type="number"
              value={form.maxParticipants}
            />
          </AdminField>
          <label className="admin-check">
            <input checked={form.unlimitedParticipants} onChange={updateField("unlimitedParticipants")} type="checkbox" />
            Partecipanti illimitati
          </label>
          <label className="admin-check">
            <input checked={form.unlimitedLives} onChange={updateField("unlimitedLives")} type="checkbox" />
            Vite illimitate
          </label>
          <AdminField label="Percentuale montepremi">
            <input
              className="ui-input"
              max="100"
              min="0"
              onChange={updateField("prizePoolPercentage")}
              type="number"
              value={form.prizePoolPercentage}
            />
          </AdminField>
          <div className="admin-split-preview">
            <strong>{Number(form.prizePoolPercentage || 0)}% montepremi</strong>
            <span>{sitePercentage}% sito</span>
          </div>
          <Button className="admin-wide-button" type="submit">
            Continua
          </Button>
        </form>
      ) : (
        <div className="admin-confirm-panel">
          <div>
            <p className="user-page-kicker">Conferma</p>
            <h3>{form.name || "Nuovo torneo"}</h3>
            <p>
              Iscrizione {formatCups(Number(form.entryCost || 0))}, {form.initialLives} vite incluse,
              {` ${form.prizePoolPercentage}%`} al montepremi e {sitePercentage}% al sito.
            </p>
          </div>
          <div className="admin-actions-row">
            <Button onClick={() => setStep(1)} type="button" variant="secondary">
              Indietro
            </Button>
            <Button onClick={() => onCreate(form)} type="button">
              Salva torneo
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function TournamentManager({
  onMutate,
  teams,
  tournament,
}: {
  onMutate: (url: string, init?: RequestInit, options?: { keepPanel?: AdminPanelKey }) => Promise<ArenaTournament | null>;
  teams: Team[];
  tournament: ArenaTournament | null;
}) {
  const [matchForm, setMatchForm] = useState({
    awayTeamId: "",
    homeTeamId: "",
    isLocked: false,
    isSelectable: true,
  });
  const currentRound = getCurrentRound(tournament);
  const [deadline, setDeadline] = useState(() => toDateTimeLocal(currentRound?.deadline_at ?? null));
  const [results, setResults] = useState<Record<string, MatchResult>>(() =>
    Object.fromEntries(
      (currentRound?.matches ?? []).map((match) => [
        match.id,
        match.result === "PENDING" ? "HOME_WIN" : match.result,
      ]),
    ),
  );

  if (!tournament) {
    return (
      <Card className="admin-card">
        <p>Nessun torneo selezionato.</p>
      </Card>
    );
  }

  const canCalculate =
    currentRound &&
    currentRound.matches.length > 0 &&
    (currentRound.status === "LOCKED" ||
      isDeadlinePassed(currentRound.deadline_at) ||
      tournament.status === "LOCKED");

  return (
    <div className="admin-stack">
      <Card className="admin-card admin-tournament-summary">
        <div>
          <p className="user-page-kicker">{tournament.status}</p>
          <h2>{tournament.name}</h2>
          <p>{tournament.description || "Nessuna descrizione."}</p>
        </div>
        <div className="admin-summary-grid">
          <AdminMetric icon={Trophy} label="Montepremi" value={formatCups(tournament.prize_pool)} />
          <AdminMetric icon={Users} label="Partecipanti" value={String(tournament.participants)} />
          <AdminMetric icon={Crown} label="Vite vive" value={String(tournament.alive_lives ?? 0)} />
          <AdminMetric icon={Shield} label="Sito" value={formatCups(tournament.site_pool)} />
        </div>
      </Card>

      {currentRound ? (
        <Card className="admin-card">
          <div className="admin-card-heading">
            <p className="user-page-kicker">Configurazione Round</p>
            <h2>Round {currentRound.round_number}</h2>
            <p>
              Stato {currentRound.status} • Deadline {formatDeadline(currentRound.deadline_at)}
            </p>
          </div>

          <form
            className="admin-inline-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onMutate(
                `/api/admin/tournaments/${tournament.id}/round`,
                {
                  body: JSON.stringify({
                    deadlineAt: fromDateTimeLocal(deadline),
                    roundId: currentRound.id,
                  }),
                  method: "PATCH",
                },
                { keepPanel: "manage" },
              );
            }}
          >
            <AdminField label="Deadline round">
              <input className="ui-input" onChange={(event) => setDeadline(event.target.value)} type="datetime-local" value={deadline} />
            </AdminField>
            <Button className="admin-inline-button" type="submit">
              Salva deadline
            </Button>
          </form>

          <form
            className="admin-form-grid admin-match-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onMutate(
                "/api/admin/matches",
                {
                  body: JSON.stringify({
                    ...matchForm,
                    roundId: currentRound.id,
                  }),
                  method: "POST",
                },
                { keepPanel: "manage" },
              ).then((updated) => {
                if (updated) {
                  setMatchForm({
                    awayTeamId: "",
                    homeTeamId: "",
                    isLocked: false,
                    isSelectable: true,
                  });
                }
              });
            }}
          >
            <AdminField label="Squadra casa">
              <TeamSelect
                onChange={(value) => setMatchForm((current) => ({ ...current, homeTeamId: value }))}
                teams={teams}
                value={matchForm.homeTeamId}
              />
            </AdminField>
            <AdminField label="Squadra trasferta">
              <TeamSelect
                onChange={(value) => setMatchForm((current) => ({ ...current, awayTeamId: value }))}
                teams={teams}
                value={matchForm.awayTeamId}
              />
            </AdminField>
            <label className="admin-check">
              <input
                checked={matchForm.isSelectable}
                onChange={(event) => setMatchForm((current) => ({ ...current, isSelectable: event.target.checked }))}
                type="checkbox"
              />
              Selezionabile
            </label>
            <label className="admin-check">
              <input
                checked={matchForm.isLocked}
                onChange={(event) => setMatchForm((current) => ({ ...current, isLocked: event.target.checked }))}
                type="checkbox"
              />
              Bloccato
            </label>
            <Button className="admin-wide-button" type="submit">
              Aggiungi incontro
            </Button>
          </form>

          <div className="admin-match-list">
            {currentRound.matches.map((match) => (
              <MatchEditor key={`${match.id}-${match.updated_at}`} match={match} onMutate={onMutate} teams={teams} />
            ))}
          </div>

          <div className="admin-actions-row">
            {tournament.status === "PENDING" ? (
              <Button onClick={() => onMutate(`/api/admin/tournaments/${tournament.id}/publish`, { method: "POST" })} type="button">
                Pubblica torneo
              </Button>
            ) : null}

            {tournament.status === "ACTIVE" && currentRound.status === "PENDING" ? (
              <Button onClick={() => onMutate(`/api/admin/tournaments/${tournament.id}/open-round`, { method: "POST" })} type="button">
                Apri Round {currentRound.round_number}
              </Button>
            ) : null}

            {tournament.status === "ACTIVE" && currentRound.status === "OPEN" ? (
              <Button onClick={() => onMutate(`/api/admin/tournaments/${tournament.id}/lock`, { method: "POST" })} type="button" variant="secondary">
                Blocca scelte ora
              </Button>
            ) : null}
          </div>

          {canCalculate ? (
            <form
              className="admin-calculate-panel"
              onSubmit={(event) => {
                event.preventDefault();
                void onMutate(
                  `/api/admin/rounds/${currentRound.id}/calculate`,
                  {
                    body: JSON.stringify({
                      results: currentRound.matches.map((match) => ({
                        matchId: match.id,
                        result: results[match.id] ?? "HOME_WIN",
                      })),
                    }),
                    method: "POST",
                  },
                  { keepPanel: "manage" },
                );
              }}
            >
              <p className="user-page-kicker">Calcolo Round</p>
              {currentRound.matches.map((match) => (
                <label className="admin-result-row" key={match.id}>
                  <span>
                    {match.home_team} vs {match.away_team}
                  </span>
                  <select
                    className="admin-select"
                    onChange={(event) =>
                      setResults((current) => ({
                        ...current,
                        [match.id]: event.target.value as MatchResult,
                      }))
                    }
                    value={results[match.id] ?? "HOME_WIN"}
                  >
                    {resultOptions.map((result) => (
                      <option key={result} value={result}>
                        {resultLabels[result]}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <Button type="submit" variant="gold">
                Calcola Round
              </Button>
            </form>
          ) : null}
        </Card>
      ) : null}

      <Card className="admin-card">
        <div className="admin-card-heading">
          <p className="user-page-kicker">Storico Round</p>
          <h2>Round configurati</h2>
        </div>
        <div className="admin-round-history">
          {tournament.rounds.map((round) => (
            <details key={round.id}>
              <summary>
                Round {round.round_number} • {round.status} • {formatDeadline(round.deadline_at)}
              </summary>
              <div className="admin-history-matches">
                {round.matches.length > 0 ? (
                  round.matches.map((match) => (
                    <span key={match.id}>
                      {match.home_team} vs {match.away_team} • {resultLabels[match.result]}
                    </span>
                  ))
                ) : (
                  <span>Nessun match configurato.</span>
                )}
              </div>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MatchEditor({
  match,
  onMutate,
  teams,
}: {
  match: ArenaMatch;
  onMutate: (url: string, init?: RequestInit, options?: { keepPanel?: AdminPanelKey }) => Promise<ArenaTournament | null>;
  teams: Team[];
}) {
  const [draft, setDraft] = useState({
    awayTeamId: match.away_team_id ?? "",
    homeTeamId: match.home_team_id ?? "",
    isLocked: match.is_locked === 1,
    isSelectable: match.is_selectable === 1,
  });

  return (
    <article className="admin-match-row">
      <div className="admin-match-fields">
        <TeamSelect
          legacyLabel={match.home_team}
          onChange={(value) => setDraft((current) => ({ ...current, homeTeamId: value }))}
          teams={teams}
          value={draft.homeTeamId}
        />
        <TeamSelect
          legacyLabel={match.away_team}
          onChange={(value) => setDraft((current) => ({ ...current, awayTeamId: value }))}
          teams={teams}
          value={draft.awayTeamId}
        />
      </div>
      <div className="admin-match-flags">
        <label>
          <input checked={draft.isSelectable} onChange={(event) => setDraft((current) => ({ ...current, isSelectable: event.target.checked }))} type="checkbox" />
          Selezionabile
        </label>
        <label>
          <input checked={draft.isLocked} onChange={(event) => setDraft((current) => ({ ...current, isLocked: event.target.checked }))} type="checkbox" />
          Bloccato
        </label>
      </div>
      <div className="admin-actions-row admin-row-actions">
        <Button
          onClick={() =>
            onMutate(
              `/api/admin/matches/${match.id}`,
              {
                body: JSON.stringify(draft),
                method: "PATCH",
              },
              { keepPanel: "manage" },
            )
          }
          type="button"
        >
          Salva
        </Button>
        <Button
          onClick={() =>
            onMutate(
              `/api/admin/matches/${match.id}`,
              {
                method: "DELETE",
              },
              { keepPanel: "manage" },
            )
          }
          type="button"
          variant="secondary"
        >
          Rimuovi
        </Button>
      </div>
    </article>
  );
}

function TeamSelect({
  legacyLabel,
  onChange,
  teams,
  value,
}: {
  legacyLabel?: string;
  onChange: (value: string) => void;
  teams: Team[];
  value: string;
}) {
  return (
    <select
      className="admin-select"
      disabled={teams.length === 0}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      <option value="">
        {legacyLabel ? `Seleziona squadra per ${legacyLabel}` : "Seleziona squadra"}
      </option>
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name}
        </option>
      ))}
    </select>
  );
}

function TeamsPanel({
  onMutate,
  teams,
}: {
  onMutate: (url: string, init?: RequestInit) => Promise<Team | null>;
  teams: Team[];
}) {
  const [draft, setDraft] = useState({
    logoUrl: "",
    name: "",
  });
  const [localMessage, setLocalMessage] = useState("");

  function handleLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLocalMessage("Seleziona un file immagine.");
      return;
    }

    if (file.size > 160_000) {
      setLocalMessage("Logo troppo pesante. Usa un file sotto 160 KB oppure un URL immagine.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({
        ...current,
        logoUrl: typeof reader.result === "string" ? reader.result : "",
      }));
      setLocalMessage("");
    };
    reader.readAsDataURL(file);
  }

  async function createTeamFromDraft() {
    const team = await onMutate("/api/admin/teams", {
      body: JSON.stringify({
        logoUrl: draft.logoUrl,
        name: draft.name,
      }),
      method: "POST",
    });

    if (team) {
      setDraft({
        logoUrl: "",
        name: "",
      });
      setLocalMessage("");
    }
  }

  return (
    <div className="admin-stack">
      <Card className="admin-card">
        <div className="admin-card-heading">
          <p className="user-page-kicker">Catalogo squadre</p>
          <h2>Aggiungi squadra</h2>
          <p>Le squadre salvate qui saranno disponibili nella configurazione dei match.</p>
        </div>

        {localMessage ? (
          <div className="auth-form-message auth-form-message-error" role="alert">
            {localMessage}
          </div>
        ) : null}

        <form
          className="admin-form-grid admin-team-form"
          onSubmit={(event) => {
            event.preventDefault();
            void createTeamFromDraft();
          }}
        >
          <AdminField label="Nome squadra">
            <input
              className="ui-input"
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Juventus"
              value={draft.name}
            />
          </AdminField>
          <AdminField label="Logo squadra">
            <input
              className="ui-input"
              onChange={(event) => setDraft((current) => ({ ...current, logoUrl: event.target.value }))}
              placeholder="URL immagine oppure carica un file"
              value={draft.logoUrl.startsWith("data:image/") ? "Logo caricato da file" : draft.logoUrl}
            />
          </AdminField>
          <AdminField label="Carica scudetto">
            <input accept="image/*" className="ui-input" onChange={handleLogoFile} type="file" />
          </AdminField>
          <div className="admin-team-preview">
            <TeamLogo logoUrl={draft.logoUrl} name={draft.name || "Team"} />
            <div>
              <span>Anteprima</span>
              <strong>{draft.name || "Nome squadra"}</strong>
            </div>
          </div>
          <Button className="admin-wide-button" type="submit">
            Aggiungi squadra
          </Button>
        </form>
      </Card>

      <Card className="admin-card">
        <div className="admin-card-heading">
          <p className="user-page-kicker">Squadre salvate</p>
          <h2>Catalogo</h2>
        </div>
        <div className="admin-team-list">
          {teams.length > 0 ? (
            teams.map((team) => (
              <TeamEditor key={team.id} onMutate={onMutate} team={team} />
            ))
          ) : (
            <p className="admin-muted">Nessuna squadra salvata.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function TeamEditor({
  onMutate,
  team,
}: {
  onMutate: (url: string, init?: RequestInit) => Promise<Team | null>;
  team: Team;
}) {
  const [draft, setDraft] = useState({
    logoUrl: team.logo_url ?? "",
    name: team.name,
  });
  const [localMessage, setLocalMessage] = useState("");

  function handleLogoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLocalMessage("Seleziona un file immagine.");
      return;
    }

    if (file.size > 160_000) {
      setLocalMessage("Logo troppo pesante. Usa un file sotto 160 KB oppure un URL immagine.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({
        ...current,
        logoUrl: typeof reader.result === "string" ? reader.result : "",
      }));
      setLocalMessage("");
    };
    reader.readAsDataURL(file);
  }

  return (
    <article className="admin-team-row">
      <div className="admin-team-identity">
        <TeamLogo logoUrl={team.logo_url} name={team.name} />
        <div>
          <strong>{team.name}</strong>
          <span>ID interno: {team.id}</span>
        </div>
      </div>
      <div className="admin-team-edit-grid">
        <input
          className="ui-input"
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          value={draft.name}
        />
        <input
          className="ui-input"
          onChange={(event) => setDraft((current) => ({ ...current, logoUrl: event.target.value }))}
          placeholder="Logo URL"
          value={draft.logoUrl.startsWith("data:image/") ? "Logo caricato da file" : draft.logoUrl}
        />
        <input accept="image/*" className="ui-input" onChange={handleLogoFile} type="file" />
      </div>
      {localMessage ? (
        <div className="auth-form-message auth-form-message-error" role="alert">
          {localMessage}
        </div>
      ) : null}
      <div className="admin-actions-row admin-row-actions">
        <Button
          onClick={() =>
            onMutate(`/api/admin/teams/${team.id}`, {
              body: JSON.stringify(draft),
              method: "PATCH",
            })
          }
          type="button"
        >
          Salva
        </Button>
        <Button
          onClick={() =>
            onMutate(`/api/admin/teams/${team.id}`, {
              method: "DELETE",
            })
          }
          type="button"
          variant="secondary"
        >
          Rimuovi
        </Button>
      </div>
    </article>
  );
}

function TeamLogo({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}) {
  return logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={`Logo ${name}`} className="admin-team-logo" src={logoUrl} />
  ) : (
    <span className="admin-team-logo admin-team-logo-placeholder">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function ParticipantsPanel({
  onSearch,
  participants,
  query,
  tournament,
}: {
  onSearch: (query: string) => void;
  participants: Participant[];
  query: string;
  tournament: ArenaTournament | null;
}) {
  return (
    <Card className="admin-card">
      <div className="admin-card-heading">
        <p className="user-page-kicker">Partecipanti</p>
        <h2>{tournament?.name ?? "Nessun torneo"}</h2>
      </div>
      <SearchBox onSearch={onSearch} placeholder="Cerca username o email" query={query} />
      <div className="admin-participant-list">
        {participants.length > 0 ? (
          participants.map((participant) => (
            <details className="admin-participant-card" key={participant.id}>
              <summary>
                <span>{participant.username}</span>
                <strong>
                  {participant.total_lives} vite • {participant.alive_lives} vive •{" "}
                  {participant.eliminated_lives} eliminate
                </strong>
              </summary>
              <div className="admin-participant-detail">
                <p>{participant.email}</p>
                <p>Codice utente: {participant.user_code}</p>
                <div className="admin-life-history">
                  {participant.lives.map((life) => (
                    <article key={life.id}>
                      <strong>
                        Vita {life.life_number} • {life.status}
                      </strong>
                      {life.selections.length > 0 ? (
                        life.selections.map((selection) => (
                          <span key={`${life.id}-${selection.round_id}`}>
                            {selection.selected_team} • {selection.status}
                          </span>
                        ))
                      ) : (
                        <span>Nessuna scelta registrata.</span>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </details>
          ))
        ) : (
          <p className="admin-muted">Nessun partecipante trovato.</p>
        )}
      </div>
    </Card>
  );
}

function EventsPanel({
  events,
  onSearch,
  query,
}: {
  events: EventLog[];
  onSearch: (query: string) => void;
  query: string;
}) {
  return (
    <Card className="admin-card">
      <div className="admin-card-heading">
        <p className="user-page-kicker">Registro eventi</p>
        <h2>Eventi Arena</h2>
      </div>
      <SearchBox onSearch={onSearch} placeholder="Cerca torneo, utente, email o evento" query={query} />
      <div className="admin-event-list">
        {events.length > 0 ? (
          events.map((event) => (
            <article className="admin-event-row" key={event.id}>
              <span>{event.event_type}</span>
              <strong>{event.message}</strong>
              <p>
                {event.tournament_name ?? "Sistema"} • {event.username ?? event.email ?? "Admin"} •{" "}
                {formatDeadline(event.created_at)}
              </p>
            </article>
          ))
        ) : (
          <p className="admin-muted">Nessun evento trovato.</p>
        )}
      </div>
    </Card>
  );
}

function SearchBox({
  onSearch,
  placeholder,
  query,
}: {
  onSearch: (query: string) => void;
  placeholder: string;
  query: string;
}) {
  const [value, setValue] = useState(query);

  return (
    <form
      className="admin-search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(value);
      }}
    >
      <Search aria-hidden="true" className="admin-search-icon" />
      <input className="ui-input" onChange={(event) => setValue(event.target.value)} placeholder={placeholder} value={value} />
      <Button className="admin-search-button" type="submit">
        Cerca
      </Button>
    </form>
  );
}

function AdminField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="ui-field">
      <span className="ui-field-label">{label}</span>
      {children}
    </label>
  );
}

function AdminMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="admin-metric">
      <Icon aria-hidden="true" className="admin-metric-icon" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

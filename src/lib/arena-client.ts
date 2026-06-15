export type MatchResult =
  | "PENDING"
  | "HOME_WIN"
  | "DRAW"
  | "AWAY_WIN"
  | "POSTPONED"
  | "CANCELLED";

export type ArenaMatch = {
  away_team_id: string | null;
  away_team_logo_url: string | null;
  away_team: string;
  home_team_id: string | null;
  home_team_logo_url: string | null;
  home_team: string;
  id: string;
  is_locked: number;
  is_selectable: number;
  result: MatchResult;
  round_id: string;
  tournament_id: string;
  updated_at: string;
};

export type ArenaRound = {
  calculated_at: string | null;
  deadline_at: string | null;
  id: string;
  matches: ArenaMatch[];
  round_number: number;
  status: "PENDING" | "OPEN" | "LOCKED" | "CALCULATED";
  tournament_id: string;
  updated_at: string;
};

export type ArenaTournament = {
  alive_lives?: number;
  completed_at: string | null;
  current_round?: ArenaRound | null;
  current_round_number: number;
  description: string | null;
  entry_cost: number;
  extra_life_cost: number;
  id: string;
  initial_lives: number;
  is_joined?: boolean;
  max_lives_per_user: number | null;
  max_participants: number | null;
  name: string;
  participants: number;
  prize_pool: number;
  prize_pool_percentage: number;
  published_at: string | null;
  rounds: ArenaRound[];
  rules: string | null;
  site_percentage: number;
  site_pool: number;
  status: "PENDING" | "ACTIVE" | "LOCKED" | "COMPLETED" | "CANCELLED";
  unlimited_lives: number;
  unlimited_participants: number;
};

export type ArenaRegistration = {
  entry_cost: number;
  id: string;
  initial_lives: number;
  joined_at: string;
  purchased_lives: number;
  status: "ACTIVE" | "LEFT" | "ELIMINATED" | "WINNER";
};

export type ArenaSelection = {
  cycle_number: number;
  id: string;
  life_id: string;
  match_id: string;
  round_id: string;
  selected_team_id: string | null;
  selected_side: "HOME" | "AWAY";
  selected_team: string;
  status: "PENDING" | "SURVIVED" | "ELIMINATED" | "VOID";
};

export type ArenaLife = {
  current_cycle: number;
  id: string;
  life_number: number;
  selections: ArenaSelection[];
  status: "ALIVE" | "ELIMINATED" | "WINNER";
};

export type PublicChoice = {
  email: string;
  life_number: number;
  selected_team_id: string | null;
  selected_team: string;
  status: string;
  username: string;
};

export type ArenaTournamentDetails = ArenaTournament & {
  public_choices: PublicChoice[];
  registration: ArenaRegistration | null;
  user_lives: ArenaLife[];
};

export function formatCups(value: number) {
  return `${value.toLocaleString("it-IT")} Coppe`;
}

export function formatDeadline(value: string | null) {
  if (!value) {
    return "Deadline da impostare";
  }

  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function isDeadlinePassed(value: string | null) {
  return !!value && Date.parse(value) <= Date.now();
}

export function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

export function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null;
}

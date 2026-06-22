export type AccountUser = {
  blocked_at: string | null;
  blocked_reason: string | null;
  cup_balance: number;
  email: string;
  id: string;
  unread_message_count?: number;
  phone: string;
  role: string;
  status: "active" | "blocked";
  user_code: string;
  username: string;
};

export type UserAreaPageKey =
  | "admin"
  | "arena"
  | "arene"
  | "classifiche"
  | "dashboard"
  | "impostazioni"
  | "movimenti"
  | "posta"
  | "premi"
  | "profilo";

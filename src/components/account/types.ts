export type AccountUser = {
  cup_balance: number;
  email: string;
  id: string;
  phone: string;
  role: string;
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
  | "premi"
  | "profilo";

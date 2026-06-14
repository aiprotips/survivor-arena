export type AccountUser = {
  email: string;
  id: string;
  phone: string;
  role: string;
  user_code: string;
  username: string;
};

export type UserAreaPageKey =
  | "arene"
  | "classifiche"
  | "dashboard"
  | "impostazioni"
  | "movimenti"
  | "premi"
  | "profilo";

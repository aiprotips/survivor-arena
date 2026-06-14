export type RegisterFormValues = {
  confirmPassword: string;
  email: string;
  password: string;
  phone: string;
  username: string;
};

export type LoginFormValues = {
  identifier: string;
  password: string;
};

export type RegisterField = keyof RegisterFormValues;
export type LoginField = keyof LoginFormValues;

export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export type PasswordRequirement = {
  id: "length" | "uppercase" | "lowercase" | "number" | "special";
  label: string;
  isMet: boolean;
};

export const passwordRequirementLabels: Record<PasswordRequirement["id"], string> = {
  length: "almeno 8 caratteri",
  lowercase: "una lettera minuscola",
  number: "un numero",
  special: "un carattere speciale",
  uppercase: "una lettera maiuscola",
};

export function normalizeUsername(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizePhone(value: unknown) {
  const rawPhone = String(value ?? "").trim();

  return rawPhone
    .replace(/[\s().-]/g, "")
    .replace(/^00/, "+");
}

export function validateUsername(username: string) {
  if (!username) {
    return "Username obbligatorio.";
  }

  if (username.length < 3) {
    return "Username troppo corto. Minimo 3 caratteri.";
  }

  if (username.length > 20) {
    return "Username troppo lungo. Massimo 20 caratteri.";
  }

  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    return "Username non valido. Usa solo lettere, numeri e underscore.";
  }

  return "";
}

export function validateEmail(email: string) {
  if (!email) {
    return "Email obbligatoria.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Inserisci un indirizzo email valido.";
  }

  return "";
}

export function validatePhone(phone: string) {
  if (!phone) {
    return "Numero di telefono obbligatorio.";
  }

  if (!/^\+?[0-9]{8,15}$/.test(phone)) {
    return "Inserisci un numero di telefono valido.";
  }

  return "";
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "length",
      isMet: password.length >= 8,
      label: passwordRequirementLabels.length,
    },
    {
      id: "uppercase",
      isMet: /[A-Z]/.test(password),
      label: passwordRequirementLabels.uppercase,
    },
    {
      id: "lowercase",
      isMet: /[a-z]/.test(password),
      label: passwordRequirementLabels.lowercase,
    },
    {
      id: "number",
      isMet: /[0-9]/.test(password),
      label: passwordRequirementLabels.number,
    },
    {
      id: "special",
      isMet: /[^A-Za-z0-9]/.test(password),
      label: passwordRequirementLabels.special,
    },
  ];
}

export function getPasswordMissingRequirements(password: string) {
  return getPasswordRequirements(password)
    .filter((requirement) => !requirement.isMet)
    .map((requirement) => requirement.label);
}

export function validatePassword(password: string) {
  if (!password) {
    return "Password obbligatoria.";
  }

  const missingRequirements = getPasswordMissingRequirements(password);

  if (missingRequirements.length === 0) {
    return "";
  }

  return `La password deve contenere almeno: ${missingRequirements.join(", ")}.`;
}

export function validateConfirmPassword(password: string, confirmPassword: string) {
  if (!confirmPassword) {
    return "Conferma password obbligatoria.";
  }

  if (password !== confirmPassword) {
    return "Le password non coincidono.";
  }

  return "";
}

export function normalizeRegistrationValues(input: Partial<RegisterFormValues>) {
  return {
    confirmPassword: String(input.confirmPassword ?? ""),
    email: normalizeEmail(input.email),
    password: String(input.password ?? ""),
    phone: normalizePhone(input.phone),
    username: normalizeUsername(input.username),
  };
}

export function validateRegistrationValues(input: Partial<RegisterFormValues>) {
  const values = normalizeRegistrationValues(input);
  const errors: FieldErrors<RegisterField> = {};

  const usernameError = validateUsername(values.username);
  const emailError = validateEmail(values.email);
  const phoneError = validatePhone(values.phone);
  const passwordError = validatePassword(values.password);
  const confirmPasswordError = validateConfirmPassword(
    values.password,
    values.confirmPassword,
  );

  if (usernameError) errors.username = usernameError;
  if (emailError) errors.email = emailError;
  if (phoneError) errors.phone = phoneError;
  if (passwordError) errors.password = passwordError;
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    values,
  };
}

export function validateRegistrationDataStep(input: Partial<RegisterFormValues>) {
  const values = normalizeRegistrationValues(input);
  const errors: FieldErrors<RegisterField> = {};

  const usernameError = validateUsername(values.username);
  const emailError = validateEmail(values.email);
  const phoneError = validatePhone(values.phone);

  if (usernameError) errors.username = usernameError;
  if (emailError) errors.email = emailError;
  if (phoneError) errors.phone = phoneError;

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    values,
  };
}

export function normalizeLoginValues(input: Partial<LoginFormValues>) {
  return {
    identifier: String(input.identifier ?? "").trim(),
    password: String(input.password ?? ""),
  };
}

export function validateLoginValues(input: Partial<LoginFormValues>) {
  const values = normalizeLoginValues(input);
  const errors: FieldErrors<LoginField> = {};

  if (!values.identifier) {
    errors.identifier = "Email o username obbligatorio.";
  }

  if (!values.password) {
    errors.password = "Password obbligatoria.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    values,
  };
}

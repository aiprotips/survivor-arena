"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import {
  getPasswordRequirements,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validatePhone,
  validateRegistrationDataStep,
  validateRegistrationValues,
  validateUsername,
  type FieldErrors,
  type RegisterField,
  type RegisterFormValues,
} from "@/lib/auth-validation";
import { cn } from "@/lib/cn";

type RegisterStep = 1 | 2;

type ProgressStep = {
  id: RegisterStep;
  label: string;
  title: string;
};

type RegisterResponse =
  | {
      ok: true;
      user: {
        username: string;
      };
    }
  | {
      details?: string[];
      field?: RegisterField;
      message: string;
      ok: false;
    };

const progressSteps: ProgressStep[] = [
  {
    id: 1,
    label: "Step 1",
    title: "I tuoi dati",
  },
  {
    id: 2,
    label: "Step 2",
    title: "Sicurezza",
  },
];

const initialValues: RegisterFormValues = {
  confirmPassword: "",
  email: "",
  password: "",
  phone: "",
  username: "",
};

export function RegisterView() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<RegisterStep>(1);
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<RegisterField>>({});
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const passwordRequirements = useMemo(
    () => getPasswordRequirements(values.password),
    [values.password],
  );

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  const updateValue =
    (field: RegisterField) => (event: ChangeEvent<HTMLInputElement>) => {
      const nextValues = {
        ...values,
        [field]: event.target.value,
      };

      setValues(nextValues);
      setFormMessage("");
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: getFieldError(field, nextValues),
      }));
    };

  const goToSecurityStep = () => {
    const validation = validateRegistrationDataStep(values);

    setErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    setValues((currentValues) => ({
      ...currentValues,
      email: validation.values.email,
      phone: validation.values.phone,
      username: validation.values.username,
    }));
    setCurrentStep(2);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage("");

    if (currentStep === 1) {
      goToSecurityStep();
      return;
    }

    const validation = validateRegistrationValues(values);
    setErrors(validation.errors);

    if (!validation.isValid) {
      if (validation.errors.username || validation.errors.email || validation.errors.phone) {
        setCurrentStep(1);
      }

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        body: JSON.stringify(validation.values),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as RegisterResponse;

      if (!data.ok) {
        if (data.field) {
          setErrors((currentErrors) => ({
            ...currentErrors,
            [data.field as RegisterField]: data.message,
          }));

          if (["email", "phone", "username"].includes(data.field)) {
            setCurrentStep(1);
          }
        }

        setFormMessage(data.message);
        return;
      }

      setIsRegistrationComplete(true);
      setValues(initialValues);
      setErrors({});
    } catch {
      setFormMessage("Registrazione non riuscita. Controlla la connessione e riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    router.push("/login");
  };

  return (
    <main className="auth-page">
      <header className="auth-header">
        <BrandLogo />
        <h1 className="auth-header-title">Registrati</h1>
        <button
          aria-label="Torna alla pagina precedente"
          className="auth-close-button"
          onClick={handleClose}
          type="button"
        >
          <svg aria-hidden="true" className="auth-icon" viewBox="0 0 24 24">
            <path d="m6 6 12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </button>
      </header>

      <section className="auth-shell" aria-labelledby="register-title">
        <Card className="auth-card register-card">
          <div className="auth-card-heading">
            <p className="auth-kicker">Crea il tuo account</p>
            <h2
              aria-label="Unisciti all'Arena e inizia la sfida"
              className="auth-title register-title"
              id="register-title"
            >
              <span className="register-title-main">Unisciti all&apos;Arena</span>
              <span className="register-title-accent">e inizia la sfida</span>
            </h2>
            <PremiumDivider />
          </div>

          <div className="auth-progress" aria-label="Avanzamento registrazione">
            {progressSteps.map((step) => {
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;

              return (
                <div
                  className={cn(
                    "auth-progress-step",
                    isActive && "auth-progress-step-active",
                    isComplete && "auth-progress-step-complete",
                  )}
                  key={step.id}
                >
                  <span className="auth-progress-number">{step.id}</span>
                  <span className="auth-progress-copy">
                    <span className="auth-progress-label">{step.label}</span>
                    <span className="auth-progress-title">{step.title}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <form className="auth-form register-form" onSubmit={handleSubmit}>
            {formMessage ? (
              <p className="auth-form-message auth-form-message-error" role="alert">
                {formMessage}
              </p>
            ) : null}

            {currentStep === 1 ? (
              <RegisterDataStep
                errors={errors}
                onChange={updateValue}
                values={values}
              />
            ) : (
              <RegisterSecurityStep
                errors={errors}
                isConfirmPasswordVisible={isConfirmPasswordVisible}
                isPasswordVisible={isPasswordVisible}
                isSubmitting={isSubmitting}
                onBack={() => {
                  setFormMessage("");
                  setCurrentStep(1);
                }}
                onChange={updateValue}
                onToggleConfirmPassword={() =>
                  setIsConfirmPasswordVisible((current) => !current)
                }
                onTogglePassword={() => setIsPasswordVisible((current) => !current)}
                passwordRequirements={passwordRequirements}
                values={values}
              />
            )}

            {currentStep === 1 ? (
              <Button className="auth-submit-button register-submit-button" type="submit">
                CONTINUA
              </Button>
            ) : null}

            <div className="auth-login-panel">
              <p>Hai gi&agrave; un account?</p>
              <ButtonLink className="auth-inline-link" href="/login" variant="secondary">
                Accedi
              </ButtonLink>
            </div>
          </form>
        </Card>

        <div className="auth-safe-note">
          <svg aria-hidden="true" className="auth-safe-icon" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-5" />
          </svg>
          <p>I tuoi dati sono al sicuro con noi.</p>
        </div>
      </section>

      {isRegistrationComplete ? (
        <div className="auth-modal-backdrop" role="presentation">
          <Card
            aria-labelledby="register-success-title"
            aria-modal="true"
            className="auth-modal-card"
            role="dialog"
          >
            <div className="auth-success-emblem" aria-hidden="true">
              <svg className="auth-icon" viewBox="0 0 24 24">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div className="auth-modal-copy">
              <p className="auth-kicker">Survivor Arena</p>
              <h2 className="auth-modal-title" id="register-success-title">
                Registrazione completata
              </h2>
              <p className="auth-modal-text">
                Il tuo account &egrave; stato creato con successo.
              </p>
            </div>
            <Button className="auth-submit-button" onClick={handleGoToLogin} type="button">
              Vai al login
            </Button>
          </Card>
        </div>
      ) : null}
    </main>
  );
}

type RegisterStepProps = {
  errors: FieldErrors<RegisterField>;
  onChange: (field: RegisterField) => (event: ChangeEvent<HTMLInputElement>) => void;
  values: RegisterFormValues;
};

function RegisterDataStep({ errors, onChange, values }: RegisterStepProps) {
  return (
    <div className="auth-step-panel">
      <div className="ui-field">
        <label className="ui-field-label" htmlFor="register-username">
          Username
        </label>
        <span className="ui-input-wrap">
          <span className="ui-input-leading-icon" aria-hidden="true">
            <svg className="auth-icon" viewBox="0 0 24 24">
              <path d="M20 21a8 8 0 0 0-16 0" />
              <path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
            </svg>
          </span>
          <input
            autoComplete="username"
            className={getInputClassName(errors.username, values.username)}
            id="register-username"
            name="username"
            onChange={onChange("username")}
            placeholder="Scegli il tuo username"
            type="text"
            value={values.username}
          />
        </span>
        <FieldHelp error={errors.username} text="3-20 caratteri, senza spazi" />
      </div>

      <div className="ui-field">
        <label className="ui-field-label" htmlFor="register-email">
          Email
        </label>
        <span className="ui-input-wrap">
          <span className="ui-input-leading-icon" aria-hidden="true">
            <svg className="auth-icon" viewBox="0 0 24 24">
              <rect height="16" rx="2" width="20" x="2" y="4" />
              <path d="m22 7-10 6L2 7" />
            </svg>
          </span>
          <input
            autoComplete="email"
            className={getInputClassName(errors.email, values.email)}
            id="register-email"
            name="email"
            onChange={onChange("email")}
            placeholder="Inserisci la tua email"
            type="email"
            value={values.email}
          />
        </span>
        <FieldHelp error={errors.email} />
      </div>

      <div className="ui-field">
        <label className="ui-field-label" htmlFor="register-phone">
          Numero di telefono
        </label>
        <span className="ui-input-wrap">
          <span className="ui-input-leading-icon" aria-hidden="true">
            <svg className="auth-icon" viewBox="0 0 24 24">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.4 2.1L8.1 9.7a16 16 0 0 0 6.2 6.2l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2Z" />
            </svg>
          </span>
          <input
            autoComplete="tel"
            className={getInputClassName(errors.phone, values.phone)}
            id="register-phone"
            name="phone"
            onChange={onChange("phone")}
            placeholder="Inserisci il numero"
            type="tel"
            value={values.phone}
          />
        </span>
        <FieldHelp error={errors.phone} text="Ti invieremo un codice di verifica" />
      </div>
    </div>
  );
}

type RegisterSecurityStepProps = RegisterStepProps & {
  isConfirmPasswordVisible: boolean;
  isPasswordVisible: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onToggleConfirmPassword: () => void;
  onTogglePassword: () => void;
  passwordRequirements: ReturnType<typeof getPasswordRequirements>;
};

function RegisterSecurityStep({
  errors,
  isConfirmPasswordVisible,
  isPasswordVisible,
  isSubmitting,
  onBack,
  onChange,
  onToggleConfirmPassword,
  onTogglePassword,
  passwordRequirements,
  values,
}: RegisterSecurityStepProps) {
  return (
    <div className="auth-step-panel">
      <div className="ui-field">
        <label className="ui-field-label" htmlFor="register-password">
          Password
        </label>
        <PasswordInput
          autoComplete="new-password"
          error={errors.password}
          id="register-password"
          isVisible={isPasswordVisible}
          name="password"
          onChange={onChange("password")}
          onToggle={onTogglePassword}
          placeholder="Crea una password"
          value={values.password}
        />
        <PasswordRequirements requirements={passwordRequirements} />
        <FieldHelp error={errors.password} />
      </div>

      <div className="ui-field">
        <label className="ui-field-label" htmlFor="register-confirm-password">
          Conferma Password
        </label>
        <PasswordInput
          autoComplete="new-password"
          error={errors.confirmPassword}
          id="register-confirm-password"
          isVisible={isConfirmPasswordVisible}
          name="confirmPassword"
          onChange={onChange("confirmPassword")}
          onToggle={onToggleConfirmPassword}
          placeholder="Ripeti la password"
          value={values.confirmPassword}
        />
        <FieldHelp error={errors.confirmPassword} />
      </div>

      <Button
        className="auth-submit-button register-submit-button"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "CREAZIONE..." : "CREA ACCOUNT"}
      </Button>

      <button
        aria-label="Torna indietro"
        className="auth-back-button"
        disabled={isSubmitting}
        onClick={onBack}
        type="button"
      >
        <span aria-hidden="true">&larr;</span>
        Torna indietro
      </button>
    </div>
  );
}

type PasswordInputProps = {
  autoComplete: string;
  error?: string;
  id: string;
  isVisible: boolean;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
  placeholder: string;
  value: string;
};

function PasswordInput({
  autoComplete,
  error,
  id,
  isVisible,
  name,
  onChange,
  onToggle,
  placeholder,
  value,
}: PasswordInputProps) {
  return (
    <span className="ui-input-wrap">
      <span className="ui-input-leading-icon" aria-hidden="true">
        <svg className="auth-icon" viewBox="0 0 24 24">
          <rect height="11" rx="2" width="16" x="4" y="11" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </span>
      <input
        autoComplete={autoComplete}
        className={getInputClassName(error, value, "ui-input-with-action")}
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        type={isVisible ? "text" : "password"}
        value={value}
      />
      <button
        aria-label={isVisible ? "Nascondi password" : "Mostra password"}
        className="ui-input-action"
        onClick={onToggle}
        type="button"
      >
        <svg aria-hidden="true" className="auth-icon" viewBox="0 0 24 24">
          {isVisible ? (
            <>
              <path d="m3 3 18 18" />
              <path d="M10.7 10.7a2 2 0 0 0 2.6 2.6" />
              <path d="M9.5 5.5A9.8 9.8 0 0 1 12 5c5 0 8.6 4.2 10 7a14.2 14.2 0 0 1-3.1 4.2" />
              <path d="M6.4 6.8A14.1 14.1 0 0 0 2 12c1.4 2.8 5 7 10 7 1.5 0 2.9-.4 4.1-1" />
            </>
          ) : (
            <>
              <path d="M2 12c1.4-2.8 5-7 10-7s8.6 4.2 10 7c-1.4 2.8-5 7-10 7S3.4 14.8 2 12Z" />
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </>
          )}
        </svg>
      </button>
    </span>
  );
}

function PasswordRequirements({
  requirements,
}: {
  requirements: ReturnType<typeof getPasswordRequirements>;
}) {
  return (
    <ul className="auth-password-requirements" aria-label="Requisiti password">
      {requirements.map((requirement) => (
        <li
          className={cn(
            "auth-password-requirement",
            requirement.isMet && "auth-password-requirement-met",
          )}
          key={requirement.id}
        >
          <span aria-hidden="true">{requirement.isMet ? "✓" : "•"}</span>
          {requirement.label}
        </li>
      ))}
    </ul>
  );
}

function FieldHelp({ error, text }: { error?: string; text?: string }) {
  if (error) {
    return (
      <p className="ui-field-help ui-field-error" role="alert">
        {error}
      </p>
    );
  }

  return text ? <p className="ui-field-help">{text}</p> : null;
}

function getFieldError(field: RegisterField, values: RegisterFormValues) {
  if (field === "username") return validateUsername(values.username);
  if (field === "email") return validateEmail(values.email);
  if (field === "phone") return validatePhone(values.phone);
  if (field === "password") return validatePassword(values.password);

  return validateConfirmPassword(values.password, values.confirmPassword);
}

function getInputClassName(error: string | undefined, value: string, extraClassName?: string) {
  return cn(
    "ui-input ui-input-with-icon",
    extraClassName,
    error && "ui-input-error",
    value && !error && "ui-input-valid",
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import {
  validateLoginValues,
  type FieldErrors,
  type LoginField,
  type LoginFormValues,
} from "@/lib/auth-validation";
import { cn } from "@/lib/cn";

type LoginResponse =
  | {
      ok: true;
      redirectTo: string;
      user: {
        user_code: string;
        username: string;
      };
    }
  | {
      field?: LoginField;
      message: string;
      ok: false;
    };

const initialValues: LoginFormValues = {
  identifier: "",
  password: "",
};

export function LoginView() {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<LoginField>>({});
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const updateValue =
    (field: LoginField) => (event: ChangeEvent<HTMLInputElement>) => {
      const nextValues = {
        ...values,
        [field]: event.target.value,
      };

      setValues(nextValues);
      setFormMessage("");
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: nextValues[field] ? "" : currentErrors[field],
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage("");

    const validation = validateLoginValues(values);
    setErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        body: JSON.stringify(validation.values),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as LoginResponse;

      if (!data.ok) {
        if (data.field) {
          setErrors((currentErrors) => ({
            ...currentErrors,
            [data.field as LoginField]: data.message,
          }));
        }

        setFormMessage(data.message);
        return;
      }

      router.push(data.redirectTo);
    } catch {
      setFormMessage("Accesso non riuscito. Controlla la connessione e riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <header className="auth-header">
        <BrandLogo />
        <h1 className="auth-header-title">Accedi</h1>
        <Link aria-label="Torna alla homepage" className="auth-close-button" href="/">
          <svg aria-hidden="true" className="auth-icon" viewBox="0 0 24 24">
            <path d="m6 6 12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </Link>
      </header>

      <section className="auth-shell" aria-labelledby="login-title">
        <Card className="auth-card">
          <div className="auth-card-heading">
            <p className="auth-kicker">Benvenuto in</p>
            <h2 className="auth-title" id="login-title">
              Survivor <span className="auth-title-accent">Arena</span>
            </h2>
            <p className="auth-subtitle">Accedi al tuo conto per continuare</p>
            <PremiumDivider />
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {formMessage ? (
              <p className="auth-form-message auth-form-message-error" role="alert">
                {formMessage}
              </p>
            ) : null}

            <div className="ui-field">
              <label className="ui-field-label" htmlFor="login-identifier">
                Email / Username
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
                  className={getInputClassName(errors.identifier, values.identifier)}
                  id="login-identifier"
                  name="login"
                  onChange={updateValue("identifier")}
                  placeholder="Inserisci email o username"
                  type="text"
                  value={values.identifier}
                />
              </span>
              <FieldError error={errors.identifier} />
            </div>

            <div className="ui-field">
              <label className="ui-field-label" htmlFor="login-password">
                Password
              </label>
              <span className="ui-input-wrap">
                <span className="ui-input-leading-icon" aria-hidden="true">
                  <svg className="auth-icon" viewBox="0 0 24 24">
                    <rect height="11" rx="2" width="16" x="4" y="11" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </span>
                <input
                  autoComplete="current-password"
                  className={getInputClassName(
                    errors.password,
                    values.password,
                    "ui-input-with-action",
                  )}
                  id="login-password"
                  name="password"
                  onChange={updateValue("password")}
                  placeholder="Inserisci la password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={values.password}
                />
                <button
                  aria-label={isPasswordVisible ? "Nascondi password" : "Mostra password"}
                  className="ui-input-action"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  type="button"
                >
                  <svg aria-hidden="true" className="auth-icon" viewBox="0 0 24 24">
                    {isPasswordVisible ? (
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
              <FieldError error={errors.password} />
            </div>

            <button className="auth-forgot-link" type="button">
              Hai dimenticato la password?
            </button>

            <Button className="auth-submit-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "ACCESSO..." : "ACCEDI"}
            </Button>

            <div className="auth-separator">
              <span aria-hidden="true" />
              <span>Oppure</span>
              <span aria-hidden="true" />
            </div>

            <div className="auth-register-panel">
              <p>Non hai un account?</p>
              <ButtonLink className="auth-register-button" href="/register" variant="secondary">
                REGISTRATI
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
    </main>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? (
    <p className="ui-field-help ui-field-error" role="alert">
      {error}
    </p>
  ) : null;
}

function getInputClassName(error: string | undefined, value: string, extraClassName?: string) {
  return cn(
    "ui-input ui-input-with-icon",
    extraClassName,
    error && "ui-input-error",
    value && !error && "ui-input-valid",
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import { TelegramIcon } from "@/components/ui/TelegramIcon";
import {
  getPasswordRequirements,
  validateConfirmPassword,
  validatePassword,
} from "@/lib/auth-validation";
import { cn } from "@/lib/cn";

type ResetStep = "request" | "confirm" | "done";

type ApiResponse =
  | {
      message?: string;
      ok: true;
      requiresTelegramStart?: boolean;
      telegramAppStartUrl?: string;
      telegramBotUsername?: string;
      telegramStartUrl?: string;
    }
  | {
      field?: string;
      message: string;
      ok: false;
    };

async function readApiResponse(response: Response): Promise<ApiResponse> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<ApiResponse>;
  }

  const text = (await response.text()).trim();

  return {
    message: response.status >= 500
      ? "Servizio temporaneamente non disponibile. Riprova tra poco."
      : text || "Richiesta non riuscita. Controlla i dati e riprova.",
    ok: false,
  };
}

export function ForgotPasswordView() {
  const router = useRouter();
  const [step, setStep] = useState<ResetStep>("request");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [telegramAppStartUrl, setTelegramAppStartUrl] = useState("");
  const [telegramStartUrl, setTelegramStartUrl] = useState("");
  const [telegramBotUsername, setTelegramBotUsername] = useState("SurvivorArena_bot");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requirements = useMemo(() => getPasswordRequirements(password), [password]);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!username.trim() || !phone.trim()) {
      setMessage("Inserisci username e numero di telefono associato.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/password-reset-request", {
        body: JSON.stringify({ phone, username }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = await readApiResponse(response);

      if (!data.ok) {
        setMessage(data.message);
        return;
      }

      if (data.requiresTelegramStart && data.telegramStartUrl) {
        setTelegramAppStartUrl(data.telegramAppStartUrl || "");
        setTelegramStartUrl(data.telegramStartUrl);
        setTelegramBotUsername(data.telegramBotUsername || "SurvivorArena_bot");
        setStep("confirm");
        setMessage(data.message || "Apri Telegram per ricevere il codice di recupero.");
        window.location.href = data.telegramAppStartUrl || data.telegramStartUrl;
        return;
      }

      setStep("confirm");
      setMessage("Codice inviato su Telegram.");
    } catch {
      setMessage("Connessione non riuscita. Controlla la rete e riprova.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const passwordError = validatePassword(password);
    if (passwordError) {
      setMessage(passwordError);
      return;
    }

    const confirmError = validateConfirmPassword(password, confirmPassword);
    if (confirmError) {
      setMessage(confirmError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/password-reset-confirm", {
        body: JSON.stringify({
          code,
          confirmPassword,
          password,
          phone,
          username,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = await readApiResponse(response);

      if (!data.ok) {
        setMessage(data.message);
        return;
      }

      setStep("done");
      setMessage("");
    } catch {
      setMessage("Connessione non riuscita. Controlla la rete e riprova.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <BrandLogo />
        <h1 className="auth-header-title">Recupero</h1>
        <Link aria-label="Torna al login" className="auth-close-button" href="/login">
          <svg aria-hidden="true" className="auth-icon" viewBox="0 0 24 24">
            <path d="m6 6 12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </Link>
      </header>

      <section className="auth-shell" aria-labelledby="forgot-title">
        <Card className="auth-card">
          <div className="auth-card-heading">
            <p className="auth-kicker">Survivor Arena</p>
            <h2 className="auth-title" id="forgot-title">
              Recupera <span className="auth-title-accent">Password</span>
            </h2>
            <p className="auth-subtitle">
              Inserisci username e numero di telefono. Se corrispondono,
              riceverai il codice sul bot Telegram.
            </p>
            <PremiumDivider />
          </div>

          {message ? (
            <p
              className={cn(
                "auth-form-message",
                step === "confirm" && (message.includes("inviato") || Boolean(telegramStartUrl))
                  ? "auth-form-message-success"
                  : "auth-form-message-error",
              )}
              role="alert"
            >
              {message}
            </p>
          ) : null}

          {step === "request" ? (
            <form className="auth-form" onSubmit={requestReset}>
              <div className="ui-field">
                <label className="ui-field-label" htmlFor="reset-username">
                  Username
                </label>
                <input
                  className="ui-input"
                  id="reset-username"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Inserisci username"
                  value={username}
                />
              </div>
              <div className="ui-field">
                <label className="ui-field-label" htmlFor="reset-phone">
                  Numero di telefono
                </label>
                <input
                  autoComplete="tel"
                  className="ui-input"
                  id="reset-phone"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Inserisci il numero associato"
                  type="tel"
                  value={phone}
                />
              </div>
              <Button className="auth-submit-button" disabled={isSubmitting} type="submit">
                {isSubmitting ? "INVIO..." : "INVIA CODICE TELEGRAM"}
              </Button>
              <ButtonLink className="auth-inline-link" href="/login" variant="secondary">
                Torna al login
              </ButtonLink>
            </form>
          ) : null}

          {step === "confirm" ? (
            <form className="auth-form" onSubmit={confirmReset}>
              {telegramStartUrl ? (
                <div className="auth-telegram-panel">
                  <h3>Apri Telegram</h3>
                  <p>
                    Il browser resta qui con il campo codice. Se Telegram non si apre
                    automaticamente, usa il pulsante qui sotto.
                  </p>
                  <a
                    className="ui-button ui-button-primary auth-telegram-button w-full sm:w-auto"
                    href={telegramAppStartUrl || telegramStartUrl}
                  >
                    <TelegramIcon className="auth-telegram-button-icon" />
                    Apri app Telegram
                  </a>
                  <ButtonLink
                    className="auth-inline-link"
                    href={telegramStartUrl}
                    rel="noreferrer"
                    target="_blank"
                    variant="secondary"
                  >
                    Apri via web @{telegramBotUsername}
                  </ButtonLink>
                </div>
              ) : null}

              <div className="ui-field">
                <label className="ui-field-label" htmlFor="reset-code">
                  Codice Telegram
                </label>
                <input
                  autoComplete="one-time-code"
                  className="ui-input"
                  id="reset-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Inserisci il codice"
                  value={code}
                />
              </div>
              <div className="ui-field">
                <label className="ui-field-label" htmlFor="reset-password">
                  Nuova password
                </label>
                <input
                  autoComplete="new-password"
                  className="ui-input"
                  id="reset-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Crea una nuova password"
                  type="password"
                  value={password}
                />
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
              </div>
              <div className="ui-field">
                <label className="ui-field-label" htmlFor="reset-confirm-password">
                  Conferma password
                </label>
                <input
                  autoComplete="new-password"
                  className="ui-input"
                  id="reset-confirm-password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Ripeti la password"
                  type="password"
                  value={confirmPassword}
                />
              </div>
              <Button className="auth-submit-button" disabled={isSubmitting} type="submit">
                {isSubmitting ? "SALVATAGGIO..." : "SALVA NUOVA PASSWORD"}
              </Button>
              <button className="auth-back-button" onClick={() => setStep("request")} type="button">
                <span aria-hidden="true">&larr;</span>
                Cambia account
              </button>
            </form>
          ) : null}

          {step === "done" ? (
            <div className="auth-form auth-complete-panel">
              <p className="auth-form-message auth-form-message-success">
                Password aggiornata. Ora puoi accedere.
              </p>
              <Button onClick={() => router.push("/login")} type="button">
                Vai al login
              </Button>
            </div>
          ) : null}
        </Card>
      </section>
    </main>
  );
}

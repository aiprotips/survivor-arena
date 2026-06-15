"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import { TelegramIcon } from "@/components/ui/TelegramIcon";
import { cn } from "@/lib/cn";

type TelegramStatusResponse =
  | {
      isLinked: boolean;
      isVerified: boolean;
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

type TelegramLinkResponse =
  | {
      ok: true;
      telegramBotUsername: string;
      telegramStartUrl: string;
    }
  | {
      message: string;
      ok: false;
    };

type VerifyResponse =
  | {
      message: string;
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

export function TelegramVerificationPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [startUrl, setStartUrl] = useState("");
  const [botUsername, setBotUsername] = useState("SurvivorArena_bot");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/account/telegram-link", {
          credentials: "include",
        });
        const data = (await response.json()) as TelegramStatusResponse;

        if (!isMounted) {
          return;
        }

        if (!data.ok) {
          router.replace("/login");
          return;
        }

        if (data.isVerified) {
          router.replace("/dashboard");
          return;
        }

        setIsLinked(data.isLinked);
      } catch {
        if (isMounted) {
          setMessage("Verifica non disponibile. Riprova tra poco.");
        }
      }
    }

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function requestTelegramCode() {
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/telegram-link", {
        body: JSON.stringify({ purpose: "verify" }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as TelegramLinkResponse;

      if (!data.ok) {
        setMessage(data.message);
        return;
      }

      setStartUrl(data.telegramStartUrl);
      setBotUsername(data.telegramBotUsername);
      setMessage("Apri Telegram, premi Avvia e inserisci qui il codice OTP ricevuto.");
      window.open(data.telegramStartUrl, "_blank", "noopener,noreferrer");
    } catch {
      setMessage("Non riesco ad aprire Telegram. Riprova tra poco.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!code.trim()) {
      setMessage("Inserisci il codice OTP ricevuto su Telegram.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/account/telegram-verify", {
        body: JSON.stringify({ code }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as VerifyResponse;

      if (!data.ok) {
        setMessage(data.message);
        return;
      }

      router.replace("/dashboard");
    } catch {
      setMessage("Verifica non riuscita. Riprova tra poco.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <BrandLogo />
        <h1 className="auth-header-title">Verifica</h1>
        <Link aria-label="Torna alla homepage" className="auth-close-button" href="/">
          <svg aria-hidden="true" className="auth-icon" viewBox="0 0 24 24">
            <path d="m6 6 12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </Link>
      </header>

      <section className="auth-shell" aria-labelledby="telegram-title">
        <Card className="auth-card auth-telegram-verify-card">
          <div className="auth-card-heading">
            <span className="auth-telegram-emblem" aria-hidden="true">
              <TelegramIcon className="auth-telegram-emblem-icon" />
            </span>
            <p className="auth-kicker">Primo accesso</p>
            <h2 className="auth-title" id="telegram-title">
              Verifica <span className="auth-title-accent">Telegram</span>
            </h2>
            <p className="auth-subtitle">
              Richiedi il codice OTP per convalidare il tuo account su Telegram.
            </p>
            <PremiumDivider />
          </div>

          {message ? (
            <p
              className={cn(
                "auth-form-message",
                startUrl || isLinked
                  ? "auth-form-message-success"
                  : "auth-form-message-error",
              )}
              role="alert"
            >
              {message}
            </p>
          ) : null}

          <div className="auth-telegram-panel">
            <h3>Apri il bot Survivor Arena</h3>
            <p>
              Telegram ti invierà il codice. Dopo averlo ricevuto, torna qui e
              completa la verifica.
            </p>
            <Button
              className="auth-telegram-button"
              disabled={isSubmitting}
              onClick={requestTelegramCode}
              type="button"
            >
              <TelegramIcon className="auth-telegram-button-icon" />
              {isSubmitting ? "APERTURA..." : "RICHIEDI CODICE OTP"}
            </Button>
            {startUrl ? (
              <ButtonLink
                className="auth-inline-link"
                href={startUrl}
                rel="noreferrer"
                target="_blank"
                variant="secondary"
              >
                Apri @{botUsername}
              </ButtonLink>
            ) : null}
          </div>

          <form className="auth-form" onSubmit={verifyCode}>
            <div className="ui-field">
              <label className="ui-field-label" htmlFor="telegram-otp">
                Codice OTP
              </label>
              <span className="ui-input-wrap">
                <span className="ui-input-leading-icon" aria-hidden="true">
                  <TelegramIcon className="auth-icon" />
                </span>
                <input
                  autoComplete="one-time-code"
                  className={cn("ui-input ui-input-with-icon", code && "ui-input-valid")}
                  id="telegram-otp"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Inserisci il codice"
                  value={code}
                />
              </span>
              <p className="ui-field-help">Il codice scade dopo pochi minuti.</p>
            </div>

            <Button className="auth-submit-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "VERIFICA..." : "CONVALIDA ACCOUNT"}
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}

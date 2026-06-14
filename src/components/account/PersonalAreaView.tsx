"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/home/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";

type SessionUser = {
  user_code: string;
  username: string;
};

type SessionResponse =
  | {
      ok: true;
      user: SessionUser;
    }
  | {
      message: string;
      ok: false;
    };

export function PersonalAreaView() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/session", {
          credentials: "include",
        });
        const data = (await response.json()) as SessionResponse;

        if (!isMounted) {
          return;
        }

        if (!data.ok) {
          router.replace("/login");
          return;
        }

        setUser(data.user);
      } catch {
        if (isMounted) {
          setMessage("Sessione non verificabile. Riprova tra poco.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/logout", {
      credentials: "include",
      method: "POST",
    });
    router.replace("/");
  };

  return (
    <main className="auth-page account-page">
      <header className="auth-header">
        <BrandLogo />
        <h1 className="auth-header-title">Area Personale</h1>
        <Link aria-label="Torna alla homepage" className="auth-close-button" href="/">
          <svg aria-hidden="true" className="auth-icon" viewBox="0 0 24 24">
            <path d="m6 6 12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </Link>
      </header>

      <section className="auth-shell account-shell" aria-labelledby="account-title">
        <Card className="auth-card account-card">
          <div className="auth-card-heading">
            <p className="auth-kicker">Survivor Arena</p>
            <h2 className="auth-title account-title" id="account-title">
              Benvenuto nella tua Area Personale
            </h2>
            <p className="auth-subtitle">Accesso effettuato correttamente.</p>
            <PremiumDivider />
          </div>

          {isLoading ? (
            <p className="auth-form-message">Verifica sessione in corso...</p>
          ) : null}

          {message ? (
            <p className="auth-form-message auth-form-message-error" role="alert">
              {message}
            </p>
          ) : null}

          {user ? (
            <>
              <div className="account-summary">
                <div className="account-summary-item">
                  <span>Username</span>
                  <strong>{user.username}</strong>
                </div>
                <div className="account-summary-item">
                  <span>Codice utente</span>
                  <strong>{user.user_code}</strong>
                </div>
              </div>

              <Button
                className="auth-register-button account-logout-button"
                onClick={handleLogout}
                type="button"
                variant="secondary"
              >
                Logout
              </Button>
            </>
          ) : null}
        </Card>
      </section>
    </main>
  );
}

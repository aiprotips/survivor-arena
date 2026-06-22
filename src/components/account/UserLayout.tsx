"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import { MobileUserMenu } from "@/components/account/MobileUserMenu";
import { UserHeader } from "@/components/account/UserHeader";
import type { AccountUser, UserAreaPageKey } from "@/components/account/types";

type SessionResponse =
  | {
      ok: true;
      user: AccountUser;
    }
  | {
      message: string;
      ok: false;
    };

type UserLayoutProps = {
  children: (user: AccountUser) => ReactNode;
  currentPage: UserAreaPageKey;
};

type PopupMessage = {
  body: string;
  created_at: string;
  id: string;
  title: string;
};

const demoBalance = "0 Coppe";

function formatCups(value: number) {
  return `${value.toLocaleString("it-IT")} Coppe`;
}

export function UserLayout({ children, currentPage }: UserLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [popupMessages, setPopupMessages] = useState<PopupMessage[]>([]);

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

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    async function loadPopupMessages() {
      try {
        const response = await fetch("/api/messages/popup", {
          credentials: "include",
        });
        const data = (await response.json()) as
          | {
              messages: PopupMessage[];
              ok: true;
            }
          | {
              ok: false;
            };

        if (isMounted && data.ok) {
          setPopupMessages(data.messages);
        }
      } catch {
        // I messaggi admin non devono bloccare l'accesso all'area utente.
      }
    }

    loadPopupMessages();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await fetch("/api/logout", {
      credentials: "include",
      method: "POST",
    });
    router.replace("/");
  };

  const handleDismissPopup = async () => {
    const messageToClose = popupMessages[0];
    if (!messageToClose) {
      return;
    }

    setPopupMessages((current) => current.slice(1));

    await fetch(`/api/messages/${messageToClose.id}`, {
      credentials: "include",
      method: "POST",
    }).catch(() => undefined);
  };

  if (isLoading || !user) {
    return (
      <main className="user-page">
        <section className="user-loading-shell" aria-live="polite">
          <Card className="user-loading-card">
            <p>{message || "Verifica sessione in corso..."}</p>
          </Card>
        </section>
      </main>
    );
  }

  const balance = formatCups(user.cup_balance ?? 0);

  return (
    <main className="user-page" data-page={currentPage}>
      <UserHeader
        balance={balance || demoBalance}
        onLogout={handleLogout}
        onMenuOpen={() => setIsMenuOpen(true)}
        user={user}
      />

      <MobileUserMenu
        balance={balance || demoBalance}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLogout={handleLogout}
        user={user}
      />

      <div className="user-main-shell">{children(user)}</div>

      {popupMessages[0] ? (
        <div className="user-message-modal" role="dialog" aria-modal="true" aria-labelledby="user-popup-title">
          <Card className="user-message-modal-card">
            <p className="user-page-kicker">Survivor Arena</p>
            <h2 id="user-popup-title">{popupMessages[0].title}</h2>
            <PremiumDivider />
            <p>{popupMessages[0].body}</p>
            <Button onClick={handleDismissPopup} type="button">
              Ho capito
            </Button>
          </Card>
        </div>
      ) : null}
    </main>
  );
}

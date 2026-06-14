"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
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

const demoBalance = "0 Coppe";

export function UserLayout({ children, currentPage }: UserLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  return (
    <main className="user-page" data-page={currentPage}>
      <UserHeader
        balance={demoBalance}
        onLogout={handleLogout}
        onMenuOpen={() => setIsMenuOpen(true)}
        user={user}
      />

      <MobileUserMenu
        balance={demoBalance}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLogout={handleLogout}
        user={user}
      />

      <div className="user-main-shell">{children(user)}</div>
    </main>
  );
}

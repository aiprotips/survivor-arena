"use client";

import { useEffect, useState } from "react";
import { UserAreaPage } from "@/components/account/UserAreaPage";
import { PublicArenasPreview } from "@/components/public/PublicArenasPreview";
import { PublicClassifichePreview } from "@/components/public/PublicClassifichePreview";

type PublicAwareUserPageProps = {
  page: "arene" | "classifiche";
};

type SessionCheck = {
  ok?: boolean;
};

export function PublicAwareUserPage({ page }: PublicAwareUserPageProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      try {
        const response = await fetch("/api/session", {
          credentials: "include",
        });
        const data = (await response.json()) as SessionCheck;

        if (isMounted) {
          setIsLoggedIn(Boolean(response.ok && data?.ok));
        }
      } catch {
        if (isMounted) {
          setIsLoggedIn(false);
        }
      }
    }

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoggedIn) {
    return <UserAreaPage page={page} />;
  }

  if (page === "classifiche") {
    return <PublicClassifichePreview />;
  }

  return <PublicArenasPreview />;
}

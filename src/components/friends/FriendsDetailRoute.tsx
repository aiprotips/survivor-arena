"use client";

import { useEffect, useState } from "react";
import { UserAreaPage } from "@/components/account/UserAreaPage";
import { Card } from "@/components/ui/Card";

type FriendsDetailRouteProps = {
  type: "manager" | "tournament";
};

export function FriendsDetailRoute({ type }: FriendsDetailRouteProps) {
  const [competitionId, setCompetitionId] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setCompetitionId(new URLSearchParams(window.location.search).get("id") ?? "");
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  if (competitionId === null) {
    return (
      <Card>
        <p>Caricamento torneo...</p>
      </Card>
    );
  }

  return (
    <UserAreaPage
      friendsCompetitionId={competitionId || "__missing__"}
      page={type === "manager" ? "area-manager" : "friends-tournament"}
    />
  );
}

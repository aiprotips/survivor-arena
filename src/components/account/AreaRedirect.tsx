"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AreaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="user-page">
      <section className="user-loading-shell" aria-live="polite">
        <p>Reindirizzamento alla dashboard...</p>
      </section>
    </main>
  );
}
